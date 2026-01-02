const WebSocket = require('ws');
const pty = require('node-pty');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const { spawnSync, exec } = require('child_process');

// Force deploy trigger
const wss = new WebSocket.Server({ port: 8080 });

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
            ptyProcess = await handleInit(ws, sessionId, sessionDir, data.code, data.filename);
        } else if (data.type === 'input' && ptyProcess) {
            ptyProcess.write(data.data);
        } else if (data.type === 'resize' && ptyProcess) {
            ptyProcess.resize(data.cols, data.rows);
        }
    });

    ws.on('close', () => {
        cleanup(sessionId, sessionDir, ptyProcess);
    });
});

async function handleInit(ws, sessionId, sessionDir, code, filename = 'main.py') {
    try {
        // 1. Setup Host Environment
        fs.mkdirSync(sessionDir, { recursive: true });
        const filePath = path.join(sessionDir, filename);
        fs.writeFileSync(filePath, code);

        // Determine run command based on extension
        const ext = path.extname(filename).toLowerCase();
        let runCommand;
        
        if (ext === '.py') {
            runCommand = ['python3', '-u', `/home/runner/${filename}`];
        } else if (ext === '.js') {
            runCommand = ['node', `/home/runner/${filename}`];
        } else if (ext === '.cpp') {
            // For C++, we compile then run. We need a shell for this.
            // We'll write a simple runner script or use sh -c
            runCommand = ['sh', '-c', `g++ /home/runner/${filename} -o /home/runner/a.out && /home/runner/a.out`];
        } else {
            // Default or plaintext
             runCommand = ['cat', `/home/runner/${filename}`];
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
        const cpResult = spawnSync('docker', ['cp', filePath, `runner-${sessionId}:/home/runner/${filename}`]);
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
        });

        return ptyProcess;

    } catch (err) {
        console.error(`[${sessionId}] Error:`, err);
        ws.send(JSON.stringify({ type: 'error', data: 'Failed to start execution.' }));
        ws.close();
        cleanup(sessionId, sessionDir, null); // Ensure cleanup on init failure
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
}

console.log('Runner Service listening on port 8080');