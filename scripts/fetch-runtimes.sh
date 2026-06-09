#!/usr/bin/env bash
#
# Installs the in-browser C/C++ toolchain (clang + lld + libc++ compiled to
# WebAssembly) into public/runtime/clang/.
#
# Python (Pyodide) and JavaScript need NO assets here — Python streams from the
# Pyodide CDN at runtime and JS runs natively in a Web Worker. Only C/C++ needs
# a self-hosted toolchain, because it has to compile + link on the client.
#
# The toolchain is large (~tens of MB), so it is fetched at setup/build time
# and kept out of git (see .gitignore). The destination must contain:
#
#   public/runtime/clang/
#     clang-runtime.mjs   <- ES-module adapter implementing load()/build()/run()
#                            (hand-written, tracked in git — NOT fetched here)
#     clang.wasm          <- clang frontend
#     lld.wasm            <- wasm-ld linker
#     memfs.wasm          <- in-memory filesystem + WASI shim used by the adapter
#     sysroot.tar         <- libc / libc++ headers + archives (memfs image)
#
# The adapter contract is documented in lib/runtime/cpp/worker.ts.
#
# By default the four binaries are pulled from the upstream reference toolchain
# (https://github.com/binji/wasm-clang). Override RUNTIME_BASE_URL to fetch from
# a mirror you control, e.g. an internal bucket or a pinned release.

set -euo pipefail

DEST="$(cd "$(dirname "$0")/.." && pwd)/public/runtime/clang"
mkdir -p "$DEST"

# Default mirror: the upstream wasm-clang demo host. Its files are named without
# a .wasm extension, so map each source name -> destination name below.
BASE="${RUNTIME_BASE_URL:-https://binji.github.io/wasm-clang}"

# "<source-name> <dest-name>" pairs.
ASSETS=(
  "clang clang.wasm"
  "lld lld.wasm"
  "memfs memfs.wasm"
  "sysroot.tar sysroot.tar"
)

for pair in "${ASSETS[@]}"; do
  src="${pair%% *}"
  dst="${pair##* }"
  echo "[fetch-runtimes] downloading $dst"
  curl -fSL "${BASE%/}/$src" -o "$DEST/$dst"
done

echo "[fetch-runtimes] toolchain installed in $DEST"
echo "[fetch-runtimes] (clang-runtime.mjs is tracked in git and left untouched)"
