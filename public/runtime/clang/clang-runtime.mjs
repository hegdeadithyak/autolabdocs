/*
 * clang-runtime.mjs — in-browser C/C++ toolchain adapter.
 *
 * Implements the contract documented in lib/runtime/cpp/worker.ts:
 *
 *   export async function load(): Promise<Toolchain>
 *   interface Toolchain {
 *     build({ filename, source, std }): Promise<{ wasm: Uint8Array }>
 *     run({ wasm, stdout, stderr, readStdin }): Promise<number>
 *   }
 *
 * It drives a clang + lld + libc++ toolchain compiled to WebAssembly
 * (clang.wasm / lld.wasm / memfs.wasm / sysroot.tar — fetched by
 * scripts/fetch-runtimes.sh). The orchestration (MemFS image, WASI shim, tar
 * unpacking, clang -cc1 / wasm-ld invocation) is adapted from the reference
 * implementation, https://github.com/binji/wasm-clang (Apache-2.0), with three
 * changes for this app:
 *
 *   1. build() and run() are split, so the same loaded toolchain compiles once
 *      then executes, routing program stdout/stderr to per-run callbacks.
 *   2. stdin is pulled on demand from a *blocking* readStdin() callback (wired
 *      to the SharedArrayBuffer channel) instead of a fixed string, so
 *      cin/scanf/getline read interactive input a line at a time.
 *   3. _start's proc_exit code is captured and returned; a non-zero clang/lld
 *      exit throws an Error whose `.diagnostics` holds the captured compiler
 *      output, which the worker surfaces as an `error` event.
 */

// No canvas in a Web Worker. libcanvas symbols are only pulled from the archive
// if the user program references them; these globals keep the bound import
// thunks safe (`if (canvas)` → false) on the off chance they are.
const canvas = null;
const ctx2d = null;

const ESUCCESS = 0;
const enc = new TextEncoder();
const dec = new TextDecoder();

function readStr(u8, o, len = -1) {
  let end = u8.length;
  if (len !== -1) end = o + len;
  let str = "";
  for (let i = o; i < end && u8[i] !== 0; ++i) str += String.fromCharCode(u8[i]);
  return str;
}

function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, "");
}

function getImportObject(obj, names) {
  const result = {};
  for (const name of names) result[name] = obj[name].bind(obj);
  return result;
}

class ProcExit extends Error {
  constructor(code) {
    super(`process exited with code ${code}.`);
    this.code = code;
  }
}

class NotImplemented extends Error {
  constructor(modname, fieldname) {
    super(`${modname}.${fieldname} not implemented.`);
  }
}

class AbortError extends Error {
  constructor(msg = "abort") {
    super(msg);
  }
}

function assert(cond) {
  if (!cond) throw new Error("assertion failed.");
}

class Memory {
  constructor(memory) {
    this.memory = memory;
    this.buffer = this.memory.buffer;
    this.u8 = new Uint8Array(this.buffer);
    this.u32 = new Uint32Array(this.buffer);
  }
  check() {
    if (this.buffer.byteLength === 0) {
      this.buffer = this.memory.buffer;
      this.u8 = new Uint8Array(this.buffer);
      this.u32 = new Uint32Array(this.buffer);
    }
  }
  read8(o) {
    return this.u8[o];
  }
  read32(o) {
    return this.u32[o >> 2];
  }
  write8(o, v) {
    this.u8[o] = v;
  }
  write32(o, v) {
    this.u32[o >> 2] = v;
  }
  write64(o, vlo, vhi = 0) {
    this.write32(o, vlo);
    this.write32(o + 4, vhi);
  }
  readStr(o, len) {
    return readStr(this.u8, o, len);
  }
  writeStr(o, str) {
    o += this.write(o, str);
    this.write8(o, 0);
    return str.length + 1;
  }
  write(o, buf) {
    if (buf instanceof ArrayBuffer) {
      return this.write(o, new Uint8Array(buf));
    } else if (typeof buf === "string") {
      return this.write(
        o,
        buf.split("").map((x) => x.charCodeAt(0)),
      );
    } else {
      const dst = new Uint8Array(this.buffer, o, buf.length);
      dst.set(buf);
      return buf.length;
    }
  }
}

