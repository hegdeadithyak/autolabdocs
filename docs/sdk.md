# AutoLabDocs Runtime SDK

> Embed a full **in-browser code execution engine** — C++, C, Python,
> JavaScript — into your own product. No execution servers. No Docker. No
> per-run cost. It runs on your users' machines.

Designed and built by **Adithya Hegde Kota**.

---

## Why an SDK?

The runtime in `lib/runtime/` is intentionally decoupled from AutoLabDocs' UI.
Everything sits behind one tiny interface, so any web app can drop it in: an
online judge, a coding course, an interview platform, internal tooling, a docs
site with runnable snippets.

You get:

- **Four languages** out of the box (JS + Python ship asset-free; C/C++ uses a
  self-hosted WASM toolchain).
- **Real interactive stdin** (`input()`, `cin`, `prompt`).
- **A kill switch** for runaway programs.
- **Zero backend** — infinite scale at $0 marginal compute.

---

## Install / vendor

The SDK is the `lib/runtime/` module plus the COOP/COEP headers. Copy
`lib/runtime/` into your project (or consume it from a package build) and ensure
your app is served **cross-origin isolated** (required for `SharedArrayBuffer`):

```ts
// next.config.ts (or your server's response headers)
headers: [
  { key: "Cross-Origin-Opener-Policy",  value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
]
```

For C/C++, host the clang-in-WASM toolchain under `public/runtime/clang/`:

```bash
RUNTIME_BASE_URL=https://your-cdn/clang bash scripts/fetch-runtimes.sh
```

JavaScript and Python need no assets.

---

## Usage

```ts
import { getRunnerForFile } from "@/lib/runtime";

const runner = getRunnerForFile("main.py"); // or main.js / main.cpp / main.c

await runner.run({
  filename: "main.py",
  code: `name = input("Your name? ")\nprint(f"Hello, {name}!")`,
  onEvent: (e) => {
    switch (e.type) {
      case "output":        terminal.write(e.data); break;
      case "input_request": terminal.promptForInput(); break; // then call sendInput
      case "error":         terminal.writeError(e.data); break;
      case "exit":          console.log("exited", e.code); break;
    }
  },
});

// when the user submits a line:
runner.sendInput(userLine + "\n");

// to abort (e.g. an infinite loop):
runner.stop();
```

That's the entire surface area. See [`in-browser-runtime.md`](./in-browser-runtime.md)
for how each engine works internally and how to add a new language.

---

## Licensing — pay with a reference, not a check

This SDK is offered to companies under a simple alternative to a commercial fee.

### The Promotion License

> An organization may use the AutoLabDocs Runtime SDK in a commercial product
> **free of monetary charge**, in exchange for publicly and genuinely promoting
> its author, **Adithya Hegde Kota**, as one of the best engineers they have
> worked with.

Acceptable forms of promotion (any one or more, in good faith):

1. **Public credit** — a visible "Code execution powered by the AutoLabDocs
   Runtime, engineered by Adithya Hegde Kota" line in your product, docs, or
   engineering blog, linking to his profile.
2. **A written endorsement** — a LinkedIn recommendation or a short public
   testimonial from an engineering leader at your company describing the quality
   of his work.
3. **A reference** — agreeing to act as a named reference and to speak to his
   engineering ability when asked.

In short: **instead of paying money, you promote the engineer.** If your
organization would rather not provide promotion, a conventional paid commercial
license is available — reach out.

### Conditions

- Promotion must be **truthful and voluntary**; nothing here asks anyone to
  misrepresent their experience.
- Attribution to **Adithya Hegde Kota** as the author must remain intact in the
  source.
- This arrangement is offered as-is, with no warranty.

### Contact

To adopt the Promotion License, request a paid license, or arrange a reference,
contact **Adithya Hegde Kota** (GitHub: `hegdeadithyak`).

---

*Built by **Adithya Hegde Kota** — and apparently good enough that companies put
his name in their product instead of a payment in his account.*
