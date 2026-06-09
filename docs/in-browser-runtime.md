# AutoLabDocs In-Browser Runtime

> How AutoLabDocs compiles and runs **C++, C, Python, and JavaScript entirely in
> the user's browser** — no execution server, no Docker, no backend compute.

Author & architect: **Adithya Hegde Kota**.

---

## 1. The idea

A programming language is just a way to hand instructions to a computer. The
"computer" that runs student code does **not** have to be a server we own — it
can be the user's *own machine*, reached through the one runtime every device
already ships with: **the web browser**.

Modern browsers can execute arbitrary native-speed code through **WebAssembly
(WASM)**. So AutoLabDocs ships the *toolchains themselves* (a Python
interpreter, a C/C++ compiler) compiled to WASM, plus a thin JavaScript host,
and runs everything client-side. The result:

- **Infinite scale, $0 compute** — each visitor runs on their own CPU.
- **Privacy** — code never leaves the tab.
- **No ops** — nothing to deploy, queue, or keep alive.

The old model (a Node.js `node-pty` service spawning Docker containers, reached
over WebSocket) has been fully removed. The browser *is* the runtime.

---

## 2. Architecture at a glance

```
 components/IdeWorkspace.tsx                 (the IDE / terminal UI)
        │  getRunnerForFile(filename).run({ code, onEvent })
        ▼
 lib/runtime/index.ts                        (engine selector + Runner)
        │  spawns a dedicated Web Worker per run
        ▼
 ┌─────────────┬──────────────────┬───────────────────────────┐
 │ js/worker   │ python/worker    │ cpp/worker                │
 │ new Function│ Pyodide (WASM)   │ clang+lld+libc++ (WASM)   │
 │             │                  │  → program.wasm → WASI    │
 └─────────────┴──────────────────┴───────────────────────────┘
        │  postMessage(RunEvent)        ▲  Atomics + SharedArrayBuffer
        ▼                               │  (blocking stdin)
   terminal output                  user keystrokes
```

Every engine speaks **one message protocol**, so the UI is identical regardless
of language. That protocol is the contract; the engines are interchangeable
implementations behind it.

---

## 3. The event protocol (`lib/runtime/index.ts`)

A `Runner` is what the IDE talks to:

```ts
interface Runner {
  run(opts: { code: string; filename: string; onEvent: (e: RunEvent) => void }): Promise<void>;
  sendInput(data: string): void;  // user typed a line in the terminal
  stop(): void;                   // kill the running program
}

type RunEvent =
  | { type: "output";        data: string }   // stdout / stderr chunk
  | { type: "input_request"; prompt?: string }// program is blocked on stdin
  | { type: "exit";          code: number }   // program finished
  | { type: "error";         data: string };  // exception / compile error
```

`getRunnerForFile(name)` picks the engine by file extension
(`.js/.mjs/.cjs → JS`, `.py → Python`, `.c/.cc/.cpp/.cxx/.h/.hpp → C/C++`) and
returns a `WorkerRunner`. The runner owns the worker lifecycle and forwards
worker `postMessage`s straight to `onEvent`. Because the protocol matches what
the terminal already consumed from the old WebSocket, swapping the server for
the browser was a near drop-in change.

---

## 4. Blocking stdin — the hard part

Interactive programs (`input()`, `std::cin >>`, `prompt()`) must **block** until
the user types something. You cannot block the main thread (it would freeze the
page), and `postMessage` is asynchronous — but the language runtimes call stdin
*synchronously*.

The solution is `SharedArrayBuffer` + `Atomics`:

1. The program runs inside a **Web Worker** (a real second thread).
2. Worker and main thread share one `SharedArrayBuffer`
   (`lib/runtime/stdinChannel.ts`).
3. When the program reads stdin, the worker:
   - `postMessage({ type: "input_request" })` so the UI shows a prompt,
   - then calls `Atomics.wait(...)` — which **blocks the worker thread** without
     touching the UI thread.
4. The user types and submits; the main thread writes the bytes into the shared
   buffer, sets a flag, and `Atomics.notify(...)`.
5. The worker wakes, decodes the bytes, and returns them to the program.

Buffer layout:

