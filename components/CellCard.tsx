import React, { useEffect, useMemo, useRef } from "react";
import { ParsedCell } from "../types";
import { Terminal, Code, AlignLeft, Copy } from "lucide-react";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-markdown";
// import a prism theme once in your app (e.g. in index.css or App.tsx)
import "prismjs/themes/prism-tomorrow.css";

interface CellCardProps {
  cell: ParsedCell;
  index: number;
  isActive?: boolean;
}

export const CellCard: React.FC<CellCardProps> = ({ cell, index, isActive }) => {
  const codeRef = useRef<HTMLPreElement | null>(null);
  const hasOutput = !!(cell.outputs && cell.outputs.length);
  const content = cell.content || "";

  // tokenized HTML (memoized)
  const highlightedHtml = useMemo(() => {
    try {
      // Prism expects a string; fallback to empty string
      return Prism.highlight(content, Prism.languages.python, "python");
    } catch (e) {
      return content; // fallback to raw text if highlight fails
    }
  }, [content]);

  // keep focus/scroll behavior if you want (example hook)
  useEffect(() => {
    if (isActive && codeRef.current) {
      // optional: scroll into view for active cell
      codeRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [isActive]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      // small UI feedback would be appropriate (toast/snackbar)
    } catch {
      // ignore silently; or show fallback UI
    }
  };

  if (cell.type === "markdown") {
    return (
      <div
        id={`cell-${index}`}
        className={`group mb-6 w-full print-break-inside-avoid transition-all duration-300 ${
          isActive ? "ring-1 ring-blue-500/30" : ""
        }`}
      >
        <div className="relative ml-0">
          <div className="rounded-sm border-l-2 border-blue-500/20 pl-4 py-2">
            <div className="whitespace-pre-wrap font-sans text-base text-zinc-300 leading-relaxed opacity-90 prose prose-invert">
              {cell.content}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`cell-${index}`}
      className={`group mb-12 w-full animate-slide-up print-break-inside-avoid transition-all duration-300 ${
        isActive ? "scale-[1.005]" : ""
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex flex-col gap-0">
        {/* CODE EDITOR PANE */}
        <div className="rounded-t-lg border border-[#3e3e42] bg-[#1e1e1e] overflow-hidden shadow-xl">
          {/* STRICT EDITOR TAB HEADER */}
          <div className="flex items-center justify-between px-0 bg-[#252526] border-b border-[#3e3e42] h-9">
            <div className="flex h-full">
              <div className="px-4 h-full flex items-center gap-2 bg-[#1e1e1e] border-t-2 border-t-blue-500 border-r border-[#3e3e42] min-w-[120px]">
                <Code size={13} className="text-blue-400" />
                <span className="text-xs font-medium text-[#cccccc] font-mono">
                  In[{cell.executionCount ?? " "}]
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3">
              <span className="text-[10px] text-zinc-500 font-mono uppercase">
                Python
              </span>
              <button
                onClick={handleCopy}
                title="Copy code"
                className="p-1 rounded-md hover:bg-white/5 transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          <div className="p-4 overflow-x-auto bg-[#1e1e1e] relative">
            <pre
              ref={codeRef}
              className="language-python !bg-transparent !p-0 !m-0 !text-sm !font-mono !text-[#d4d4d4] !leading-relaxed !shadow-none"
              // Prism returns HTML with <span class="token ..."> elements.
              // We inject that HTML here. Keep it read-only.
              dangerouslySetInnerHTML={{
                __html: `<code class="language-python">${highlightedHtml ||
                  ""}</code>`,
              }}
            />
          </div>
        </div>

        {/* OUTPUT PANE */}
        <div
          className={`border-x border-b border-[#3e3e42] bg-[#0d1117] rounded-b-lg overflow-hidden ${
            !hasOutput ? "py-2 px-4 border-dashed opacity-50" : ""
          }`}
        >
          {hasOutput ? (
            <div className="p-4 overflow-x-auto">
              <div className="flex items-center gap-2 mb-2 opacity-50">
                <Terminal size={12} />
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Output
                </span>
              </div>

              <div className="space-y-4">
                {cell.outputs!.map((output, idx) => (
                  <div key={idx} className="w-full">
                    {output.type === "image" && (
                      <div className="inline-block relative rounded overflow-hidden border border-white/10">
                        <img
                          src={`data:${output.mimeType};base64,${output.data}`}
                          alt="Cell Output"
                          className="max-w-full h-auto block"
                        />
                      </div>
                    )}

                    {output.type === "text" && (
                      <pre className="font-mono text-xs md:text-sm text-[#e1e4e8] whitespace-pre-wrap leading-tight">
                        {output.data}
                      </pre>
                    )}

                    {output.type === "error" && (
                      <div className="p-3 bg-red-950/20 border-l-2 border-red-500">
                        <pre className="font-mono text-xs text-red-300 whitespace-pre-wrap leading-tight">
                          {output.data}
                        </pre>
                      </div>
                    )}

                    {output.type === "html" && (
                      <div
                        className="prose prose-invert max-w-none text-sm p-2 bg-white/5 rounded"
                        dangerouslySetInnerHTML={{ __html: output.data as string }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-zinc-600 select-none text-xs font-mono p-3">
              <span>No output generated</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
