# AutoLabDocs ⚡

![AutoLabDocs Banner](https://placehold.co/1200x400/050505/3b82f6?text=AUTOLABDOCS&font=montserrat)

> **Stop wasting your life on Microsoft Word.**
> Paste code. Get a perfect PDF. Pass the lab.

I built this because I was tired of the busywork, and now it's here to save your weekends too.

It's not just a "formatter"—it's a full-blown execution engine that runs your code, captures the output (even the graphs), and hands you a submission-ready PDF before you can finish your coffee.

## 🚀 Why This Rules

-   **Runs On YOUR Machine, In The Browser**: We don't ship your code to a server. Python, C, C++, and JavaScript compile and execute *right in your browser tab* via WebAssembly. The language runs on the host computer — yours.
-   **PDFs That Look Better Than Yours**: Syntax highlighting? Check. Vector graphs? Check. Formatting that makes TAs weep with joy? Double check.
-   **VSCode in the Browser**: The IDE experience you know and love, right there in the web app. No learning curve.
-   **Zero-Trust By Design**: Your code never leaves your tab. Each run is sandboxed inside a Web Worker — no server ever sees it.
-   **Traffic? What Traffic?**: Execution happens on each visitor's own CPU, so there is literally no execution server to overload. 100 students submitting at 11:59 PM? Each one runs locally.

## 🛠️ The Stack (Heavy Hitters Only)

We didn't cut corners. We built this with the best tools available.

### Frontend
-   **Next.js 16 (React 19)**: Bleeding edge. Fast as hell.
-   **Tailwind CSS v4**: Because writing CSS files is so 2015.
-   **Monaco Editor**: The engine behind VSCode. If it's good enough for Microsoft, it's good enough for us.

### Execution Engine (The "Secret Sauce") — 100% In The Browser
-   **JavaScript**: Runs natively in a sandboxed Web Worker. Instant, zero download.
-   **Python**: Real CPython compiled to WebAssembly via **Pyodide** — `numpy`, `pandas`, `matplotlib` and friends auto-install on demand.
-   **C / C++**: A **clang + lld + libc++ toolchain compiled to WebAssembly** that compiles *and* runs your code on the client, executed through a WASI runtime.
-   **Blocking stdin**: `input()`, `cin >>`, and `prompt()` work for real, via `SharedArrayBuffer` + `Atomics` (the app is served cross-origin-isolated — see `next.config.ts`).

### Backend
-   **PostgreSQL + Prisma**: Rock-solid data storage.
-   **JWT Auth**: Secure, stateless, and scalable.
-   *No execution server.* Code runs on the user's machine, not ours.

## 🧠 Engineering Flex (How We Handle Edge Cases)

This isn't a hackathon toy. It's built to survive the real world.

1.  **"Nice Try, Hackers"**: There's no server to break into. Code runs inside the browser's own Web Worker sandbox — no filesystem, no network into our infra, nothing to escape *to*.
2.  **Infinite Scale, $0 Compute**: Every run uses the visitor's CPU, not ours. There is no queue and no execution server to fall over — 1 user or 10,000, it's the same for us.
3.  **Kill Switch**: A runaway or infinite loop? Hit Stop. We terminate the worker instantly — the whole runtime vanishes with it.

## 💻 Run It Yourself

Want to see how the sausage is made? Here is how you spin it up locally.

### Prerequisites
-   Node.js (v18+)
-   Postgres

No Docker. No runner service. Execution happens in the browser.

### Setup

1.  **Clone it.**
    ```bash
    git clone https://github.com/yourusername/autolabdocs.git
    cd autolabdocs
    ```

2.  **Install the goods.**
    ```bash
    npm install
    ```

3.  **Config.**
    Create a `.env` file. You know the drill.
    ```env
    DATABASE_URL="postgresql://user:pass@localhost:5432/autolabdocs"
    SESSION_SECRET="mash-your-keyboard-here-to-make-it-secure"
    ```

4.  **Database.**
    ```bash
    npx prisma db push
    ```

5.  **(Optional) C/C++ toolchain.**
    JavaScript and Python work out of the box. To enable in-browser C/C++,
    install the clang-in-WASM toolchain into `public/runtime/clang/`:
    ```bash
    RUNTIME_BASE_URL=<your-toolchain-host> bash scripts/fetch-runtimes.sh
    ```

6.  **Launch.**
    ```bash
    npm run dev
    ```
    That's it — one process. The browser is the runtime.

---

**Built by Adithya Hegde Kota.**

I solve my problems. Then I generalize them so you can solve yours. I am leveling up, getting sharper, and building faster every single day.

**Open for opportunities.** If you want a builder who actually ships high-leverage work, let's talk.
