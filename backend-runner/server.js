const WebSocket = require('ws');
const http = require('http');
const pty = require('node-pty');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

const RUNTIME_IMAGE = 'python-runner:latest';
const TEMP_DIR = path.join(os.tmpdir(), 'code-runner');

// Ensure temp dir exists
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            connections: wss.clients.size 
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

// Attach WebSocket server to HTTP server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    const sessionId = uuidv4();
    const sessionDir = path.join(TEMP_DIR, sessionId);
    let ptyProcess = null;

    console.log(`[${sessionId}] Client connected. Total clients: ${wss.clients.size}`);

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'init') {
                ptyProcess = await handleInit(ws, sessionId, sessionDir, data.code, data.filename);
            } else if (data.type === 'input' && ptyProcess) {
                ptyProcess.write(data.data);
            } else if (data.type === 'resize' && ptyProcess) {
                ptyProcess.resize(data.cols, data.rows);
            }
        } catch (err) {
            console.error(`[${sessionId}] Message error:`, err);
            ws.send(JSON.stringify({ type: 'error', data: 'Invalid message format' }));
        }
    });

    ws.on('close', () => {
        console.log(`[${sessionId}] Client disconnected. Total clients: ${wss.clients.size}`);
        cleanup(sessionId, sessionDir, ptyProcess);
    });

    ws.on('error', (err) => {
        console.error(`[${sessionId}] WebSocket error:`, err);
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
        let dockerArgs;
        
        if (ext === '.py') {
            runCommand = ['python3', '-u', `/code/${filename}`];
            dockerArgs = [
                'run',
                '--rm',
                '-i',
                '--name', `runner-${sessionId}`,
                '--network', 'none',
                '--cpus', '0.5',
                '--memory', '256m',
                '--pids-limit', '64',
                '--user', '1000:1000',
                '-v', `${filePath}:/code/${filename}:ro`,
                '-w', '/code',
                RUNTIME_IMAGE,
                ...runCommand
            ];
        } else if (ext === '.js') {
            runCommand = ['node', `/code/${filename}`];
            dockerArgs = [
                'run',
                '--rm',
                '-i',
                '--name', `runner-${sessionId}`,
                '--network', 'none',
                '--cpus', '0.5',
                '--memory', '256m',
                '--pids-limit', '64',
                '--user', '1000:1000',
                '-v', `${filePath}:/code/${filename}:ro`,
                '-w', '/code',
                RUNTIME_IMAGE,
                ...runCommand
            ];
        } else if (ext === '.cpp' || ext === '.c') {
            // For C/C++, we need a writable workspace for compilation
            // Mount the entire session directory to allow compilation output
            const compiler = ext === '.cpp' ? 'g++' : 'gcc';
            runCommand = ['sh', '-c', `${compiler} /code/${filename} -o /tmp/a.out && /tmp/a.out`];
            
            dockerArgs = [
                'run',
                '--rm',
                '-i',
                '--name', `runner-${sessionId}`,
                '--network', 'none',
                '--cpus', '0.5',
                '--memory', '256m',
                '--pids-limit', '64',
                '--user', '1000:1000',
                '-v', `${filePath}:/code/${filename}:ro`,
                '-w', '/code',
                '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m',  // Writable tmpfs for compilation output
                RUNTIME_IMAGE,
                'sh', '-c', runCommand[2]
            ];
        } else {
            // Default: just cat the file
            runCommand = ['cat', `/code/${filename}`];
            dockerArgs = [
                'run',
                '--rm',
                '-i',
                '--name', `runner-${sessionId}`,
                '--network', 'none',
                '--cpus', '0.5',
                '--memory', '256m',
                '--pids-limit', '64',
                '--user', '1000:1000',
                '-v', `${filePath}:/code/${filename}:ro`,
                '-w', '/code',
                RUNTIME_IMAGE,
                ...runCommand
            ];
        }

        console.log(`[${sessionId}] Starting Docker container for ${filename}`);
        console.log(`[${sessionId}] Command:`, dockerArgs.join(' '));

        const cmd = 'docker';
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
            console.log(`[${sessionId}] Process exited with code:`, res.exitCode);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'exit', code: res.exitCode }));
                ws.close();
            }
        });

        return ptyProcess;

    } catch (err) {
        console.error(`[${sessionId}] Init error:`, err);
        ws.send(JSON.stringify({ type: 'error', data: 'Failed to start execution: ' + err.message }));
        ws.close();
    }
}

function cleanup(sessionId, dir, process) {
    console.log(`[${sessionId}] Cleaning up`);
    
    if (process) {
        try { 
            process.kill(); 
        } catch (e) {
            console.error(`[${sessionId}] Failed to kill process:`, e.message);
        }
    }

    require('child_process').exec(`docker kill runner-${sessionId} 2>/dev/null`, () => {});

    try {
        fs.rmSync(dir, { recursive: true, force: true });
    } catch (e) {
        console.error(`[${sessionId}] Failed to clean dir:`, e.message);
    }
}

// Start server on all interfaces
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`✓ Runner Service listening on ${HOST}:${PORT}`);
    console.log(`✓ HTTP health check available at http://${HOST}:${PORT}/health`);
    console.log(`✓ WebSocket available at ws://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});