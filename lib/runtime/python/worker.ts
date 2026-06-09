// Python engine — runs CPython compiled to WebAssembly (Pyodide) in a Web
// Worker, entirely on the user's machine.
//
// Pyodide is loaded from its official CDN. Because the page uses COEP
// `credentialless` (see next.config.ts), cross-origin assets load without
// needing CORP headers, so there's no need to vendor Pyodide's ~10MB of
// assets into the app.

import { readStdinBlocking } from "../stdinChannel";
import type { RunEvent } from "../index";

interface RunMessage {
  type: "run";
  code: string;
  filename: string;
  sab: SharedArrayBuffer;
}

const PYODIDE_VERSION = "0.26.4";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

const post = (event: RunEvent) => (self as unknown as Worker).postMessage(event);
const write = (data: string) => post({ type: "output", data });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodide: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loading: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getPyodide(): Promise<any> {
  if (pyodide) return pyodide;
  if (!loading) {
    loading = (async () => {
      write("Loading Python runtime (first run only)…\n");
      const mod = await import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */ `${PYODIDE_URL}pyodide.mjs`
      );
      const py = await mod.loadPyodide({ indexURL: PYODIDE_URL });
      pyodide = py;
      return py;
    })();
  }
  return loading;
}

function pythonError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

self.onmessage = async (e: MessageEvent<RunMessage>) => {
  const { type, code, sab } = e.data;
  if (type !== "run") return;

  try {
    const py = await getPyodide();

    py.setStdout({ batched: (s: string) => write(s + "\n") });
    py.setStderr({ batched: (s: string) => write(s + "\n") });
    py.setStdin({
      stdin: () => readStdinBlocking(sab, () => post({ type: "input_request" })),
    });

    // Auto-install packages the program imports (numpy, pandas, matplotlib…).
    await py.loadPackagesFromImports(code);
    await py.runPythonAsync(code);

    post({ type: "exit", code: 0 });
  } catch (err) {
    post({ type: "error", data: pythonError(err) });
    post({ type: "exit", code: 1 });
  }
};
