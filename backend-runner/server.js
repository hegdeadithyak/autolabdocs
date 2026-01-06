const WebSocket = require('ws');
const pty = require('node-pty');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const { spawnSync, exec } = require('child_process');

// Force deploy trigger
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// --- CONCURRENCY CONTROL ---
const MAX_CONCURRENT_CONTAINERS = parseInt(process.env.MAX_CONCURRENT || '200', 10);
let activeContainers = 0;
const queue = [];

function updateQueuePositions() {
    queue.forEach((item, index) => {
        if (item.ws.readyState === WebSocket.OPEN) {
            item.ws.send(JSON.stringify({
                type: 'status',
                data: `Queued (Position: ${index + 1})`
            }));
        }
    });
}

function processQueue() {
    if (activeContainers >= MAX_CONCURRENT_CONTAINERS || queue.length === 0) return;

    const next = queue.shift();
    updateQueuePositions(); // Notify others they moved up
    
    // Start the next job
    startContainer(next.ws, next.sessionId, next.sessionDir, next.code, next.filename);
}

// Diagnostic: Check Docker availability
try {
    console.log('--- Startup Diagnostics ---');
    console.log('VERSION: 2026-01-02-QUEUE-V1');
    const dockerVersion = spawnSync('docker', ['--version']);
    if (dockerVersion.error) {
        console.error('Failed to find docker binary:', dockerVersion.error);
    } else {
        console.log('Docker binary found:', dockerVersion.stdout.toString().trim());
    }

    const dockerImages = spawnSync('docker', ['images']);
    if (dockerImages.error) {
        console.error('Failed to list images (socket issue?):', dockerImages.error);
    } else {
        console.log('Docker images accessible:\n', dockerImages.stdout.toString());
    }
    console.log(`Max Concurrent: ${MAX_CONCURRENT_CONTAINERS}`);
    console.log('---------------------------');
} catch (e) {
    console.error('Diagnostic check failed:', e);
}

const RUNTIME_IMAGE = 'python-runner:latest'; // Assumes image is built
const TEMP_DIR = path.join(os.tmpdir(), 'code-runner');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

wss.on('connection', (ws) => {
    const sessionId = uuidv4();
    const sessionDir = path.join(TEMP_DIR, sessionId);
    let ptyProcess = null;

    console.log(`[${sessionId}] Connected`);

    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        if (data.type === 'init') {
            // --- QUEUE LOGIC ---
            if (activeContainers >= MAX_CONCURRENT_CONTAINERS) {
                console.log(`[${sessionId}] Queued. Active: ${activeContainers}/${MAX_CONCURRENT_CONTAINERS}`);
                queue.push({ ws, sessionId, sessionDir, code: data.code, filename: data.filename });
                ws.send(JSON.stringify({ type: 'status', data: `Server busy. Queued (Position: ${queue.length})` }));
            } else {
                startContainer(ws, sessionId, sessionDir, data.code, data.filename).then(p => ptyProcess = p);
            }
        } else if (data.type === 'input' && ptyProcess) {
            ptyProcess.write(data.data);
        } else if (data.type === 'resize' && ptyProcess) {
            ptyProcess.resize(data.cols, data.rows);
        }
    });

    ws.on('close', () => {
        // If user disconnects while in queue, remove them
        const queueIndex = queue.findIndex(item => item.sessionId === sessionId);
        if (queueIndex !== -1) {
            queue.splice(queueIndex, 1);
            updateQueuePositions();
            console.log(`[${sessionId}] Removed from queue (Disconnect)`);
        }
        cleanup(sessionId, sessionDir, ptyProcess);
    });
});

// Refactored "start" logic into a separate function
async function startContainer(ws, sessionId, sessionDir, code, filename = 'main.py') {
    activeContainers++;
    console.log(`[${sessionId}] Starting. Active: ${activeContainers}/${MAX_CONCURRENT_CONTAINERS}`);
    
    try {
        const ptyProcess = await handleInit(ws, sessionId, sessionDir, code, filename);
        return ptyProcess;
    } catch (err) {
        // Handle init failure by releasing slot
        activeContainers--;
        processQueue();
        return null;
    }
}

