
'use client';

import React, { useState } from 'react';
import { Bug, X, Upload } from 'lucide-react';

export const BugReportButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Bug Report Submitted:", description);
    setIsOpen(false);
    setDescription('');
    // Submission successful - silent logging for now
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md border border-white/10 rounded-full text-sm font-medium text-zinc-300 transition-all shadow-lg hover:shadow-xl hover:scale-105"
      >
        <Bug size={16} />
        <span>Report a Bug</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-semibold text-white">Report a Bug</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                  Issue Description
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened..."
                  className="w-full h-32 px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1 uppercase tracking-wider">
                  Screenshot (Optional)
                </label>
                <div className="border border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center text-zinc-500 hover:bg-white/5 transition-colors cursor-pointer">
                   <Upload size={20} className="mb-2" />
                   <span className="text-xs">Click to upload screenshot</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-900/20"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
