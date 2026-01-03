"use client"

import React, { useState, useCallback } from "react"
import {
  Upload,
  ArrowLeft,
  Eye,
  Sparkles,
  AlertTriangle,
  Terminal,
} from "lucide-react"
import { CellCard } from "./CellCard"
import { PreviewModal, PreviewFile } from "./PreviewModal"
import { parseNotebook as defaultParseNotebook } from "../lib/notebookService"
import { generateWordDocument } from "./exportService"
import { Project, ParsedCell } from "../types"

interface ColabWorkspaceProps {
  project: Project;
  onBack: () => void;
  onProjectUpdate: (p: Project) => void;
  parseNotebook?: (text: string) => ParsedCell[];
  api: {
    updateProject: (p: Project) => Promise<any>;
  };
}

export const ColabWorkspace: React.FC<ColabWorkspaceProps> = ({ project, onBack, onProjectUpdate, parseNotebook, api }) => {
  const [parsedCells, setParsedCells] = useState<ParsedCell[] | null>(
    project.notebookContent && project.notebookContent.length > 0 ? project.notebookContent : null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const parser = parseNotebook || defaultParseNotebook

  const handleFile = useCallback(
    (file: File) => {
      setParseError(null)
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const text = e.target?.result
          if (typeof text !== "string") return
          const cells = parser(text)
          setParsedCells(cells)

          const updated = { ...project, notebookContent: cells }
          await api.updateProject(updated)
          onProjectUpdate(updated)
        } catch (err: any) {
          setParseError(err.message || "Failed to parse notebook")
        }
      }
      reader.onerror = () => {
        setParseError("Failed to read file")
      }
      reader.readAsText(file)
    },
    [api, onProjectUpdate, parser, project],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && file.name.endsWith(".ipynb")) {
        handleFile(file)
      } else {
        setParseError("Please upload a .ipynb file")
      }
    },
    [handleFile],
  )

  if (!parsedCells) {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0f] to-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif' }}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <button
          onClick={onBack}
          className="absolute top-8 left-8 text-zinc-500 hover:text-white flex items-center gap-2 transition-all group hover:scale-105 z-10"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm tracking-[-0.01em] font-medium">Back to Dashboard</span>
        </button>

        <div className="relative z-10">
          {/* Enhanced glow effect */}
          <div
            className={`absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/30 via-cyan-500/30 to-purple-500/30 blur-2xl transition-all duration-500 ${isDragging ? "opacity-100 scale-110" : "opacity-0 scale-100"}`}
          />

          <div
            className={`relative bg-gradient-to-br from-zinc-900/80 to-zinc-900/60 backdrop-blur-2xl p-14 rounded-3xl border text-center max-w-2xl w-full shadow-2xl transition-all duration-300 ${isDragging ? "border-blue-500/60 scale-[1.02] shadow-blue-500/20" : "border-white/[0.1]"}`}
          >
            {/* Enhanced icon */}
            <div className="relative w-28 h-28 mx-auto mb-10">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 blur-2xl animate-pulse" />
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-purple-500/20 border border-white/[0.15] flex items-center justify-center shadow-2xl">
                <Sparkles size={48} className="text-blue-400" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4 tracking-[-0.02em] bg-gradient-to-r from-white via-blue-100 to-cyan-100 bg-clip-text text-transparent">
              Upload Notebook
            </h2>
            <p className="text-zinc-400 text-base mb-8 leading-relaxed tracking-[-0.01em] max-w-md mx-auto">
              Drag and drop your Google Colab{" "}
              <code className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 font-mono text-sm">
                .ipynb
              </code>{" "}
              file to automatically extract and visualize your code and outputs.
            </p>

            {parseError && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-left backdrop-blur-sm">
                <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400 font-semibold">Failed to parse notebook</p>
                  <p className="text-xs text-red-400/80 mt-1">{parseError}</p>
                </div>
              </div>
            )}

            <label className="group block w-full py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl cursor-pointer font-bold transition-all active:scale-[0.98] shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:shadow-[0_0_60px_rgba(59,130,246,0.5)] relative overflow-hidden">
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <span className="relative flex items-center justify-center gap-3 tracking-[-0.01em] text-lg">
                <Upload size={22} className="group-hover:scale-110 transition-transform" />
                Select File
              </span>
              <input
                type="file"
                className="hidden"
                accept=".ipynb"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>

            <p className="text-zinc-600 text-xs mt-4">or drag and drop your file anywhere</p>
          </div>
        </div>
      </div>
    )
  }

  const codeCells = parsedCells.filter((c) => c.type === "code")
  const markdownCells = parsedCells.filter((c) => c.type === "markdown")
  
  const previewFiles: PreviewFile[] = parsedCells.map((cell, idx) => ({
    name: `Cell ${idx + 1}`,
    content: cell.content,
    type: cell.type,
    outputs: cell.outputs
  }));

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0a0a0f] to-[#050505] pt-24 px-4 pb-12"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif' }}
    >
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Enhanced sticky header */}
        <div className="sticky top-6 z-30 mb-10">
          <div className="relative">
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-purple-500/20 blur-xl" />
            <div className="relative p-5 bg-gradient-to-br from-zinc-900/95 to-zinc-900/90 backdrop-blur-2xl border border-white/[0.12] rounded-2xl flex justify-between items-center shadow-2xl">
              <div className="flex items-center gap-5">
                <button
                  onClick={onBack}
                  className="text-zinc-400 hover:text-white p-2.5 hover:bg-white/[0.08] rounded-xl transition-all hover:scale-110 active:scale-95"
                >
                  <ArrowLeft size={22} />
                </button>
                <div>
                  <h2 className="text-white font-bold text-xl leading-none tracking-[-0.02em] mb-2">
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <Terminal size={12} className="text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
                        Notebook
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      <span className="text-emerald-400 font-semibold">{codeCells.length}</span> code cells ·{" "}
                      <span className="text-cyan-400 font-semibold">{markdownCells.length}</span> markdown
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(true)}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-sm font-bold flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Eye size={18} className="relative group-hover:scale-110 transition-transform" />
                <span className="relative">Preview</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cells grid */}
        <div className="space-y-8">
          {parsedCells.map((cell, idx) => (
            <CellCard key={idx} cell={cell} index={idx} />
          ))}
        </div>

        {/* Summary footer */}
        <div className="mt-12 p-6 bg-gradient-to-br from-zinc-900/50 to-zinc-900/30 backdrop-blur-xl border border-white/[0.08] rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{parsedCells.length}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Cells</div>
              </div>
              <div className="w-px h-12 bg-white/[0.1]" />
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">{codeCells.length}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Code</div>
              </div>
              <div className="w-px h-12 bg-white/[0.1]" />
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-1">{markdownCells.length}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Markdown</div>
              </div>
            </div>
            <Sparkles size={32} className="text-zinc-700" />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && <PreviewModal title={project.name} files={previewFiles} onClose={() => setShowPreview(false)} onDownload={() => generateWordDocument(project)} />}
    </div>
  )
}