class MemFS {
  constructor(options) {
    this.hostWrite = options.hostWrite;
    this.readStdin = null; // set per run(); null ⇒ stdin is at EOF
    this.stdinStr = "";
    this.stdinStrPos = 0;
    this.hostMem_ = null; // set when wired to the running app

    const env = getImportObject(this, [
      "abort",
      "host_write",
      "host_read",
      "memfs_log",
      "copy_in",
      "copy_out",
    ]);

    this.ready = options
      .compileStreaming(options.memfsFilename)
      .then((module) => WebAssembly.instantiate(module, { env }))
      .then((instance) => {
        this.instance = instance;
        this.exports = instance.exports;
        this.mem = new Memory(this.exports.memory);
        this.exports.init();
      });
  }

  set hostMem(mem) {
    this.hostMem_ = mem;
  }

  setStdin(readStdin) {
    this.readStdin = readStdin || null;
    this.stdinStr = "";
    this.stdinStrPos = 0;
  }

  addDirectory(path) {
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    this.exports.AddDirectoryNode(path.length);
  }

  addFile(path, contents) {
    const length =
      contents instanceof ArrayBuffer ? contents.byteLength : contents.length;
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    const inode = this.exports.AddFileNode(path.length, length);
    const addr = this.exports.GetFileNodeAddress(inode);
    this.mem.check();
    this.mem.write(addr, contents);
  }

  getFileContents(path) {
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    const inode = this.exports.FindNode(path.length);
    const addr = this.exports.GetFileNodeAddress(inode);
    const size = this.exports.GetFileNodeSize(inode);
    // Copy out: the returned view aliases memfs memory, which later ops reuse.
    return new Uint8Array(this.mem.buffer, addr, size).slice();
  }

  abort() {
    throw new AbortError();
  }

  host_write(fd, iovs, iovs_len, nwritten_out) {
    this.hostMem_.check();
    assert(fd <= 2);
    let size = 0;
    let str = "";
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;
      str += this.hostMem_.readStr(buf, len);
      size += len;
    }
    this.hostMem_.write32(nwritten_out, size);
    this.hostWrite(str, fd);
    return ESUCCESS;
  }

  host_read(fd, iovs, iovs_len, nread) {
    this.hostMem_.check();
    assert(fd === 0);
    let size = 0;
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;

      // Out of buffered input — block for the next line from the host. A
      // readStdin returning "" (or no callback) signals EOF.
      if (this.stdinStrPos >= this.stdinStr.length) {
        const more = this.readStdin ? this.readStdin() : "";
        if (more && more.length) {
          this.stdinStr = more;
          this.stdinStrPos = 0;
        }
      }

      const avail = this.stdinStr.length - this.stdinStrPos;
      const lenToWrite = Math.min(len, avail);
      if (lenToWrite <= 0) break;
      this.hostMem_.write(
        buf,
        this.stdinStr.substr(this.stdinStrPos, lenToWrite),
      );
      size += lenToWrite;
      this.stdinStrPos += lenToWrite;
      if (lenToWrite !== len) break;
    }
    this.hostMem_.write32(nread, size);
    return ESUCCESS;
  }

  memfs_log(buf, len) {
    this.mem.check();
    console.log(this.mem.readStr(buf, len));
  }

  copy_out(clang_dst, memfs_src, size) {
    this.hostMem_.check();
    const dst = new Uint8Array(this.hostMem_.buffer, clang_dst, size);
    this.mem.check();
    const src = new Uint8Array(this.mem.buffer, memfs_src, size);
    dst.set(src);
  }

  copy_in(memfs_dst, clang_src, size) {
    this.mem.check();
    const dst = new Uint8Array(this.mem.buffer, memfs_dst, size);
    this.hostMem_.check();
    const src = new Uint8Array(this.hostMem_.buffer, clang_src, size);
    dst.set(src);
  }
}

