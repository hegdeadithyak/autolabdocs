// C/C++ engine — compiles and runs C/C++ entirely in the browser using a
// clang + lld + libc++ toolchain compiled to WebAssembly, then executes the
// resulting program.wasm through a WASI runtime wired to the terminal.
//
// The toolchain is large (~tens of MB) so it is NOT bundled with the app. A
// build/setup step (scripts/fetch-runtimes.sh) installs it under
// `public/runtime/clang/` together with a small ES-module adapter,
// `clang-runtime.mjs`, that exposes:
//
//   export async function load(): Promise<Toolchain>
//   interface Toolchain {
//     // Compile + link source into a runnable wasm module. Throws CompileError
//     // (with .diagnostics) on failure.
//     build(opts: { filename: string; source: string; std?: string }):
//       Promise<{ wasm: Uint8Array }>;
//     // Run a compiled module under WASI, streaming io through the callbacks.
//     run(opts: {
//       wasm: Uint8Array;
//       stdout: (s: string) => void;
//       stderr: (s: string) => void;
//       readStdin: () => string; // blocking
//     }): Promise<number>; // exit code
//   }
//
// This keeps the heavy, asset-specific glue out of the app bundle and behind a
// stable contract.

import { readStdinBlocking } from "../stdinChannel";
import type { RunEvent } from "../index";

interface RunMessage {
  type: "run";
  code: string;
  filename: string;
  sab: SharedArrayBuffer;
}

const TOOLCHAIN_URL = "/runtime/clang/clang-runtime.mjs";

const post = (event: RunEvent) => (self as unknown as Worker).postMessage(event);
const write = (data: string) => post({ type: "output", data });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let toolchain: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loading: Promise<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getToolchain(): Promise<any> {
  if (toolchain) return toolchain;
  if (!loading) {
    loading = (async () => {
      write("Loading C/C++ toolchain (first run only)…\n");
      const mod = await import(
        /* webpackIgnore: true */ /* turbopackIgnore: true */ TOOLCHAIN_URL
      );
      toolchain = await mod.load();
      return toolchain;
    })();
  }
  return loading;
}

function isMissingToolchain(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? err);
  // A failed dynamic import of the adapter shows up as a module load error.
  return (
    msg.includes(TOOLCHAIN_URL) ||
    msg.includes("Failed to fetch") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("dynamically imported module")
  );
}

const isCpp = (filename: string) => /\.(cc|cpp|cxx|hpp)$/i.test(filename);

self.onmessage = async (e: MessageEvent<RunMessage>) => {
  const { type, code, filename, sab } = e.data;
  if (type !== "run") return;

  let tc;
  try {
    tc = await getToolchain();
  } catch (err) {
    if (isMissingToolchain(err)) {
      post({
        type: "error",
        data:
          "C/C++ toolchain is not installed.\n" +
          "Run `bash scripts/fetch-runtimes.sh` to download the clang WASM\n" +
          "toolchain into public/runtime/clang/, then try again.",
      });
    } else {
      post({ type: "error", data: `Failed to load toolchain: ${String(err)}` });
    }
    post({ type: "exit", code: 1 });
    return;
  }

  try {
    const { wasm } = await tc.build({
      filename,
      source: code,
      std: isCpp(filename) ? "c++17" : "c11",
    });

    const exitCode = await tc.run({
      wasm,
      stdout: (s: string) => write(s),
      stderr: (s: string) => write(s),
      readStdin: () =>
        readStdinBlocking(sab, () => post({ type: "input_request" })),
    });

    post({ type: "exit", code: exitCode });
  } catch (err) {
    // Compiler diagnostics, if the adapter attached them.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const diagnostics = (err as any)?.diagnostics;
    post({ type: "error", data: diagnostics ? String(diagnostics) : String(err) });
    post({ type: "exit", code: 1 });
  }
};
