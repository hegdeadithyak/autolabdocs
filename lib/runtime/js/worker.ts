// JavaScript engine — runs user code directly in a Web Worker.
//
// `console.*` is redirected to the terminal, and a synchronous `prompt()` /
// `readline()` is backed by the blocking stdin channel so interactive programs
// work just like the native runner.

import { readStdinBlocking } from "../stdinChannel";
import type { RunEvent } from "../index";

interface RunMessage {
  type: "run";
  code: string;
  filename: string;
  sab: SharedArrayBuffer;
}

const post = (event: RunEvent) => (self as unknown as Worker).postMessage(event);
const write = (data: string) => post({ type: "output", data });

function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack || value.message;
  try {
    return JSON.stringify(value, replacer(), 2) ?? String(value);
  } catch {
    return String(value);
  }
}

// JSON.stringify replacer that survives circular references.
function replacer() {
  const seen = new WeakSet();
  return (_key: string, val: unknown) => {
    if (typeof val === "bigint") return `${val}n`;
    if (typeof val === "function") return `[Function: ${val.name || "anonymous"}]`;
    if (typeof val === "object" && val !== null) {
      if (seen.has(val)) return "[Circular]";
      seen.add(val);
    }
    return val;
  };
}

const format = (args: unknown[]) => args.map(stringify).join(" ") + "\n";

function errorString(err: unknown): string {
  if (err instanceof Error) return `${err.name}: ${err.message}\n${err.stack ?? ""}`;
  return String(err);
}

self.onmessage = async (e: MessageEvent<RunMessage>) => {
  const { type, code, sab } = e.data;
  if (type !== "run") return;

  const readLine = (): string =>
    readStdinBlocking(sab, () => post({ type: "input_request" }));

  // Console redirection.
  const sandboxConsole = {
    log: (...a: unknown[]) => write(format(a)),
    info: (...a: unknown[]) => write(format(a)),
    debug: (...a: unknown[]) => write(format(a)),
    warn: (...a: unknown[]) => write(format(a)),
    error: (...a: unknown[]) => write(format(a)),
    table: (...a: unknown[]) => write(format(a)),
  };
  Object.assign(console, sandboxConsole);

  // Interactive input helpers exposed to user code.
  const prompt = (message?: string): string => {
    if (message) write(String(message));
    return readLine();
  };
  const readline = (): string => readLine();

  try {
    // Wrap in an async IIFE so user code may use top-level `await`.
    const runner = new Function(
      "console",
      "prompt",
      "readline",
      `"use strict"; return (async () => {\n${code}\n})();`,
    );
    await runner(sandboxConsole, prompt, readline);
    post({ type: "exit", code: 0 });
  } catch (err) {
    post({ type: "error", data: errorString(err) });
    post({ type: "exit", code: 1 });
  }
};
