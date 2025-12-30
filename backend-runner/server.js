const WebSocket = require('ws');
const pty = require('node-pty');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

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

        // 2. Spawn Docker via PTY
        // Note: We mount the host path to the container
        
        const cmd = 'docker';
        const args = [
            'run',
            '--rm',                     // Cleanup container on exit
            '-i',                       // Interactive (Keep STDIN open)
            '--name', `runner-${sessionId}`,
            '--network', 'none',        // DISABLE NETWORKING
            '--cpus', '0.5',           // Limit CPU
            '--memory', '128m',        // Limit RAM
            '--pids-limit', '64',      // Anti-fork bomb
            '--read-only',              // Read-only filesystem
            '--user', '1000:1000',      // Non-root user
            '-v', `${filePath}:/home/runner/${filename}:ro`, // Read-only code mount
            // We need write access to /tmp or home for C++ output? 
            // The image sets WORKDIR /home/runner. If we use --read-only, we can't write a.out.
            // We'll mount a tmpfs for the build artifacts if needed, or drop read-only for now for C++ compatibility simply.
            // For simplicity in this environment, let's remove --read-only or mount a tmpfs at /home/runner/
            // But we already mount the file there.
            // Let's use --tmpfs /home/runner (but we need the file there).
            // Better: Mount the file at /home/runner/src/filename and compile to /tmp/a.out
            // OR: Just remove --read-only for this specific task to ensure it works smoothly with C++ output.
            // But to keep it safe, let's just allow writing to the container's overlay fs.
             
            RUNTIME_IMAGE,
            ...runCommand
        ];
        
        // Remove --read-only for C++ compilation (needs to write a.out)
        // Check if we need to remove it from the args list above?
        // I will reconstruct args to be safe.
        
        const dockerArgs = [
            'run',
            '--rm',
            '-i',
            '--name', `runner-${sessionId}`,
            '--network', 'none',
            '--cpus', '0.5',
            '--memory', '256m', // Increased for compilation
            '--pids-limit', '64',
            '--user', '1000:1000',
            '-v', `${filePath}:/home/runner/${filename}:ro`,
            RUNTIME_IMAGE,
            ...runCommand
        ];

        // pty.spawn handles the pseudo-terminal logic
        const ptyProcess = pty.spawn(cmd, dockerArgs, {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: sessionDir,
            env: process.env
        });

        // 3. Wiring
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
    }
}

function cleanup(sessionId, dir, process) {
    console.log(`[${sessionId}] Cleaning up`);
    
    // Kill the PTY process (which kills the docker client)
    if (process) {
        try { process.kill(); } catch (e) {}
    }

    // Force kill container just in case (race condition safety)
    require('child_process').exec(`docker kill runner-${sessionId}`, () => {});

    // Remove temp files
    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
        console.error(`[${sessionId}] Failed to clean dir:`, e.message);
    }
}

console.log('Runner Service listening on port 8080');
