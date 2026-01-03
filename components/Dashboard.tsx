"use client"

import type React from "react"
import { useEffect, useMemo, useState, useRef } from "react"
import { type Project, ProjectType, type AuthState } from "../types"
import { api } from "../lib/api"
import { CreateProjectModal } from "./CreateProjectModal"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Trash2, Code, FileCode2, Search, Clock, ArrowUpRight, Command, Folder } from "lucide-react"

type Props = {
  user: AuthState["user"]
  onOpenProject: (p: Project) => void
  onLogout: () => void
}

export function Dashboard({ user, onOpenProject, onLogout }: Props) {
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.getProjects()
        if (mounted) setProjects(data || [])
      } catch (err) {
        console.error("Failed to load projects", err)
        if (mounted) setProjects([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [showCreate])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault()
        setShowCreate(true)
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredProjects.length - 1))
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, -1))
      }
      if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault()
        onOpenProject(filteredProjects[selectedIndex])
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIndex, onOpenProject])

  const handleCreate = async (name: string, type: ProjectType) => {
    const p = await api.createProject(name, type)
    setShowCreate(false)
    onOpenProject(p)
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Delete this project?")) return
    try {
      await api.deleteProject(id)
      setProjects((prev) => prev.filter((x) => x.id !== id))
    } catch (err) {
      console.error("Failed to delete project", err)
    }
  }

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.name.toLowerCase().includes(q))
  }, [projects, searchQuery])

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div
      className="min-h-screen bg-[#0c0c0c] text-white antialiased selection:bg-blue-500/20"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, sans-serif' }}
    >
      <AnimatePresence>
        {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">Projects</h1>
              <p className="text-[13px] text-zinc-500 mt-1">
                {projects.length} {projects.length === 1 ? "project" : "projects"}
              </p>
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-[#0c0c0c] rounded-lg text-[13px] font-medium hover:bg-zinc-200 transition-colors"
            >
              <Plus size={14} strokeWidth={2} />
              <span className="hidden sm:inline">New project</span>
              <div className="hidden sm:flex items-center gap-0.5 ml-1 text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                <Command size={9} />
                <span>N</span>
              </div>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedIndex(-1)
              }}
              placeholder="Search projects..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-20 py-2.5 text-[13px] text-white placeholder-zinc-600 focus:outline-none focus:border-white/[0.15] focus:bg-white/[0.05] transition-colors"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 bg-white/[0.04] rounded border border-white/[0.06]">
              <Command size={10} className="text-zinc-600" />
              <span className="text-[10px] text-zinc-600">K</span>
            </div>
          </div>
        </motion.header>

        {/* Content */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.4 }}>
          {/* Loading */}
          {loading && (
            <div className="py-20 flex flex-col items-center">
              <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              <p className="text-[13px] text-zinc-600 mt-3">Loading...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && projects.length === 0 && !searchQuery && (
            <div className="py-20 flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-4">
                <Folder size={20} className="text-zinc-600" />
              </div>
              <h3 className="text-[15px] font-medium text-white mb-1">No projects yet</h3>
              <p className="text-[13px] text-zinc-500 mb-6">Create your first project to get started</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-[13px] font-medium hover:bg-blue-400 transition-colors"
              >
                <Plus size={14} />
                Create project
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && filteredProjects.length === 0 && searchQuery && (
            <div className="py-20 flex flex-col items-center">
              <Search size={20} className="text-zinc-700 mb-3" />
              <p className="text-[13px] text-zinc-500">No results for "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 text-[13px] text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Projects List */}
          {filteredProjects.length > 0 && (
            <div className="space-y-1">
              {filteredProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.3 }}
                  onClick={() => onOpenProject(project)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${
                    selectedIndex === idx ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      project.type === ProjectType.COLAB
                        ? "bg-orange-500/10 text-orange-400"
                        : "bg-blue-500/10 text-blue-400"
                    }`}
                  >
                    {project.type === ProjectType.COLAB ? <FileCode2 size={16} /> : <Code size={16} />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-medium text-white truncate">{project.name}</h3>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${
                          project.type === ProjectType.COLAB
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                      >
                        {project.type === ProjectType.COLAB ? "Notebook" : "Code"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[12px] text-zinc-600">{project.filesCount || 0} files</span>
                      <span className="text-[12px] text-zinc-700 flex items-center gap-1">
                        <Clock size={10} />

                        {formatDate(project.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ArrowUpRight size={14} className="text-zinc-600 mr-1" />
                  </div>

                  {/* Selection indicator */}
                  {selectedIndex === idx && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r" />
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer hint */}
        {filteredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 pt-6 border-t border-white/[0.04] flex items-center justify-center gap-4 text-[11px] text-zinc-700"
          >
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded border border-white/[0.06]">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/[0.04] rounded border border-white/[0.06]">↵</kbd>
              open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-white/[0.04] rounded border border-white/[0.06] flex items-center gap-0.5">
                <Command size={8} />N
              </kbd>
              new
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
