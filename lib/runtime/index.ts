// Client-side execution engine.
//
// Code runs entirely in the user's browser via Web Workers + WebAssembly —
// there is no execution server. Each engine emits the exact same event shape
// the IDE terminal already understands (`output` / `input_request` / `exit` /
// `error`), so the IDE only has to swap its old WebSocket for one of these
// runners.

import { createStdinBuffer, writeStdin } from "./stdinChannel";

export type RunEvent =
  | { type: "output"; data: string }
  | { type: "input_request"; prompt?: string }
  | { type: "exit"; code: number }
  | { type: "error"; data: string };

export interface RunOptions {
  code: string;
  filename: string;
  onEvent: (event: RunEvent) => void;
}

export interface Runner {
  run(options: RunOptions): Promise<void>;
  sendInput(data: string): void;
  stop(): void;
}

export type Language = "javascript" | "python" | "cpp";

export function languageForFile(filename: string): Language | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "js":
    case "mjs":
    case "cjs":
      return "javascript";
    case "py":
      return "python";
    case "c":
    case "cc":
    case "cpp":
    case "cxx":
    case "h":
    case "hpp":
      return "cpp";
    default:
      return null;
  }
}

// Builds the right Worker for a language. The `new URL(..., import.meta.url)`
// literals must be static so the bundler can discover each worker entry.
function createWorker(language: Language): Worker {
  switch (language) {
    case "javascript":
      return new Worker(new URL("./js/worker.ts", import.meta.url), {
        type: "module",
      });
    case "python":
      return new Worker(new URL("./python/worker.ts", import.meta.url), {
        type: "module",
      });
    case "cpp":
      return new Worker(new URL("./cpp/worker.ts", import.meta.url), {
        type: "module",
      });
  }
}

// Every engine runs inside a worker and speaks the same message protocol, so a
// single runner implementation drives all of them. The per-language behaviour
// lives in each worker entry file.
class WorkerRunner implements Runner {
  private worker: Worker | null = null;
  private readonly sab: SharedArrayBuffer = createStdinBuffer();
  private onEvent: ((event: RunEvent) => void) | null = null;
  private exited = false;

  constructor(private readonly language: Language) {}

  run({ code, filename, onEvent }: RunOptions): Promise<void> {
    this.onEvent = onEvent;
    this.exited = false;
    this.worker = createWorker(this.language);

    this.worker.onmessage = (e: MessageEvent<RunEvent>) => {
      this.onEvent?.(e.data);
      if (e.data.type === "exit") this.exited = true;
    };
    this.worker.onerror = (e) => {
      this.emit({ type: "error", data: e.message || "Worker crashed" });
      this.emit({ type: "exit", code: 1 });
    };
    this.worker.onmessageerror = () => {
      this.emit({ type: "error", data: "Failed to communicate with runtime" });
      this.emit({ type: "exit", code: 1 });
    };

    this.worker.postMessage({ type: "run", code, filename, sab: this.sab });
    return Promise.resolve();
  }

  sendInput(data: string): void {
    writeStdin(this.sab, data);
  }

  stop(): void {
    if (!this.worker) return;
    this.worker.terminate();
    this.worker = null;
    this.emit({ type: "output", data: "\n^C Execution stopped.\n" });
    this.emit({ type: "exit", code: 130 });
  }

  private emit(event: RunEvent): void {
    if (this.exited && event.type !== "output") return;
    if (event.type === "exit") this.exited = true;
    this.onEvent?.(event);
  }
}

export function getRunnerForFile(filename: string): Runner {
  const language = languageForFile(filename);
  if (!language) {
    throw new UnsupportedLanguageError(filename);
  }
  return new WorkerRunner(language);
}

export class UnsupportedLanguageError extends Error {
  constructor(filename: string) {
    super(
      `No browser runtime for "${filename}". Supported: .js, .py, .c, .cpp`,
    );
    this.name = "UnsupportedLanguageError";
  }
}
