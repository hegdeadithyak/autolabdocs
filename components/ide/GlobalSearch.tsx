import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FileIcon } from './FileIcon';
import { Search, X, FileText } from 'lucide-react';

interface SearchFile {
  id: string;
  name: string;
  content?: string;
}

interface SearchResult {
  file: SearchFile;
  snippet: string;
  lineNumber?: number;
}

interface GlobalSearchProps {
  files: SearchFile[];
  onSelect: (fileId: string) => void;
  onClose: () => void;
}

export function GlobalSearch({ files, onSelect, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    for (const file of files) {
      const content = file.content || '';
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const idx = line.toLowerCase().indexOf(q);
        if (idx !== -1) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(line.length, idx + query.length + 50);
          matches.push({
            file,
            snippet: line.slice(start, end),
            lineNumber: i + 1,
          });
          break; // One match per file for now
        }
      }
    }

    return matches.slice(0, 20);
  }, [files, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  function highlightMatch(text: string, term: string) {
    if (!term) return text;
    const idx = text.toLowerCase().indexOf(term.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#ea5c00]/50 text-white rounded-none px-0">{text.slice(idx, idx + term.length)}</mark>
        {text.slice(idx + term.length)}
      </>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] px-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#252526] border border-[#454545] rounded-sm shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search header */}
        <div className="flex items-center gap-2 px-2 py-2 border-b border-[#454545] bg-[#252526]">
          <div className="relative flex-1">
             <input
               ref={inputRef}
               value={query}
               onChange={e => setQuery(e.target.value)}
               placeholder="Search"
               className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007fd4] text-white text-[13px] px-2 py-1 outline-none placeholder:text-[#858585]"
             />
             <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button onClick={() => setQuery('')} className="text-[#858585] hover:text-white">
                   <X size={14} />
                </button>
             </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto ide-scroll">
          {query && results.length === 0 && (
            <div className="px-4 py-4 text-center text-[#858585] text-[13px]">
              No results found
            </div>
          )}
          
          {!query && (
            <div className="px-4 py-4 text-center text-[#858585] text-[13px]">
              Type to search
            </div>
          )}

          {results.map((r, idx) => (
            <div
              key={`${r.file.id}-${idx}`}
              onClick={() => {
                onSelect(r.file.id);
                onClose();
              }}
              className="px-4 py-2 hover:bg-[#2a2d2e] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <FileIcon filename={r.file.name} size={16} />
                <span className="font-semibold text-[13px] text-[#cccccc]">{r.file.name}</span>
                {r.lineNumber && (
                  <span className="text-xs text-[#858585] ml-auto">:{r.lineNumber}</span>
                )}
              </div>
              <div className="font-mono text-[12px] text-[#858585] truncate pl-6">
                {highlightMatch(r.snippet, query)}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {query && results.length > 0 && (
          <div className="px-4 py-1 border-t border-[#454545] text-xs text-[#858585] flex items-center gap-2 bg-[#252526]">
            <span className="text-[#007fd4]">{results.length} results</span>
          </div>
        )}
      </div>
    </div>
  );
}
