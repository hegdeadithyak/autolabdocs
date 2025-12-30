import React from 'react';
import { Project, ProjectType, ParsedCell } from '../types';
import { X, Download } from 'lucide-react';
import { generateWordDocument, stripAnsi } from './exportService';

export const PreviewModal: React.FC<{ project: Project; onClose: () => void }> = ({
  project,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-3xl bg-white text-black rounded-lg shadow-2xl flex flex-col max-h-[85vh] animate-scale-in">
        <div className="p-4 border-b flex justify-between items-center bg-zinc-50 rounded-t-lg shrink-0">
          <h3 className="font-bold text-lg">Document Preview</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 font-serif bg-white">
          <div className="text-center border-b pb-6 mb-6">
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-sm text-zinc-500 uppercase tracking-wider">
              Automated Lab Report • {new Date().toLocaleDateString()}
            </p>
          </div>
          {project.type === ProjectType.COLAB && project.notebookContent ? (
            <div className="space-y-6">
              {project.notebookContent.map((cell: ParsedCell, idx: number) => (
                <div key={idx} className="mb-6 break-inside-avoid">
                  <div className="text-[10px] font-bold uppercase text-zinc-400 mb-1 border-l-2 border-black pl-2">
                    Cell {idx + 1}
                  </div>
                  <div className="bg-[#f5f5f5] p-3 rounded text-sm font-mono whitespace-pre-wrap border border-zinc-200 mb-2">
                    {cell.content}
                  </div>
                  {cell.outputs && cell.outputs.length > 0 && (
                    <div className="pl-4 border-l-2 border-zinc-200">
                      <div className="text-[10px] font-bold uppercase text-zinc-400 mb-1">
                        Output
                      </div>
                      {(cell.outputs || []).map((out, outIdx) => (
                        <div key={outIdx}>
                          {out.type === "text" && (
                            <pre className="text-xs font-mono bg-white p-2 border rounded whitespace-pre-wrap">
                              {stripAnsi(out.data)}
                            </pre>
                          )}
                          {out.type === "image" && (
                            <img
                              src={`data:${out.mimeType};base64,${out.data}`}
                              className="max-w-full h-auto border rounded"
                              alt="Output"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {project.notebookContent.length === 0 && (
                <div className="text-center text-zinc-400 italic">
                  No content found in notebook.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {project.files &&
                project.files.map((f: any, i: number) => (
                  <div key={i} className="space-y-2 break-inside-avoid">
                    <h4 className="font-bold text-lg border-b pb-1 mb-2">
                      Experiment {i + 1}: {f.name}
                    </h4>

                    <div className="text-[10px] uppercase font-bold text-zinc-500">
                      Source Code
                    </div>
                    <div className="bg-[#1e1e1e] text-zinc-300 p-4 rounded font-mono text-xs whitespace-pre-wrap">
                      {f.content}
                    </div>

                    {f.lastInput && (
                      <>
                        <div className="text-[10px] uppercase font-bold text-zinc-500 mt-2">
                          Input
                        </div>
                        <div className="bg-zinc-100 p-2 rounded font-mono text-xs border">
                          {stripAnsi(f.lastInput)}
                        </div>
                      </>
                    )}

                    <div className="text-[10px] uppercase font-bold text-zinc-500 mt-2">
                      Output
                    </div>
                    {f.lastOutput ? (
                      <div className="bg-zinc-50 border p-3 rounded font-mono text-xs whitespace-pre-wrap">
                        {stripAnsi(f.lastOutput)}
                      </div>
                    ) : (
                      <div className="text-zinc-400 italic text-sm">
                        No output recorded.
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-zinc-50 rounded-b-lg flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-black transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              generateWordDocument(project);
              onClose();
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm flex items-center gap-2 shadow-lg"
          >
            <Download size={16} /> Download .DOCX
          </button>
        </div>
      </div>
    </div>
  );
};