```
Int32[0] = control flag (0 = waiting, 1 = ready)
Int32[1] = payload byte length
bytes[8..] = UTF-8 input
```

### Why the COOP/COEP headers exist
`SharedArrayBuffer` is only available on **cross-origin-isolated** pages. So
`next.config.ts` sends:

```
Cross-Origin-Opener-Policy:  same-origin
Cross-Origin-Embedder-Policy: credentialless
```

`credentialless` is chosen (over `require-corp`) so cross-origin assets — the
Pyodide CDN, the external banner image, analytics — keep loading without each
needing CORP headers.

---

## 5. The engines

### 5.1 JavaScript (`lib/runtime/js/worker.ts`)
Zero downloads, instant. The worker:
- redirects `console.*` to `output` events,
- exposes a synchronous `prompt()` / `readline()` backed by the stdin channel,
- wraps user code in an `async` IIFE (`new Function`) so top-level `await`
  works, and runs it.
Errors (with stack) become `error` events.

### 5.2 Python (`lib/runtime/python/worker.ts`)
Real CPython via **[Pyodide](https://pyodide.org)** (CPython compiled to WASM):
- Pyodide is imported from its official CDN on first run (cached thereafter).
  `credentialless` isolation makes the CDN viable, so we don't vendor ~10MB of
  assets.
- `setStdout`/`setStderr` stream to `output`; `setStdin` is wired to the
  blocking stdin channel.
- `loadPackagesFromImports(code)` auto-installs imported packages — `numpy`,
  `pandas`, `matplotlib`, etc. — on demand.

### 5.3 C / C++ (`lib/runtime/cpp/worker.ts`)
A real **clang + lld + libc++ toolchain compiled to WASM** compiles *and* links
the program on the client; the resulting `program.wasm` is then executed through
a **WASI** runtime wired to stdout/stderr/stdin.

Because the toolchain is large (~tens of MB), it is **not** bundled. A setup
step installs it under `public/runtime/clang/` behind a small adapter
(`clang-runtime.mjs`) with a stable contract:

```ts
interface Toolchain {
  build(opts: { filename; source; std }): Promise<{ wasm: Uint8Array }>;
  run(opts: { wasm; stdout; stderr; readStdin }): Promise<number>;
}
```

See `scripts/fetch-runtimes.sh` and the contract documented in
`lib/runtime/cpp/worker.ts`. Compiler diagnostics surface as `error` events.

> **Status:** the JS and Python engines are production-ready. The C/C++ engine's
> wiring and contract are in place; it requires the WASM toolchain assets to be
> hosted (via `fetch-runtimes.sh`) and a real-browser validation pass.

---

## 6. Lifecycle: what happens on "Run"

1. `IdeWorkspace.handleRun` resolves the active file's language.
   Unsupported extension → friendly terminal message, no run.
2. A fresh `WorkerRunner` is created and `run()` spawns the language worker.
3. Worker emits `output` chunks → appended to the terminal **and** buffered into
   the file's `lastOutput` (so the exported lab document captures the run).
4. `input_request` → terminal focuses its input; the user's submitted line goes
   back via `sendInput` → the stdin channel.
5. `exit` → buffers are flushed onto the file (`lastOutput` / `lastInput` /
   `lastError`), `isRunning` clears.
6. **Stop** calls `runner.stop()` → `worker.terminate()`. This kills *anything*,
   including infinite loops — something the old container model couldn't do
   cleanly.

---

## 7. Extending it

To add a language, implement one worker that:
- listens for `{ type: "run", code, filename, sab }`,
- emits `output` / `input_request` / `exit` / `error`,
- (optionally) uses `readStdinBlocking(sab, …)` for interactive input,

then register its extension in `languageForFile()` and add a `new Worker(new
URL("./<lang>/worker.ts", import.meta.url))` branch in `createWorker()`. The UI
needs no changes.

---

## 8. Security model

- Code runs in the browser's **Web Worker sandbox**: no DOM, no parent-page
  access, no filesystem, no path into our infrastructure.
- There is **no execution server** to attack.
- Stopping a run terminates the worker and frees all its memory immediately.

---

*Designed and built by **Adithya Hegde Kota**.*
