import React from "react";

// Small presentational primitives for the documentation pages. Kept dependency
// free (no `prose` plugin) so styling is explicit and predictable.

export function DocTitle({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: React.ReactNode;
}) {
  return (
    <header className="mb-12 border-b border-white/[0.08] pb-8">
      {eyebrow && (
        <div className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">
          {eyebrow}
        </div>
      )}
      <h1 className="text-4xl font-semibold tracking-[-0.03em] text-white">
        {title}
      </h1>
      {intro && (
        <p className="mt-4 text-lg text-zinc-400 leading-relaxed max-w-2xl">
          {intro}
        </p>
      )}
    </header>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-14">
      <h2 className="group flex items-center gap-2 text-2xl font-semibold tracking-[-0.02em] text-white mb-5">
        <a href={`#${id}`} className="hover:text-blue-400 transition-colors">
          {title}
        </a>
        <span className="opacity-0 group-hover:opacity-100 text-blue-500/60 text-base transition-opacity">
          #
        </span>
      </h2>
      <div className="space-y-4 text-[15px] leading-relaxed text-zinc-300">
        {children}
      </div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-zinc-300 leading-relaxed">{children}</p>;
}

export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[13px] font-mono text-blue-300">
      {children}
    </code>
  );
}

export function CodeBlock({
  children,
  label,
}: {
  children: string;
  label?: string;
}) {
  return (
    <div className="my-5 rounded-xl border border-white/[0.08] bg-[#0d1117] overflow-hidden">
      {label && (
        <div className="px-4 py-2 border-b border-white/[0.06] text-[11px] font-mono uppercase tracking-wider text-zinc-500 bg-white/[0.02]">
          {label}
        </div>
      )}
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-[#d4d4d4]">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function Callout({
  type = "note",
  children,
}: {
  type?: "note" | "warn" | "tip";
  children: React.ReactNode;
}) {
  const styles = {
    note: "border-blue-500/30 bg-blue-500/[0.06] text-blue-100",
    warn: "border-amber-500/30 bg-amber-500/[0.06] text-amber-100",
    tip: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-100",
  }[type];
  const label = { note: "Note", warn: "Heads up", tip: "Tip" }[type];
  return (
    <div className={`my-5 rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles}`}>
      <span className="font-semibold mr-2">{label}.</span>
      {children}
    </div>
  );
}

export function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="my-4 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-zinc-300 leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500/70" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