async function handleInit(ws, sessionId, sessionDir, code, filename = 'main.py') {
    try {
        // 1. Setup Host Environment
        fs.mkdirSync(sessionDir, { recursive: true });
        const filePath = path.join(sessionDir, filename);
        
        // Ensure parent directory exists (for nested paths like 'src/main.py')
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, code);

        // Determine run command based on extension
        const ext = path.extname(filename).toLowerCase();
        let runCommand;
        
        if (ext === '.py') {
            // Debugging: List files to confirm copy success, then run
            runCommand = ['sh', '-c', `python3 -u "/code/${filename}"`];
        } else if (ext === '.js') {
            runCommand = ['node', `/code/${filename}`];
        } else if (ext === '.cpp') {
            // For C++, we compile then run. We need a shell for this.
            // Added ls -la for debugging "No such file" errors
            runCommand = ['sh', '-c', `g++ /code/${filename} -o /code/a.out && /code/a.out`];
        } else {
            // Default or plaintext
             runCommand = ['cat', `/code/${filename}`];
        }

        // 2. Prepare Container (Create -> Copy -> Start)
        // This avoids volume mounting issues in Docker-in-Docker (DooD) scenarios
        
        const createArgs = [
            'create',
            '-i',                       // Interactive (Keep STDIN open)
            '--name', `runner-${sessionId}`,
            '--network', 'none',        // DISABLE NETWORKING
            '--cpus', '0.5',           // Limit CPU
            '--memory', '256m',        // Limit RAM
            '--pids-limit', '64',      // Anti-fork bomb
            '--user', '1000:1000',      // Non-root user
            // No volume mount (-v) here. We copy files next.
            RUNTIME_IMAGE,
            ...runCommand
        ];

        // Create the container
        const createResult = spawnSync('docker', createArgs);
        if (createResult.error || createResult.status !== 0) {
            throw new Error(`Failed to create container: ${createResult.stderr?.toString() || createResult.error}`);
        }

        // Copy code into container
        // Note: filePath is the local path, destination is inside container
        const cpResult = spawnSync('docker', ['cp', filePath, `runner-${sessionId}:/code/${filename}`]);
        if (cpResult.error || cpResult.status !== 0) {
            throw new Error(`Failed to copy code to container: ${cpResult.stderr?.toString() || cpResult.error}`);
        }

        // 3. Spawn Docker Start via PTY
        // We use 'start -ai' to attach to the existing container created above
        const startArgs = [
            'start',
            '-ai',
            `runner-${sessionId}`
        ];

        // pty.spawn handles the pseudo-terminal logic
        const ptyProcess = pty.spawn('docker', startArgs, {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: sessionDir,
            env: process.env
        });

        // 4. Wiring
        ptyProcess.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'output', data: data }));
            }
        });

        ptyProcess.onExit((res) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'exit', code: res.exitCode }));
                ws.close();
            }
            // Logic handled in cleanup
        });

        return ptyProcess;

    } catch (err) {
        console.error(`[${sessionId}] Error:`, err);
        ws.send(JSON.stringify({ type: 'error', data: 'Failed to start execution: ' + err.message }));
        ws.close();
        // Don't call cleanup here, it's called by the close handler
        return null;
    }
}

function cleanup(sessionId, dir, process) {
    console.log(`[${sessionId}] Cleaning up`);
    
    // Kill the PTY process (which kills the docker client)
    if (process) {
        try { process.kill(); } catch (e) {}
    }

    // Force remove container (kills and removes)
    exec(`docker rm -f runner-${sessionId}`, () => {});

    // Remove temp files
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
        console.error(`[${sessionId}] Failed to clean dir:`, e.message);
    }

    // --- QUEUE LOGIC ---
    // Only decrement if this session was actually active (not just queued and quit)
    // We check this by ensuring it wasn't in the queue (handled in ws.close)
    // But since cleanup is called on close, we need to be careful.
    // Simplified: We decrement activeContainers whenever a RUNNING container finishes.
    
    // A robust way: `activeContainers` is only incremented in `startContainer`.
    // We need to know if *this* session was a started container.
    // The easiest way is to decrement blindly *if* we know it started. 
    // BUT `cleanup` is called for everyone. 
    
    // BETTER FIX: Check if we are "releasing" a slot.
    // We'll rely on a flag or check if the process existed.
    if (process) { 
        activeContainers--;
        if (activeContainers < 0) activeContainers = 0;
        processQueue(); // Start next
    }
}

console.log(`Runner Service listening on port ${PORT}`);