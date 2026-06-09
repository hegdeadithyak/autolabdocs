"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  anchors?: { label: string; href: string }[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const DOCS_NAV: NavGroup[] = [
  {
    title: "Getting Started",
    items: [{ label: "Overview", href: "/docs" }],
  },
  {
    title: "In-Browser Runtime",
    items: [
      {
        label: "How it works",
        href: "/docs/runtime",
        anchors: [
          { label: "The idea", href: "#idea" },
          { label: "Architecture", href: "#architecture" },
          { label: "Event protocol", href: "#protocol" },
          { label: "Blocking stdin", href: "#stdin" },
          { label: "Cross-origin isolation", href: "#isolation" },
          { label: "Language engines", href: "#engines" },
          { label: "Run lifecycle", href: "#lifecycle" },
          { label: "Security model", href: "#security" },
          { label: "Extending it", href: "#extending" },
        ],
      },
    ],
  },
  {
    title: "For Companies",
    items: [
      {
        label: "Runtime SDK",
        href: "/docs/sdk",
        anchors: [
          { label: "Install", href: "#install" },
          { label: "Usage", href: "#usage" },
          { label: "Promotion License", href: "#license" },
        ],
      },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="text-sm">
      <div className="mb-8">
        <Link
          href="/docs"
          className="text-white font-semibold text-base tracking-tight"
        >
          AutoLabDocs Docs
        </Link>
        <p className="text-xs text-zinc-500 mt-1">In-browser execution engine</p>
      </div>

      <div className="space-y-7">
        {DOCS_NAV.map((group) => (
          <div key={group.title}>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-3">
              {group.title}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-lg px-3 py-1.5 transition-colors ${
                        active
                          ? "bg-blue-500/10 text-blue-300 font-medium"
                          : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      {item.label}
                    </Link>
                    {active && item.anchors && (
                      <ul className="mt-1 ml-3 border-l border-white/[0.08] space-y-0.5">
                        {item.anchors.map((a) => (
                          <li key={a.href}>
                            <a
                              href={a.href}
                              className="block pl-4 py-1 text-[13px] text-zinc-500 hover:text-blue-300 transition-colors"
                            >
                              {a.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
