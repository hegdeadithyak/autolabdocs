import React, { useEffect, useMemo, useState } from "react";
import { Project, ProjectType, AuthState } from "../types";
import { api } from "../lib/api";
import { CreateProjectModal } from "./CreateProjectModal";
import { Plus, Trash2, FolderOpen, Code, Cloud, Search } from "lucide-react";
// import SineWaveLoading from "./SineWaveLoading"; // Removed: Loading now managed by App.tsx

type Props = {
  user: AuthState["user"];
  onOpenProject: (p: Project) => void; // This is now the handler with minimum loading
  onLogout: () => void;
};

export function Dashboard({ user, onOpenProject, onLogout }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  // const [isLoadingProject, setIsLoadingProject] = useState(false); // Removed: Loading now managed by App.tsx

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getProjects();
        if (mounted) setProjects(data || []);
      } catch (err) {
        console.error("Failed to load projects", err);
        if (mounted) setProjects([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [showCreate]);

  const handleCreate = async (name: string, type: ProjectType) => {
    const p = await api.createProject(name, type);
    setShowCreate(false);
    onOpenProject(p);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm("Delete project? This cannot be undone.")) return;
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      console.error("Failed to delete project", err);
    }
  };

  const handleProjectClick = (p: Project) => {
    // setIsLoadingProject(true); // Removed: Loading now managed by App.tsx
    onOpenProject(p); // Call the prop which now handles the loading overlay
  };

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-[#070707] text-white">
      {/* {isLoadingProject && <SineWaveLoading />} Removed: Loading now managed by App.tsx */}
      <div className="absolute inset-0 bg-grid opacity-6 pointer-events-none" />

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}

      <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Projects</h1>
            <p className="text-zinc-400 mt-1">Organize notebooks & source code — black, minimal, refined.</p>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none md:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full bg-zinc-900/40 border border-zinc-800 rounded-xl pl-10 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/20 focus:bg-zinc-900 transition"
              />
            </div>

            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-sm font-semibold shadow-md hover:scale-[0.98] active:scale-95 transition transform"
            >
              <Plus size={16} />
              New Project
            </button>

            <button
              onClick={onLogout}
              className="hidden md:inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-white/5 text-zinc-300 hover:bg-white/2 transition"
              title="Logout"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading && (
            <div className="col-span-full py-20 flex items-center justify-center text-zinc-500">Loading projects...</div>
          )}

          {!loading && projects.length === 0 && !searchQuery && (
            <div className="col-span-full py-28 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-zinc-400 bg-white/2">
              <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mb-4 border border-white/5">
                <FolderOpen size={22} className="opacity-60" />
              </div>
              <p className="font-medium text-zinc-300">No projects yet</p>
              <p className="text-sm text-zinc-500 mt-2">Create notebooks or source-code projects — they’ll appear here.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/6"
              >
                Create your first project
              </button>
            </div>
          )}

          {!loading && filteredProjects.length === 0 && searchQuery && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500">
              <Search size={28} className="opacity-20 mb-2" />
              <p className="text-sm">No results for "{searchQuery}"</p>
            </div>
          )}

          {filteredProjects.map((p, idx) => (
            <article
              key={p.id}
              onClick={() => handleProjectClick(p)}
              className="group relative cursor-pointer overflow-hidden transform transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02]"
              style={{ transitionDelay: `${idx * 40}ms` }}
            >
              {/* Glassmorphic card with glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 group-hover:border-white/20 transition-all duration-500" />
              
              {/* Animated glow effect */}
              <div
                className={`absolute -inset-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl ${
                  p.type === ProjectType.COLAB
                    ? "bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-transparent"
                    : "bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-transparent"
                }`}
              />

              {/* Inner glow orb */}
              <div
                className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-700 ${
                  p.type === ProjectType.COLAB ? "bg-blue-400" : "bg-purple-400"
                }`}
              />

              {/* Card content */}
              <div className="relative z-10 p-6 h-full flex flex-col backdrop-blur-sm">
                {/* Header with floating icon */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${
                      p.type === ProjectType.COLAB
                        ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-400/30 text-blue-300 shadow-lg shadow-blue-500/20"
                        : "bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-400/30 text-purple-300 shadow-lg shadow-purple-500/20"
                    }`}
                  >
                    {/* Icon glow */}
                    <div
                      className={`absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-500 ${
                        p.type === ProjectType.COLAB ? "bg-blue-400/40" : "bg-purple-400/40"
                      }`}
                    />
                    {p.type === ProjectType.COLAB ? <Cloud size={20} className="relative z-10" /> : <Code size={20} className="relative z-10" />}
                  </div>

                  <button
                    onClick={(e) => handleDelete(p.id, e)}
                    className="text-zinc-400 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 backdrop-blur-sm border border-transparent hover:border-red-500/20 transition-all duration-300 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                    title="Delete project"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Project info with smooth reveal */}
                <div className="mb-4 space-y-3">
                  <h3 className="text-lg font-semibold text-white truncate transition-all duration-300 group-hover:text-white/90">
                    {p.name}
                  </h3>
                  
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-500 group-hover:scale-105 ${
                      p.type === ProjectType.COLAB
                        ? "bg-blue-500/15 text-blue-200 border border-blue-400/30 shadow-sm shadow-blue-500/10"
                        : "bg-purple-500/15 text-purple-200 border border-purple-400/30 shadow-sm shadow-purple-500/10"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                      p.type === ProjectType.COLAB ? "bg-blue-400" : "bg-purple-400"
                    }`} />
                    {p.type === ProjectType.COLAB ? "Notebook" : "Source Code"}
                  </div>
                </div>

                {/* Bottom info with glass separator */}
                <div className="mt-auto pt-4 border-t border-white/10 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-zinc-400" />
                      {p.filesCount ? `${p.filesCount} files` : "Empty"}
                    </span>
                    <span className="text-zinc-500">{new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
              
              {/* Edge highlight */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all duration-500 pointer-events-none" />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
