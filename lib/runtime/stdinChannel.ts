// Blocking stdin channel shared between the main thread and a Web Worker.
//
// A worker that needs interactive input (Python `input()`, C++ `cin >>`, JS
// `prompt()`) must block *synchronously* until the user types something. The
// only way to block a worker thread without freezing the UI is
// `Atomics.wait()` on a SharedArrayBuffer. That requires the page to be
// cross-origin isolated (see the COOP/COEP headers in next.config.ts).
//
// Layout of the SharedArrayBuffer:
//   Int32[0] = control flag (0 = waiting for input, 1 = input ready)
//   Int32[1] = byte length of the input payload
//   bytes[8..] = UTF-8 encoded input payload

const CTRL_INDEX = 0;
const LEN_INDEX = 1;
const HEADER_BYTES = 8; // two Int32 slots
const DATA_BYTES = 256 * 1024; // plenty for a line (or paste) of stdin

export function createStdinBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(HEADER_BYTES + DATA_BYTES);
}

// --- Main thread side -------------------------------------------------------

// Called when the user submits a line of input. Writes the bytes into the
// shared buffer and wakes the blocked worker.
export function writeStdin(sab: SharedArrayBuffer, text: string): void {
  const control = new Int32Array(sab, 0, 2);
  const data = new Uint8Array(sab, HEADER_BYTES, DATA_BYTES);
  const bytes = new TextEncoder().encode(text);
  const len = Math.min(bytes.length, DATA_BYTES);
  data.set(bytes.subarray(0, len));
  Atomics.store(control, LEN_INDEX, len);
  Atomics.store(control, CTRL_INDEX, 1);
  Atomics.notify(control, CTRL_INDEX);
}

// --- Worker side ------------------------------------------------------------

// Blocks the worker until the main thread provides input. `requestInput` is
// called first (it should postMessage an `input_request` event to the main
// thread). Returns the UTF-8 decoded payload.
export function readStdinBlocking(
  sab: SharedArrayBuffer,
  requestInput: () => void,
): string {
  const control = new Int32Array(sab, 0, 2);
  Atomics.store(control, CTRL_INDEX, 0);
  requestInput();
  // Wait while the flag is still 0 (no input yet).
  Atomics.wait(control, CTRL_INDEX, 0);
  const len = Atomics.load(control, LEN_INDEX);
  const data = new Uint8Array(sab, HEADER_BYTES, DATA_BYTES);
  return new TextDecoder().decode(data.slice(0, len));
}
