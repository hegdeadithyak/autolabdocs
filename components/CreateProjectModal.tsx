import React, { useState } from 'react';
import { ProjectType } from '../types';
import { X, Layout, Cloud, Code } from 'lucide-react';

export const CreateProjectModal: React.FC<{
  onClose: () => void;
  onCreate: (name: string, type: ProjectType) => void;
}> = ({ onClose, onCreate }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>(ProjectType.COLAB);

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl p-0 shadow-2xl animate-scale-in relative overflow-hidden flex flex-col md:flex-row">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white z-10"
        >
          <X size={20} />
        </button>

        {/* Left Panel */}
        <div className="w-full md:w-1/3 bg-zinc-900/50 p-6 border-r border-white/5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white mb-2">New Project</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Create a new laboratory session workspace.
            </p>
          </div>
          <div className="relative z-10 mt-8 opacity-50">
            <Layout size={64} strokeWidth={0.5} className="text-white" />
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Project Name
            </label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Experiment 10"
              className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-700 focus:border-white/20 focus:bg-zinc-900 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Mode
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setType(ProjectType.COLAB)}
                className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${
                  type === ProjectType.COLAB
                    ? "bg-zinc-900 border-blue-500/50 shadow-sm"
                    : "bg-transparent border-white/10 hover:border-white/20"
                }`}
              >
                <div className="relative z-10">
                  <Cloud
                    size={20}
                    className={`mb-3 ${
                      type === ProjectType.COLAB
                        ? "text-blue-400"
                        : "text-zinc-500"
                    }`}
                  />
                  <div className="font-semibold text-sm text-white">
                    Import Colab
                  </div>
                </div>
              </button>

              <button
                onClick={() => setType(ProjectType.IDE)}
                className={`relative p-4 rounded-xl border text-left transition-all group overflow-hidden ${
                  type === ProjectType.IDE
                    ? "bg-zinc-900 border-purple-500/50 shadow-sm"
                    : "bg-transparent border-white/10 hover:border-white/20"
                }`}
              >
                <div className="relative z-10">
                  <Code
                    size={20}
                    className={`mb-3 ${
                      type === ProjectType.IDE
                        ? "text-purple-400"
                        : "text-zinc-500"
                    }`}
                  />
                  <div className="font-semibold text-sm text-white">
                    Source Code
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              disabled={!name.trim()}
              onClick={() => onCreate(name, type)}
              className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
