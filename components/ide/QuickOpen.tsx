import React, { useEffect, useRef, useState, useMemo } from 'react';
import { FileIcon } from './FileIcon';
import { Search, Command } from 'lucide-react';

interface QuickOpenFile {
  id: string;
  name: string;
  content?: string;
}

interface QuickOpenProps {
  files: QuickOpenFile[];
  onSelect: (fileId: string) => void;
  onClose: () => void;
}

function fuzzyScore(text: string, pattern: string): { score: number; positions: number[] } {
  if (!pattern) return { score: 0, positions: [] };
  let score = 0;
  const positions: number[] = [];
  let ti = 0;
  const lowerPattern = pattern.toLowerCase();
  const lowerText = text.toLowerCase();
  
  for (let pi = 0; pi < lowerPattern.length; pi++) {
    const c = lowerPattern[pi];
    let found = false;
    while (ti < lowerText.length) {
      if (lowerText[ti] === c) {
        positions.push(ti);
        score += 10;
        if (pi > 0 && positions[pi - 1] + 1 === ti) score += 5;
        found = true;
        ti++;
        break;
      }
      ti++;
    }
    if (!found) return { score: -Infinity, positions: [] };
  }
  score += Math.max(0, 20 - positions[0]);
  return { score, positions };
}

function highlightMatch(text: string, positions: number[]) {
  if (positions.length === 0) return text;
  
  const chars = text.split('');
  return chars.map((char, i) => (
    positions.includes(i) ? (
      <span key={i} className="text-ide-accent font-semibold">{char}</span>
    ) : char
  ));
}

export function QuickOpen({ files, onSelect, onClose }: QuickOpenProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const candidates = useMemo(() => {
    if (!query) return files.map(f => ({ file: f, score: 0, positions: [] as number[] }));
    return files
      .map(f => ({ file: f, ...fuzzyScore(f.name, query) }))
      .filter(x => x.score !== -Infinity)
      .sort((a, b) => b.score - a.score);
  }, [files, query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, candidates.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const picked = candidates[selectedIndex];
        if (picked) {
          onSelect(picked.file.id);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [candidates, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div 
      className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#252526] border border-[#454545] rounded-md shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 px-2 py-2">
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type the name of a file to open"
            className="flex-1 bg-[#3c3c3c] border border-transparent focus:border-[#007fd4] text-white text-[13px] px-2 py-1 outline-none placeholder:text-[#858585]"
          />
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-80 overflow-y-auto ide-scroll">
          {candidates.length === 0 && query ? (
            <div className="px-4 py-4 text-center text-[#858585] text-[13px]">
              No matching files
            </div>
          ) : (
            candidates.map((c, idx) => (
              <div
                key={c.file.id}
                data-selected={idx === selectedIndex}
                onClick={() => {
                  onSelect(c.file.id);
                  onClose();
                }}
                className={`px-3 py-1 flex items-center gap-2 cursor-pointer ${
                  idx === selectedIndex 
                    ? 'bg-[#04395e] text-white' 
                    : 'text-[#cccccc] hover:bg-[#2a2d2e]'
                }`}
              >
                <FileIcon filename={c.file.name} size={16} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] truncate flex items-center gap-2">
                    {highlightMatch(c.file.name, c.positions)}
                    {c.file.content && <span className="text-[11px] opacity-60 ml-2 truncate max-w-[200px]">{c.file.content.replace(/\n/g, ' ').slice(0, 50)}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {candidates.length === 0 && !query && (
           <div className="px-4 py-2 text-[12px] text-[#858585] border-t border-[#454545]">
              Type to search files
           </div>
        )}
      </div>
    </div>
  );
}
