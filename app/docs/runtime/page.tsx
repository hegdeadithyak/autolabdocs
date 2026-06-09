import React from "react";
import {
  DocTitle,
  Section,
  P,
  Code,
  CodeBlock,
  Callout,
  List,
} from "../../../components/docs/ui";

export default function RuntimeDocs() {
  return (
    <article>
      <DocTitle
        eyebrow="In-Browser Runtime"
        title="How it works"
        intro="The full path from a click on Run to a program executing on the user's own machine — and back to the terminal."
      />

      <Section id="idea" title="The idea">
        <P>
          A programming language is just a way to hand instructions to a
          computer. The computer that runs student code does <em>not</em> have to
          be a server we own — it can be the user&apos;s own machine, reached
          through the one runtime every device already ships with: the web
          browser.
        </P>
        <P>
          Browsers run native-speed code through <strong>WebAssembly (WASM)</strong>.
          So AutoLabDocs ships the toolchains themselves — a Python interpreter, a
          C/C++ compiler — compiled to WASM, plus a thin JavaScript host, and runs
          everything client-side. The old model (a Node.js <Code>node-pty</Code>{" "}
          service spawning Docker containers over WebSocket) has been removed
          entirely.
        </P>
      </Section>

      <Section id="architecture" title="Architecture">
        <P>
          The IDE asks a factory for a runner, hands it code and a callback, and
          forgets about the language. Each run gets its own dedicated Web Worker.
        </P>
        <CodeBlock label="data flow">{`components/IdeWorkspace.tsx              (IDE / terminal UI)
   │  getRunnerForFile(filename).run({ code, onEvent })
   ▼
lib/runtime/index.ts                     (engine selector + Runner)
   │  spawns one Web Worker per run
   ▼
 js/worker  |  python/worker  |  cpp/worker
 new Function|  Pyodide (WASM) |  clang+lld+libc++ → program.wasm → WASI
   │  postMessage(RunEvent)        ▲  Atomics + SharedArrayBuffer
   ▼                               │  (blocking stdin)
 terminal output               user keystrokes`}</CodeBlock>
        <P>
          Every engine speaks one message protocol, so the UI is identical
          regardless of language. The protocol is the contract; the engines are
          interchangeable implementations behind it.
        </P>
      </Section>

      <Section id="protocol" title="The event protocol">
        <P>
          A <Code>Runner</Code> is the entire interface the IDE talks to:
        </P>
        <CodeBlock label="lib/runtime/index.ts">{`interface Runner {
  run(opts: { code: string; filename: string;
              onEvent: (e: RunEvent) => void }): Promise<void>;
  sendInput(data: string): void;  // user typed a line
  stop(): void;                   // kill the program
}

type RunEvent =
  | { type: "output";        data: string }    // stdout / stderr
  | { type: "input_request"; prompt?: string } // blocked on stdin
  | { type: "exit";          code: number }     // finished
  | { type: "error";         data: string };    // exception / compile error`}</CodeBlock>
        <P>
          <Code>getRunnerForFile(name)</Code> selects the engine by extension
          (<Code>.js</Code> → JS, <Code>.py</Code> → Python,{" "}
          <Code>.c/.cpp/…</Code> → C/C++) and returns a worker-backed runner.
          Because this protocol matches what the terminal already consumed from
          the old WebSocket, swapping the server for the browser was a near
          drop-in change.
        </P>
      </Section>

      <Section id="stdin" title="Blocking stdin — the hard part">
        <P>
          Interactive programs (<Code>input()</Code>, <Code>std::cin {">>"}</Code>,{" "}
          <Code>prompt()</Code>) must <strong>block</strong> until the user types
          something. You can&apos;t block the main thread — the page would freeze —
          and <Code>postMessage</Code> is asynchronous, yet the runtimes call
          stdin synchronously. The fix is <Code>SharedArrayBuffer</Code> +{" "}
          <Code>Atomics</Code>:
        </P>
        <List
          items={[
            "The program runs inside a Web Worker (a real second thread).",
            <>Worker and main thread share one <Code>SharedArrayBuffer</Code> (<Code>lib/runtime/stdinChannel.ts</Code>).</>,
            <>On a stdin read, the worker posts <Code>input_request</Code> (UI shows a prompt) then calls <Code>Atomics.wait()</Code> — blocking the worker thread, not the UI.</>,
            <>The user submits; the main thread writes the bytes into the buffer and calls <Code>Atomics.notify()</Code>.</>,
            "The worker wakes, decodes the bytes, and returns them to the program.",
          ]}
        />
        <CodeBlock label="shared buffer layout">{`Int32[0]   = control flag (0 = waiting, 1 = ready)
Int32[1]   = payload byte length
bytes[8..] = UTF-8 input`}</CodeBlock>
      </Section>

      <Section id="isolation" title="Cross-origin isolation">
        <P>
          <Code>SharedArrayBuffer</Code> is only available on
          cross-origin-isolated pages, so <Code>next.config.ts</Code> sends:
        </P>
        <CodeBlock label="next.config.ts">{`Cross-Origin-Opener-Policy:   same-origin
Cross-Origin-Embedder-Policy: credentialless`}</CodeBlock>
        <Callout type="note">
          <Code>credentialless</Code> is chosen over <Code>require-corp</Code> so
          cross-origin assets — the Pyodide CDN, the banner image, analytics —
          keep loading without each needing CORP headers.
        </Callout>
      </Section>

      <Section id="engines" title="The language engines">
        <h3 className="text-lg font-semibold text-white mt-2 mb-2">JavaScript</h3>
        <P>
          Zero downloads, instant. The worker redirects <Code>console.*</Code> to
          output, exposes a synchronous <Code>prompt()</Code>/<Code>readline()</Code>{" "}
          backed by the stdin channel, and runs user code wrapped in an{" "}
          <Code>async</Code> IIFE so top-level <Code>await</Code> works.
        </P>

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">Python</h3>
        <P>
          Real CPython via <strong>Pyodide</strong> (CPython compiled to WASM),
          loaded from its CDN on first run. <Code>setStdout</Code>/
          <Code>setStderr</Code> stream to the terminal; <Code>setStdin</Code> is
          wired to the blocking channel; <Code>loadPackagesFromImports()</Code>{" "}
          auto-installs <Code>numpy</Code>, <Code>pandas</Code>,{" "}
          <Code>matplotlib</Code> and friends on demand.
        </P>

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">C / C++</h3>
        <P>
          A real <strong>clang + lld + libc++ toolchain compiled to WASM</strong>{" "}
          compiles and links the program on the client; the resulting{" "}
          <Code>program.wasm</Code> runs through a <strong>WASI</strong> runtime
          wired to stdout/stderr/stdin. The toolchain (~tens of MB) is not bundled
          — a setup step installs it under <Code>public/runtime/clang/</Code>{" "}
          behind a small adapter with a stable <Code>build()</Code>/<Code>run()</Code>{" "}
          contract.
        </P>
        <Callout type="warn">
          The JS and Python engines are production-ready. The C/C++ engine&apos;s
          wiring and contract are in place; it requires the WASM toolchain assets
          to be hosted (via <Code>scripts/fetch-runtimes.sh</Code>) and a
          real-browser validation pass.
        </Callout>
      </Section>

      <Section id="lifecycle" title="Run lifecycle">
        <List
          items={[
            <><Code>handleRun</Code> resolves the file&apos;s language; an unsupported extension shows a friendly message and stops.</>,
            "A fresh worker is spawned for the run.",
            <>Output chunks append to the terminal and buffer into the file&apos;s <Code>lastOutput</Code> so the exported lab document captures the run.</>,
            <><Code>input_request</Code> focuses the terminal input; the submitted line returns via <Code>sendInput</Code> → the stdin channel.</>,
            <>On <Code>exit</Code>, buffers flush onto the file (<Code>lastOutput</Code>/<Code>lastInput</Code>/<Code>lastError</Code>).</>,
            <><strong>Stop</strong> calls <Code>worker.terminate()</Code> — killing even infinite loops, which the old container model couldn&apos;t do cleanly.</>,
          ]}
        />
      </Section>

      <Section id="security" title="Security model">
        <List
          items={[
            "Code runs in the browser's Web Worker sandbox: no DOM, no parent-page access, no filesystem, no path into our infrastructure.",
            "There is no execution server to attack.",
            "Stopping a run terminates the worker and frees all its memory immediately.",
          ]}
        />
      </Section>

      <Section id="extending" title="Extending it — add a language">
        <P>Implement one worker that:</P>
        <List
          items={[
            <>listens for <Code>{"{ type: 'run', code, filename, sab }"}</Code>,</>,
            <>emits <Code>output</Code> / <Code>input_request</Code> / <Code>exit</Code> / <Code>error</Code>,</>,
            <>(optionally) uses <Code>readStdinBlocking(sab, …)</Code> for input.</>,
          ]}
        />
        <P>
          Then register the extension in <Code>languageForFile()</Code> and add a{" "}
          <Code>new Worker(new URL(&quot;./&lt;lang&gt;/worker.ts&quot;, import.meta.url))</Code>{" "}
          branch in <Code>createWorker()</Code>. The UI needs no changes.
        </P>
      </Section>
    </article>
  );
}
