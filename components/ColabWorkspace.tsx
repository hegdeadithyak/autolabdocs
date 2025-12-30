import React, { useState } from 'react';
import { Project, ParsedCell } from '../types';
import { parseNotebook } from '../lib/notebookService';
import { api } from '../lib/api';
import { CellCard } from './CellCard';
import { Upload, ArrowLeft, Cloud, Eye } from 'lucide-react';

export const ColabWorkspace: React.FC<{
  project: Project;
  onBack: () => void;
  onPreview: () => void;
  onProjectUpdate: (p: Project) => void;
}> = ({ project, onBack, onPreview, onProjectUpdate }) => {
  const [parsedCells, setParsedCells] = useState<ParsedCell[] | null>(
    project.notebookContent && project.notebookContent.length > 0
      ? project.notebookContent
      : null
  );

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const cells = parseNotebook(text);
        const codeCells = cells.filter((c) => c.type === "code");
        setParsedCells(codeCells);

        const updated = { ...project, notebookContent: codeCells };
        await api.updateProject(updated);
        onProjectUpdate(updated);
      } catch (err) {
        alert("Invalid .ipynb file");
      }
    };
    reader.readAsText(file);
  };

  if (!parsedCells) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />

        <button
          onClick={onBack}
          className="absolute top-24 left-8 text-zinc-400 hover:text-white flex items-center gap-2 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="bg-[#0a0a0a] p-12 rounded-2xl border border-white/10 text-center max-w-lg w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

          <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 text-blue-400 border border-blue-500/20">
            <Cloud size={40} />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">
            Upload Notebook
          </h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Drag and drop your Google Colab <code>.ipynb</code> file here to
            automatically extract code and outputs.
          </p>

          <label className="group block w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl cursor-pointer font-bold transition-all active:scale-[0.98]">
            <span className="flex items-center justify-center gap-2">
              <Upload size={18} /> Select File
            </span>
            <input
              type="file"
              className="hidden"
              accept=".ipynb"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-24 px-4 max-w-4xl mx-auto">
      <div className="sticky top-20 z-30 mb-8 p-4 bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-2xl flex justify-between items-center shadow-2xl transition-all">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-zinc-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-white font-bold text-lg leading-none">
              {project.name}
            </h2>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
              Notebook Mode
            </span>
          </div>
        </div>
        <button
          onClick={onPreview}
          className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Eye size={16} /> Preview
        </button>
      </div>
      <div className="space-y-8 pb-24">
        {parsedCells.map((cell, idx) => (
          <CellCard key={idx} cell={cell} index={idx} />
        ))}
      </div>
    </div>
  );
};