class App {
  constructor(module, memfs, name, ...args) {
    this.argv = [name, ...args];
    this.environ = { USER: "alice" };
    this.memfs = memfs;
    this.handles = new Map();
    this.nextHandle = 0;

    const env = getImportObject(this, [
      "canvas_arc", "canvas_arcTo", "canvas_beginPath", "canvas_bezierCurveTo",
      "canvas_clearRect", "canvas_clip", "canvas_closePath", "canvas_createImageData",
      "canvas_destroyHandle", "canvas_ellipse", "canvas_fill", "canvas_fillRect",
      "canvas_fillText", "canvas_imageDataSetData", "canvas_lineTo", "canvas_measureText",
      "canvas_moveTo", "canvas_putImageData", "canvas_quadraticCurveTo", "canvas_rect",
      "canvas_requestAnimationFrame", "canvas_restore", "canvas_rotate", "canvas_save",
      "canvas_scale", "canvas_setFillStyle", "canvas_setFont", "canvas_setGlobalAlpha",
      "canvas_setHeight", "canvas_setLineCap", "canvas_setLineDashOffset", "canvas_setLineJoin",
      "canvas_setLineWidth", "canvas_setMiterLimit", "canvas_setShadowBlur", "canvas_setShadowColor",
      "canvas_setShadowOffsetX", "canvas_setShadowOffsetY", "canvas_setStrokeStyle", "canvas_setTextAlign",
      "canvas_setTextBaseline", "canvas_setTransform", "canvas_setWidth", "canvas_stroke",
      "canvas_strokeRect", "canvas_strokeText", "canvas_transform", "canvas_translate",
    ]);

    const wasi_unstable = getImportObject(this, [
      "proc_exit", "environ_sizes_get", "environ_get", "args_sizes_get",
      "args_get", "random_get", "clock_time_get", "poll_oneoff",
    ]);

    // memfs implements the file-backed WASI calls (fd_read/fd_write/…).
    Object.assign(wasi_unstable, this.memfs.exports);

    this.ready = WebAssembly.instantiate(module, { wasi_unstable, env }).then(
      (instance) => {
        this.instance = instance;
        this.exports = this.instance.exports;
        this.mem = new Memory(this.exports.memory);
        this.memfs.hostMem = this.mem;
      },
    );
  }

  // Returns the program's exit code (0 if _start returns without proc_exit).
  async run() {
    await this.ready;
    try {
      this.exports._start();
      return 0;
    } catch (exn) {
      if (exn instanceof ProcExit) return exn.code;
      throw exn;
    }
  }

  proc_exit(code) {
    throw new ProcExit(code);
  }

  environ_sizes_get(environ_count_out, environ_buf_size_out) {
    this.mem.check();
    let size = 0;
    const names = Object.getOwnPropertyNames(this.environ);
    for (const name of names) {
      const value = this.environ[name];
      size += name.length + value.length + 2;
    }
    this.mem.write64(environ_count_out, names.length);
    this.mem.write64(environ_buf_size_out, size);
    return ESUCCESS;
  }

  environ_get(environ_ptrs, environ_buf) {
    this.mem.check();
    const names = Object.getOwnPropertyNames(this.environ);
    for (const name of names) {
      this.mem.write32(environ_ptrs, environ_buf);
      environ_ptrs += 4;
      environ_buf += this.mem.writeStr(
        environ_buf,
        `${name}=${this.environ[name]}`,
      );
    }
    this.mem.write32(environ_ptrs, 0);
    return ESUCCESS;
  }

  args_sizes_get(argc_out, argv_buf_size_out) {
    this.mem.check();
    let size = 0;
    for (const arg of this.argv) size += arg.length + 1;
    this.mem.write64(argc_out, this.argv.length);
    this.mem.write64(argv_buf_size_out, size);
    return ESUCCESS;
  }

  args_get(argv_ptrs, argv_buf) {
    this.mem.check();
    for (const arg of this.argv) {
      this.mem.write32(argv_ptrs, argv_buf);
      argv_ptrs += 4;
      argv_buf += this.mem.writeStr(argv_buf, arg);
    }
    this.mem.write32(argv_ptrs, 0);
    return ESUCCESS;
  }

  random_get(buf, buf_len) {
    const data = new Uint8Array(this.mem.buffer, buf, buf_len);
    if (globalThis.crypto && crypto.getRandomValues) {
      crypto.getRandomValues(data);
    } else {
      for (let i = 0; i < buf_len; ++i) data[i] = (Math.random() * 256) | 0;
    }
    return ESUCCESS;
  }

