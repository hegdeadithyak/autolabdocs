const WebSocket = require('ws');

// Configuration
// Usage: WS_URL=ws://YOUR_IP:8080 CLIENTS=10 node load-test.js
const TARGET_URL = process.env.WS_URL || 'ws://ec2-13-203-158-119.ap-south-1.compute.amazonaws.com:8080';
const CONCURRENT_CLIENTS =10000;
const DURATION_DELAY = 1; // Seconds for the code to run (simulates work)

console.log(`
🚀 Starting Load Test`);
console.log(`Target:  ${TARGET_URL}`);
console.log(`Clients: ${CONCURRENT_CLIENTS}`);
console.log(`-----------------------------------`);

let success = 0;
let errors = 0;
const start = Date.now();

function runClient(id) {
    return new Promise((resolve) => {
        const ws = new WebSocket(TARGET_URL);
        const clientStart = Date.now();
        let receivedOutput = false;
        let logs = [];

        // Timeout safety
        const timeout = setTimeout(() => {
            console.log(`[Client ${id}] ❌ Timeout (15s)`);
            ws.terminate();
            errors++;
            resolve();
        }, 15000);

        ws.on('open', () => {
            // Send Python code that sleeps to simulate work and prints unique ID
            const code = `import time\nprint(\"START-${id}\")\ntime.sleep(${DURATION_DELAY})\nprint(\"END-${id}\")`;
            ws.send(JSON.stringify({
                type: 'init',
                code: code,
                filename: 'main.py'
            }));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data);
            if (msg.type === 'output') {
                logs.push(msg.data.trim());
                if (msg.data.includes(`END-${id}`)) {
                    receivedOutput = true;
                }
            }
            if (msg.type === 'error') {
                console.error(`[Client ${id}] ❌ Server Error: ${msg.data}`);
            }
        });

        ws.on('close', () => {
            clearTimeout(timeout);
            const duration = Date.now() - clientStart;
            
            if (receivedOutput) {
                console.log(`[Client ${id}] ✅ Success (${duration}ms)`);
                success++;
            } else {
                console.log(`[Client ${id}] ⚠️ Failed - Output: [${logs.join(', ')}]`);
                errors++;
            }
            resolve();
        });

        ws.on('error', (e) => {
            console.error(`[Client ${id}] ❌ Connection Error: ${e.message}`);
            errors++;
            resolve();
        });
    });
}

async function run() {
    const promises = [];
    for (let i = 0; i < CONCURRENT_CLIENTS; i++) {
        promises.push(runClient(i + 1));
        // Small stagger to prevent local network bottleneck
        await new Promise(r => setTimeout(r, 100)); 
    }

    await Promise.all(promises);

    const totalTime = Date.now() - start;
    console.log(`
=== Test Summary ===`);
    console.log(`Total Duration: ${totalTime / 1000}s`);
    console.log(`Successful:     ${success}`);
    console.log(`Failed:         ${errors}`);
    
    if (errors > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

run();
