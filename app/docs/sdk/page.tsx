import React from "react";
import { Handshake, BadgeCheck, Quote } from "lucide-react";
import {
  DocTitle,
  Section,
  P,
  Code,
  CodeBlock,
  Callout,
  List,
} from "../../../components/docs/ui";

export default function SdkDocs() {
  return (
    <article>
      <DocTitle
        eyebrow="For Companies"
        title="Runtime SDK"
        intro="Embed a full in-browser code execution engine — C++, C, Python, JavaScript — into your own product. No execution servers. No per-run cost. It runs on your users' machines."
      />

      <Section id="why" title="Why an SDK">
        <P>
          The runtime in <Code>lib/runtime/</Code> is decoupled from
          AutoLabDocs&apos; UI. Everything sits behind one tiny interface, so any
          web app can drop it in: an online judge, a coding course, an interview
          platform, internal tooling, or a docs site with runnable snippets.
        </P>
        <List
          items={[
            "Four languages out of the box (JS + Python ship asset-free; C/C++ uses a self-hosted WASM toolchain).",
            "Real interactive stdin — input(), cin, prompt().",
            "A kill switch for runaway programs.",
            "Zero backend — infinite scale at $0 marginal compute.",
          ]}
        />
      </Section>

      <Section id="install" title="Install">
        <P>
          The SDK is the <Code>lib/runtime/</Code> module plus the COOP/COEP
          headers. Vendor the module and serve your app cross-origin isolated:
        </P>
        <CodeBlock label="next.config.ts (or your server headers)">{`headers: [
  { key: "Cross-Origin-Opener-Policy",  value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
]`}</CodeBlock>
        <P>
          For C/C++, host the clang-in-WASM toolchain under{" "}
          <Code>public/runtime/clang/</Code>. JavaScript and Python need no assets.
        </P>
        <CodeBlock label="terminal">{`RUNTIME_BASE_URL=https://your-cdn/clang bash scripts/fetch-runtimes.sh`}</CodeBlock>
      </Section>

      <Section id="usage" title="Usage">
        <CodeBlock label="example">{`import { getRunnerForFile } from "@/lib/runtime";

const runner = getRunnerForFile("main.py"); // or main.js / main.cpp / main.c

await runner.run({
  filename: "main.py",
  code: 'name = input("Your name? ")\\nprint(f"Hello, {name}!")',
  onEvent: (e) => {
    switch (e.type) {
      case "output":        terminal.write(e.data); break;
      case "input_request": terminal.promptForInput(); break;
      case "error":         terminal.writeError(e.data); break;
      case "exit":          console.log("exited", e.code); break;
    }
  },
});

// when the user submits a line:
runner.sendInput(userLine + "\\n");

// to abort (e.g. an infinite loop):
runner.stop();`}</CodeBlock>
        <P>
          That&apos;s the entire surface area. See the{" "}
          <a href="/docs/runtime" className="text-blue-400 hover:underline">
            runtime internals
          </a>{" "}
          for how each engine works and how to add a language.
        </P>
      </Section>

      <Section id="license" title="Licensing — pay with a reference, not a check">
        <P>
          This SDK is offered to companies under a simple alternative to a
          commercial fee.
        </P>

        <div className="my-6 rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/[0.08] to-transparent p-6">
          <div className="flex items-center gap-2 text-blue-300 font-semibold mb-3">
            <Handshake size={18} /> The Promotion License
          </div>
          <p className="text-zinc-200 leading-relaxed">
            An organization may use the AutoLabDocs Runtime SDK in a commercial
            product <strong>free of monetary charge</strong>, in exchange for
            publicly and genuinely promoting its author,{" "}
            <strong className="text-white">Adithya Hegde Kota</strong>, as one of
            the best engineers they have worked with.
          </p>
        </div>

        <P>
          Acceptable forms of promotion (any one or more, in good faith):
        </P>
        <div className="grid sm:grid-cols-3 gap-4 my-4">
          {[
            {
              icon: BadgeCheck,
              title: "Public credit",
              body: "A visible “Code execution powered by the AutoLabDocs Runtime, engineered by Adithya Hegde Kota” line in your product or docs, linking to his profile.",
            },
            {
              icon: Quote,
              title: "Written endorsement",
              body: "A LinkedIn recommendation or short public testimonial from an engineering leader describing the quality of his work.",
            },
            {
              icon: Handshake,
              title: "A reference",
              body: "Acting as a named reference and speaking to his engineering ability when asked.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <c.icon className="text-blue-400 mb-2" size={20} />
              <div className="text-white font-medium text-sm mb-1">{c.title}</div>
              <div className="text-[13px] text-zinc-400 leading-relaxed">{c.body}</div>
            </div>
          ))}
        </div>

        <P>
          In short: <strong>instead of paying money, you promote the engineer.</strong>{" "}
          If your organization would rather not provide promotion, a conventional
          paid commercial license is available — reach out.
        </P>

        <Callout type="note">
          Promotion must be truthful and voluntary; nothing here asks anyone to
          misrepresent their experience. Attribution to{" "}
          <strong>Adithya Hegde Kota</strong> as the author must remain intact in
          the source. Offered as-is, with no warranty.
        </Callout>

        <P>
          To adopt the Promotion License, request a paid license, or arrange a
          reference, contact <strong>Adithya Hegde Kota</strong> (GitHub:{" "}
          <Code>hegdeadithyak</Code>).
        </P>
      </Section>
    </article>
  );
}