  // Wall-clock in nanoseconds — enough for time()/<chrono> not to crash.
  clock_time_get(clock_id, precision, time_out) {
    this.mem.check();
    const ns = BigInt(Date.now()) * 1000000n;
    this.mem.write64(
      time_out,
      Number(ns & 0xffffffffn),
      Number((ns >> 32n) & 0xffffffffn),
    );
    return ESUCCESS;
  }

  poll_oneoff() {
    throw new NotImplemented("wasi_unstable", "poll_oneoff");
  }

  canvas_destroyHandle(handle) {
    this.handles.delete(handle);
  }
  canvas_setWidth(width) {
    if (canvas) canvas.width = width;
  }
  canvas_setHeight(height) {
    if (canvas) canvas.height = height;
  }
  canvas_requestAnimationFrame() {}
  canvas_createImageData() {
    return -1;
  }
  canvas_putImageData() {}
  canvas_imageDataSetData() {}
  canvas_arc() {}
  canvas_arcTo() {}
  canvas_beginPath() {}
  canvas_bezierCurveTo() {}
  canvas_clearRect() {}
  canvas_clip() {}
  canvas_closePath() {}
  canvas_ellipse() {}
  canvas_fill() {}
  canvas_fillRect() {}
  canvas_fillText() {}
  canvas_lineTo() {}
  canvas_measureText() {
    return 0;
  }
  canvas_moveTo() {}
  canvas_quadraticCurveTo() {}
  canvas_rect() {}
  canvas_restore() {}
  canvas_rotate() {}
  canvas_save() {}
  canvas_scale() {}
  canvas_setTransform() {}
  canvas_stroke() {}
  canvas_strokeRect() {}
  canvas_strokeText() {}
  canvas_transform() {}
  canvas_translate() {}
  canvas_setFillStyle() {}
  canvas_setFont() {}
  canvas_setGlobalAlpha() {}
  canvas_setLineCap() {}
  canvas_setLineDashOffset() {}
  canvas_setLineJoin() {}
  canvas_setLineWidth() {}
  canvas_setMiterLimit() {}
  canvas_setShadowBlur() {}
  canvas_setShadowColor() {}
  canvas_setShadowOffsetX() {}
  canvas_setShadowOffsetY() {}
  canvas_setStrokeStyle() {}
  canvas_setTextAlign() {}
  canvas_setTextBaseline() {}
}

class Tar {
  constructor(buffer) {
    this.u8 = new Uint8Array(buffer);
    this.offset = 0;
  }
  readStr(len) {
    const result = readStr(this.u8, this.offset, len);
    this.offset += len;
    return result;
  }
  readOctal(len) {
    return parseInt(this.readStr(len), 8);
  }
  alignUp() {
    this.offset = (this.offset + 511) & ~511;
  }
  readEntry() {
    if (this.offset + 512 > this.u8.length) return null;
    const entry = {
      filename: this.readStr(100),
      mode: this.readOctal(8),
      owner: this.readOctal(8),
      group: this.readOctal(8),
      size: this.readOctal(12),
      mtim: this.readOctal(12),
      checksum: this.readOctal(8),
      type: this.readStr(1),
      linkname: this.readStr(100),
    };
    if (this.readStr(8) !== "ustar  ") return null;
    entry.ownerName = this.readStr(32);
    entry.groupName = this.readStr(32);
    entry.devMajor = this.readStr(8);
    entry.devMinor = this.readStr(8);
    entry.filenamePrefix = this.readStr(155);
    this.alignUp();
    if (entry.type === "0") {
      entry.contents = this.u8.subarray(this.offset, this.offset + entry.size);
      this.offset += entry.size;
      this.alignUp();
    } else if (entry.type !== "5") {
      assert(false);
    }
    return entry;
  }
  untar(memfs) {
    let entry;
    while ((entry = this.readEntry())) {
      if (entry.type === "0") memfs.addFile(entry.filename, entry.contents);
      else if (entry.type === "5") memfs.addDirectory(entry.filename);
    }
  }
}

