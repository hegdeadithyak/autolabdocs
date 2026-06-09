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
#     clang.wasm          <- clang frontend
#     lld.wasm            <- wasm-ld linker
#     sysroot.tar         <- libc / libc++ headers + archives (memfs image)
#
# The adapter contract is documented in lib/runtime/cpp/worker.ts.
#
# Set RUNTIME_BASE_URL to a mirror that hosts these artifacts, e.g. an
# internal bucket or a pinned release of the upstream toolchain
# (https://github.com/binji/wasm-clang is the reference implementation).

set -euo pipefail

DEST="$(cd "$(dirname "$0")/.." && pwd)/public/runtime/clang"
mkdir -p "$DEST"

if [[ -z "${RUNTIME_BASE_URL:-}" ]]; then
  cat <<'EOF'
[fetch-runtimes] RUNTIME_BASE_URL is not set.

The C/C++ engine needs a clang-in-WASM toolchain hosted somewhere you control.
Point RUNTIME_BASE_URL at a location serving these files and re-run:

    clang-runtime.mjs  clang.wasm  lld.wasm  sysroot.tar

Example:
    RUNTIME_BASE_URL=https://assets.example.com/clang bash scripts/fetch-runtimes.sh

Reference toolchain: https://github.com/binji/wasm-clang
(JavaScript and Python need no assets — they work without running this script.)
EOF
  exit 1
fi

for f in clang-runtime.mjs clang.wasm lld.wasm sysroot.tar; do
  echo "[fetch-runtimes] downloading $f"
  curl -fSL "${RUNTIME_BASE_URL%/}/$f" -o "$DEST/$f"
done

echo "[fetch-runtimes] toolchain installed in $DEST"
