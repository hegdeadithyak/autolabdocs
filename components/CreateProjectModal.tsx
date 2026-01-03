"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X, Cloud, Code, Sparkles } from "lucide-react"

enum ProjectType {
  COLAB = "COLAB",
  IDE = "IDE",
}

export const CreateProjectModal: React.FC<{
  onClose: () => void
  onCreate: (name: string, type: ProjectType) => void
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState("")
  const [type, setType] = useState<ProjectType>(ProjectType.COLAB)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        {/* Glow */}
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 blur-xl opacity-60" />

        <div className="relative bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="relative px-6 py-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-white/[0.08]">
                <Sparkles size={20} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white tracking-[-0.02em]">New Project</h2>
                <p className="text-xs text-zinc-500 tracking-[-0.01em]">Create a new lab session</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Name input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 tracking-[-0.01em]">Project Name</label>
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) {
                    onCreate(name, type)
                  }
                }}
                placeholder="e.g. Experiment 10"
                className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all font-medium tracking-[-0.01em]"
              />
            </div>

            {/* Mode selection */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-400 tracking-[-0.01em]">Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setType(ProjectType.COLAB)}
                  className={`group relative p-4 rounded-xl border text-left transition-all overflow-hidden ${
                    type === ProjectType.COLAB
                      ? "bg-blue-500/10 border-blue-500/30"
                      : "bg-black/20 border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  {type === ProjectType.COLAB && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                  )}
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        type === ProjectType.COLAB ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      <Cloud size={20} />
                    </div>
                    <div className="font-semibold text-sm text-white tracking-[-0.01em]">Import Colab</div>
                    <div className="text-[11px] text-zinc-500 mt-1">Upload .ipynb file</div>
                  </div>
                </button>

                <button
                  onClick={() => setType(ProjectType.IDE)}
                  className={`group relative p-4 rounded-xl border text-left transition-all overflow-hidden ${
                    type === ProjectType.IDE
                      ? "bg-cyan-500/10 border-cyan-500/30"
                      : "bg-black/20 border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  {type === ProjectType.IDE && (
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
                  )}
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        type === ProjectType.IDE ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-zinc-500"
                      }`}
                    >
                      <Code size={20} />
                    </div>
                    <div className="font-semibold text-sm text-white tracking-[-0.01em]">Source Code</div>
                    <div className="text-[11px] text-zinc-500 mt-1">Write from scratch</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={!name.trim()}
              onClick={() => onCreate(name, type)}
              className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.1)] tracking-[-0.01em]"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ProjectType }
