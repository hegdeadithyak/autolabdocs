import React from "react";
import Link from "next/link";
import { ArrowRight, Cpu, Code2, Boxes, ShieldCheck } from "lucide-react";
import { DocTitle, Section, P, Code, CodeBlock, List } from "../../components/docs/ui";

export default function DocsOverview() {
  return (
    <article>
      <DocTitle
        eyebrow="Documentation"
        title="Run code in the browser"
        intro={
          <>
            AutoLabDocs compiles and runs <strong className="text-zinc-200">C++, C,
            Python and JavaScript entirely in the user&apos;s browser</strong> via
            WebAssembly — no execution server, no Docker, no per-run cost.
          </>
        }
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-14">
        {[
          { icon: Cpu, title: "Runs on the host", body: "Every program executes on the visitor's own CPU, inside the browser." },
          { icon: Boxes, title: "Four languages", body: "JS & Python work asset-free; C/C++ via a clang-in-WASM toolchain." },
          { icon: Code2, title: "Real interactive I/O", body: "input(), cin >> and prompt() block for real input — like a terminal." },
          { icon: ShieldCheck, title: "Zero backend", body: "No execution server to attack, queue, or scale. Infinite scale at $0." },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
            <f.icon className="text-blue-400 mb-3" size={22} />
            <div className="text-white font-medium mb-1">{f.title}</div>
            <div className="text-sm text-zinc-400 leading-relaxed">{f.body}</div>
          </div>
        ))}
      </div>

      <Section id="quickstart" title="Quickstart">
        <P>
          The entire runtime lives in <Code>lib/runtime/</Code> and is driven
          through one tiny interface. Pick an engine by filename and run:
        </P>
        <CodeBlock label="example">{`import { getRunnerForFile } from "@/lib/runtime";

const runner = getRunnerForFile("main.py");

await runner.run({
  filename: "main.py",
  code: 'print("Hello from your own browser!")',
  onEvent: (e) => {
    if (e.type === "output") terminal.write(e.data);
    if (e.type === "exit")   console.log("done", e.code);
  },
});`}</CodeBlock>
        <P>
          That&apos;s the whole surface area: <Code>run()</Code>,{" "}
          <Code>sendInput()</Code>, and <Code>stop()</Code>.
        </P>
      </Section>

      <Section id="next" title="Where to next">
        <List
          items={[
            <Link key="r" href="/docs/runtime" className="text-blue-400 hover:underline">How it works →</Link>,
            <Link key="s" href="/docs/sdk" className="text-blue-400 hover:underline">Embed the SDK in your product →</Link>,
          ]}
        />
      </Section>

      <div className="mt-16 rounded-2xl border border-white/[0.08] bg-gradient-to-br from-blue-500/[0.06] to-transparent p-6">
        <div className="text-white font-semibold mb-1">Built by Adithya Hegde Kota</div>
        <p className="text-sm text-zinc-400 mb-4">
          The execution engine, the stdin channel, the WASM toolchain wiring —
          all designed and built by Adithya Hegde Kota.
        </p>
        <Link
          href="/docs/sdk#license"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          See the SDK &amp; Promotion License <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}
