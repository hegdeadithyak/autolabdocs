import React from "react";
import type { Metadata } from "next";
import { DocsSidebar } from "../../components/docs/DocsSidebar";

export const metadata: Metadata = {
  title: "Docs · AutoLabDocs",
  description:
    "How AutoLabDocs runs C++, C, Python and JavaScript entirely in the browser via WebAssembly — architecture, internals, and the embeddable SDK.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-200 pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto py-10 pr-4 scrollbar-thin scrollbar-thumb-zinc-800">
              <DocsSidebar />
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 py-12 lg:py-16">
            <div className="max-w-3xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