// clang 8.0.1 frontend args (paths match the sysroot.tar layout).
const CLANG_COMMON_ARGS = [
  "-disable-free",
  "-isysroot", "/",
  "-internal-isystem", "/include/c++/v1",
  "-internal-isystem", "/include",
  "-internal-isystem", "/lib/clang/8.0.1/include",
  "-ferror-limit", "19",
  "-fmessage-length", "80",
  "-fno-color-diagnostics",
];

class Toolchain {
  constructor(opts) {
    this.compileStreaming = opts.compileStreaming;
    this.readBuffer = opts.readBuffer;
    this.moduleCache = {};
    // Mutable sink: build() collects diagnostics, run() streams to callbacks.
    this.write = () => {};

    this.memfs = new MemFS({
      compileStreaming: this.compileStreaming,
      memfsFilename: "memfs.wasm",
      hostWrite: (s, fd) => this.write(s, fd),
    });

    this.ready = this.memfs.ready.then(async () => {
      const tar = new Tar(await this.readBuffer("sysroot.tar"));
      tar.untar(this.memfs);
    });
  }

  async getModule(name) {
    if (!this.moduleCache[name]) {
      this.moduleCache[name] = await this.compileStreaming(name);
    }
    return this.moduleCache[name];
  }

  async exec(module, ...args) {
    const app = new App(module, this.memfs, ...args);
    return app.run();
  }

  async build({ filename, source, std }) {
    await this.ready;

    const isCpp = /\.(cc|cpp|cxx|hpp|c\+\+)$/i.test(filename || "");
    const input = isCpp ? "main.cc" : "main.c";
    const obj = "main.o";
    const wasm = "main.wasm";
    const lang = isCpp ? "c++" : "c";
    const stdArg = `-std=${std || (isCpp ? "c++17" : "c11")}`;

    let diagnostics = "";
    this.write = (s) => {
      diagnostics += s;
    };
    this.memfs.setStdin(null);
    this.memfs.addFile(input, enc.encode(source));

    const clang = await this.getModule("clang.wasm");
    const ccCode = await this.exec(
      clang, "clang", "-cc1", "-emit-obj",
      ...CLANG_COMMON_ARGS, stdArg, "-O2", "-o", obj, "-x", lang, input,
    );
    if (ccCode !== 0) {
      const err = new Error("Compilation failed.");
      err.diagnostics = stripAnsi(diagnostics).trim() || "Compilation failed.";
      throw err;
    }

    const stackSize = 1024 * 1024;
    const libdir = "lib/wasm32-wasi";
    const lld = await this.getModule("lld.wasm");
    const ldCode = await this.exec(
      lld, "wasm-ld", "--no-threads", "--export-dynamic",
      "-z", `stack-size=${stackSize}`, `-L${libdir}`,
      `${libdir}/crt1.o`, obj, "-lc", "-lc++", "-lc++abi", "-lcanvas",
      "-o", wasm,
    );
    if (ldCode !== 0) {
      const err = new Error("Linking failed.");
      err.diagnostics = stripAnsi(diagnostics).trim() || "Linking failed.";
      throw err;
    }

    return { wasm: this.memfs.getFileContents(wasm) };
  }

  async run({ wasm, stdout, stderr, readStdin }) {
    await this.ready;
    this.write = (s, fd) => (fd === 2 ? stderr : stdout)(s);
    this.memfs.setStdin(readStdin);
    const module = await WebAssembly.compile(wasm);
    return this.exec(module, "main");
  }
}

// Exported for out-of-browser testing (inject fs-based loaders); the worker
// path uses load() below, which wires up fetch.
export { Toolchain };

export async function load() {
  const base = new URL("./", import.meta.url);
  const urlOf = (name) => new URL(name, base).href;

  const compileStreaming = async (name) => {
    const href = urlOf(name);
    if (WebAssembly.compileStreaming) {
      try {
        return await WebAssembly.compileStreaming(fetch(href));
      } catch {
        // Fall back to ArrayBuffer (e.g. when the MIME type isn't application/wasm).
      }
    }
    const buf = await (await fetch(href)).arrayBuffer();
    return WebAssembly.compile(buf);
  };

  const readBuffer = async (name) => (await fetch(urlOf(name))).arrayBuffer();

  const tc = new Toolchain({ compileStreaming, readBuffer });
  await tc.ready;
  return tc;
}
