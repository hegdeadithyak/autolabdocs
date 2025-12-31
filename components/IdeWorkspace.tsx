'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { api } from '../lib/api';
import { Project, IdeFile } from '../types';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import {
  Files,
  Search,
  GitBranch,
  Play,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  Eye,
  Check,
  Settings,
  LogOut,
  PanelBottomClose,
  RefreshCw,
  ArrowRight,
  Circle,
  AlertCircle,
} from 'lucide-react';
import { FileIcon } from './ide/FileIcon';
import {
  ContextMenu,
  getEditorContextMenuItems,
  getFileContextMenuItems,
  getTerminalContextMenuItems,
} from './ide/ContextMenu';
import { QuickOpen } from './ide/QuickOpen';
import { GlobalSearch } from './ide/GlobalSearch';

interface IdeWorkspaceProps {
  project: Project;
  onBack: () => void;
  onExport: () => void;
  onProjectUpdate: (p: Project) => void;
}

export function IdeWorkspace({ project, onBack, onExport, onProjectUpdate }: IdeWorkspaceProps) {
  // ---------- state ----------
  const [files, setFiles] = useState<IdeFile[]>(project.files || []);
  const [activeFileId, setActiveFileId] = useState<string>(project.files?.[0]?.id || '');
  const [openFileIds, setOpenFileIds] = useState<string[]>(project.files?.[0] ? [project.files[0].id] : []);
  const [dirtyFileIds, setDirtyFileIds] = useState<Set<string>>(new Set());

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [sidebarView, setSidebarView] = useState<'explorer' | 'search' | 'git'>('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [lineCol, setLineCol] = useState({ line: 1, col: 1 });
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [terminalExpanded, setTerminalExpanded] = useState(true);

  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const [globalSearchVisible, setGlobalSearchVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: 'editor' | 'file' | 'terminal';
    fileId?: string;
  } | null>(null);

  const [exportStatus, setExportStatus] = useState<'idle' | 'running' | 'verifying'>('idle');
  const [exportQueue, setExportQueue] = useState<string[]>([]);

  // ---------- refs ----------
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const termInstance = useRef<XTerm | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const newFileInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const editorRef = useRef<any>(null); // monaco editor instance
  const currentOutputBuffer = useRef<string>('');
  const currentInputBuffer = useRef<string>('');
  const saveFileRef = useRef<(fileId?: string) => Promise<void>>(() => Promise.resolve());

  // ---------- monaco theme ----------
  useEffect(() => {
    // attempt to set theme via global monaco if available
    // using the package's default theme is fine; this keeps parity with your existing UI
    // no-op if monaco isn't ready
    (window as any).monaco?.editor?.setTheme?.('vs-dark');
  }, []);

  // ---------- saveFile ----------
  const saveFile = useCallback(async (fileIdToSave?: string) => {
    const targetId = fileIdToSave || activeFileId;
    if (!targetId) return;

    const fileToSave = files.find(f => f.id === targetId);
    if (!fileToSave) return;

    try {
      const isNew = !project.files?.some(f => f.id === targetId);

      if (isNew) {
        // persist the entire files array for new projects/file lists
        await api.updateProject({ ...project, files });
      } else {
        await api.updateFile(targetId, {
          name: fileToSave.name,
          content: fileToSave.content,
          isExecuted: fileToSave.isExecuted,
          lastInput: fileToSave.lastInput,
          lastOutput: fileToSave.lastOutput,
          lastError: fileToSave.lastError,
        });
      }

      onProjectUpdate({ ...project, files });

      setDirtyFileIds(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    } catch (err) {
      console.error('Failed to save', err);
      // preserve existing UX: small alert (you can replace with a toast)
      alert('Failed to save changes!');
    }
  }, [activeFileId, files, project, onProjectUpdate]);

  // keep ref to latest saveFile for keyboard listener
  useEffect(() => {
    saveFileRef.current = saveFile;
  }, [saveFile]);

  // ---------- export runner loop ----------
  useEffect(() => {
    if (exportStatus !== 'running' || isRunning) return;

    if (exportQueue.length === 0) {
      // finished
      onProjectUpdate({ ...project, files });
      setExportStatus('idle');
      onExport();
      return;
    }

    const nextId = exportQueue[0];

    if (activeFileId !== nextId) {
      setActiveFileId(nextId);
      // small delay lets editor mount/layout; next effect will trigger run
      const t = setTimeout(() => {
        if (!isRunning) handleRun(true);
      }, 80);
      return () => clearTimeout(t);
    } else {
      // run immediately if editor is already active
      if (!isRunning) {
        handleRun(true);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exportStatus, isRunning, exportQueue, activeFileId, files]);

  // ---------- terminal initialization ----------
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#cccccc',
      },
      fontFamily: "Consolas, 'Courier New', monospace",
      fontSize: 13,
      rows: 20,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);

    // delay fit a little to stabilize layout
    setTimeout(() => {
      try { 
        if (term.element?.offsetParent) {
            fit.fit(); 
        }
      } catch { /* ignore */ }
    }, 120);

    // initial prompt
    term.writeln('\x1b[32m➜\x1b[0m \x1b[34m~/project\x1b[0m $ ');

    const onData = (data: string) => {
      currentInputBuffer.current += data;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    };
    term.onData(onData);

    // Resize observer to re-fit terminal when container changes
    const ro = new ResizeObserver(() => {
      if (fit && terminalRef.current?.offsetParent && term.element?.offsetParent) {
        try { fit.fit(); } catch { /* ignore */ }
      }
    });
    ro.observe(terminalRef.current);

    termInstance.current = term;
    fitAddon.current = fit;

    return () => {
      ro.disconnect();
      try { term.dispose(); } catch { /* ignore */ }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* ignore */ }
        wsRef.current = null;
      }
      termInstance.current = null;
      fitAddon.current = null;
    };
  }, []);

  // ---------- fit terminal / layout on toggle ----------
  useEffect(() => {
    // layout editor + fit terminal after next paint
    requestAnimationFrame(() => {
      try { editorRef.current?.layout?.(); } catch { /* ignore */ }
      try { if (terminalExpanded) fitAddon.current?.fit(); } catch { /* ignore */ }
    });
  }, [terminalExpanded]);

  // ---------- focus handlers ----------
  useEffect(() => {
    if (isCreatingFile && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [isCreatingFile]);

  useEffect(() => {
    if (sidebarView === 'search' && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [sidebarView]);

  // ---------- keyboard shortcuts ----------
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setQuickOpenVisible(v => !v);
        setGlobalSearchVisible(false);
      }

      if (ctrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setGlobalSearchVisible(v => !v);
        setQuickOpenVisible(false);
      }

      if (ctrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveFileRef.current();
      }

      // Toggle terminal with Ctrl+` (backtick)
      if (ctrl && e.key === '`') {
        e.preventDefault();
        setTerminalExpanded(prev => !prev);
      }

      if (e.key === 'Escape') {
        setQuickOpenVisible(false);
        setGlobalSearchVisible(false);
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // ---------- file operations ----------
  const handleCreateFile = useCallback(() => {
    const name = newFileName.trim();
    if (!name) {
      setIsCreatingFile(false);
      return;
    }

    const newFile: IdeFile = {
      id: crypto.randomUUID(),
      name,
      content: '',
      isExecuted: false,
    };

    setFiles(prev => {
      const out = [...prev, newFile];
      // persist local copy to parent immediately
      onProjectUpdate({ ...project, files: out });
      return out;
    });

    setIsCreatingFile(false);
    setNewFileName('');
    setOpenFileIds(prev => [...prev, newFile.id]);
    setActiveFileId(newFile.id);
  }, [newFileName, onProjectUpdate, project]);

  const handleOpenFile = useCallback((id: string) => {
    setOpenFileIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setActiveFileId(id);
  }, []);

  const handleCloseFile = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (dirtyFileIds.has(id)) {
      // keep UX identical
      if (confirm('You have unsaved changes. Save before closing?')) {
        await saveFile(id);
      } else {
        return;
      }
    }

    setOpenFileIds(prev => prev.filter(fid => fid !== id));

    setActiveFileId(prevActive => {
      if (prevActive !== id) return prevActive;
      // pick last open file or empty
      const remaining = openFileIds.filter(fid => fid !== id);
      return remaining.length ? remaining[remaining.length - 1] : '';
    });
  }, [dirtyFileIds, openFileIds, saveFile]);

  const handleDeleteFile = useCallback((id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm('Delete this file?')) return;
    setFiles(prev => {
      const remaining = prev.filter(f => f.id !== id);
      onProjectUpdate({ ...project, files: remaining });
      return remaining;
    });
    // close (if open)
    setOpenFileIds(prev => prev.filter(fid => fid !== id));
    setActiveFileId(prev => (prev === id ? '' : prev));
  }, [onProjectUpdate, project]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    setFiles(prev => prev.map(f => (f.id === activeFileId ? { ...f, content: value } : f)));
    setDirtyFileIds(prev => {
      const s = new Set(prev);
      s.add(activeFileId);
      return s;
    });
  }, [activeFileId]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    try {
      editor.onDidChangeCursorPosition((e: any) => {
        setLineCol({ line: e.position.lineNumber, col: e.position.column });
      });
    } catch {
      // ignore if editor API changes
    }
  };

  // ---------- run / websocket ----------
  const handleRun = useCallback(async (isExportRun = false) => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile) return;
    if (isRunning) return;

    setIsRunning(true);
    currentOutputBuffer.current = '';
    currentInputBuffer.current = '';

    // close any existing ws
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }

    // print command in terminal
    if (termInstance.current) {
      const ext = activeFile.name.split('.').pop()?.toLowerCase();
      let cmd = `./${activeFile.name}`;
      if (ext === 'py') cmd = `python ${activeFile.name}`;
      else if (ext === 'js') cmd = `node ${activeFile.name}`;
      else if (ext === 'ts') cmd = `ts-node ${activeFile.name}`;
      else if (ext === 'c') cmd = `gcc ${activeFile.name} -o main && ./main`;
      else if (ext === 'cpp') cmd = `g++ ${activeFile.name} -o main && ./main`;

      termInstance.current.writeln(`\x1b[32m➜\x1b[0m \x1b[34m~/project\x1b[0m $ ${cmd}`);
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'ws://43.204.144.134:8080';
    const ws = new WebSocket(backendUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'init',
        code: activeFile.content,
        filename: activeFile.name,
      }));

      // send terminal size if available
      try {
        const cols = (termInstance.current as any)?.cols;
        const rows = (termInstance.current as any)?.rows;
        if (cols && rows) ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      } catch {}
    };

    ws.onmessage = (event) => {
      // defensive parse
      let msg: any;
      try { msg = JSON.parse(event.data); } catch { msg = { type: 'output', data: String(event.data) }; }

      if (msg.type === 'output') {
        currentOutputBuffer.current += msg.data;
        termInstance.current?.write(msg.data);
      } else if (msg.type === 'exit') {
        termInstance.current?.writeln(`\nProcess exited with code ${msg.code}`);
        setFiles(prev => prev.map(f => f.id === activeFileId ? {
          ...f,
          isExecuted: true,
          lastOutput: currentOutputBuffer.current,
          lastInput: currentInputBuffer.current,
        } : f));
        setIsRunning(false);
        try { ws.close(); } catch {}
        if (isExportRun) setExportStatus('verifying');
      } else if (msg.type === 'error') {
        termInstance.current?.writeln(`\nError: ${msg.data}`);
        setIsRunning(false);
        if (isExportRun) setExportStatus('verifying');
      } else {
        // fallback: write raw
        termInstance.current?.write(String(msg.data ?? ''));
      }
    };

    ws.onclose = () => {
      setIsRunning(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      termInstance.current?.writeln('\nFailed to connect to runner service.');
      setIsRunning(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId, files, isRunning]);

  const handleStartExport = useCallback(() => {
    if (files.length === 0) return;
    // preserve current UX
    if (confirm(`Run ${files.length} files to generate report? This allows you to verify output for each.`)) {
      setExportQueue(files.map(f => f.id));
      setExportStatus('running');
      setTerminalExpanded(true);
    }
  }, [files]);

  const handleVerifyContinue = useCallback(() => {
    setExportQueue(prev => prev.slice(1));
    setExportStatus('running');
  }, []);

  const handleVerifyRetry = useCallback(() => {
    // just re-run the same file in queue
    setExportStatus('running');
  }, []);

  // ---------- context menu ----------
  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'editor' | 'file' | 'terminal', fileId?: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, fileId });
  }, []);

  // ---------- helpers ----------
  const getLanguage = useCallback((filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      py: 'python',
      js: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      jsx: 'javascript',
      cpp: 'cpp',
      c: 'c',
      java: 'java',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
    };
    return langMap[ext || ''] || 'plaintext';
  }, []);

  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return files;
    return files.filter(f => f.name.toLowerCase().includes(q) || (f.content || '').toLowerCase().includes(q));
  }, [files, searchQuery]);

  // ---------- render ----------
  return (
    <div
      className="h-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Title Bar */}
      <header className="h-[30px] flex items-center justify-between px-3 bg-[#3c3c3c] text-[#cccccc] text-[13px] select-none">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="hover:bg-[#505050] p-1 rounded-sm transition-all"
              title="Exit"
            >
              <LogOut size={14} />
            </button>
          </div>
          <span className="opacity-80">File</span>
          <span className="opacity-80">Edit</span>
          <span className="opacity-80">Selection</span>
          <span className="opacity-80">View</span>
          <span className="opacity-80">Go</span>
          <span className="opacity-80">Run</span>
        </div>

        <div className="flex-1 text-center font-medium opacity-90 text-[12px] text-[#cccccc]">
          {project.name} - Visual Studio Code
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRun(false)}
            disabled={isRunning || exportStatus !== 'idle'}
            className="p-1 hover:bg-[#505050] rounded-sm text-[#007fd4] hover:shadow-[0_0_8px_rgba(0,127,212,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run"
          >
            <Play size={14} fill="currentColor" />
          </button>
          <button
            onClick={handleStartExport}
            disabled={exportStatus !== 'idle'}
            className="p-1 hover:bg-[#505050] rounded-sm hover:shadow-[0_0_8px_rgba(100,181,246,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export"
          >
            <Eye size={14} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Activity Bar */}
        <nav className="w-[48px] bg-[#333333] flex flex-col items-center py-2 gap-0 border-r border-[#252526]">
          {[
            { id: 'explorer', icon: Files, label: 'Explorer' },
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'git', icon: GitBranch, label: 'Source Control' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setSidebarView(item.id as any)}
              className={`w-[48px] h-[48px] flex items-center justify-center relative transition-colors
                ${sidebarView === item.id ? 'text-white' : 'text-[#858585] hover:text-white'}`}
              title={item.label}
            >
              <item.icon size={24} strokeWidth={1.5} />
              {sidebarView === item.id && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#007fd4] shadow-[0_0_6px_rgba(0,127,212,0.6)]" />
              )}
            </button>
          ))}

          <div className="flex-1" />

          <button className="w-[48px] h-[48px] flex items-center justify-center text-[#858585] hover:text-white transition-colors" title="Settings">
            <Settings size={24} strokeWidth={1.5} />
          </button>
        </nav>

        {/* Sidebar */}
        <aside className="w-[260px] bg-[#252526] flex flex-col border-r border-[#454545]">
          {sidebarView === 'explorer' && (
            <>
              <div className="h-[35px] flex items-center justify-between px-4 text-[11px] font-bold text-[#bbbbbb] uppercase tracking-wider">
                <span>Explorer</span>
                <button
                  onClick={() => setIsCreatingFile(true)}
                  className="hover:bg-[#37373d] p-0.5 rounded transition-colors"
                  title="New File"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto ide-scroll">
                <button
                  onClick={() => setExplorerExpanded(!explorerExpanded)}
                  className="w-full px-1 py-1 flex items-center gap-0.5 text-[13px] font-bold text-[#cccccc] hover:bg-[#2a2d2e] transition-colors"
                >
                  {explorerExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="uppercase font-bold text-[11px] tracking-wide ml-1">{project.name}</span>
                </button>

                {explorerExpanded && (
                  <div className="pl-0">
                    {isCreatingFile && (
                      <div className="ml-5 flex items-center gap-1.5 bg-[#37373d] border border-[#007fd4] shadow-[0_0_8px_rgba(0,127,212,0.4)] px-1 py-0.5 my-1 animate-in fade-in duration-150">
                        <FileIcon filename={newFileName || 'file.txt'} size={14} className="opacity-80" />
                        <input
                          ref={newFileInputRef}
                          value={newFileName}
                          onChange={e => setNewFileName(e.target.value)}
                          onBlur={() => !newFileName && setIsCreatingFile(false)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleCreateFile();
                            if (e.key === 'Escape') setIsCreatingFile(false);
                          }}
                          className="flex-1 bg-transparent text-white text-[13px] outline-none placeholder:text-[#858585]"
                          placeholder="filename.py"
                        />
                      </div>
                    )}

                    {files.map(file => (
                      <div
                        key={file.id}
                        onClick={() => handleOpenFile(file.id)}
                        onContextMenu={e => handleContextMenu(e, 'file', file.id)}
                        className={`group pl-6 pr-2 py-[3px] flex items-center gap-1.5 text-[13px] cursor-pointer border-l-[3px] border-transparent transition-colors
                          ${activeFileId === file.id ? 'bg-[#37373d] text-white' : 'text-[#cccccc] hover:bg-[#2a2d2e]'}`}
                      >
                        <FileIcon filename={file.name} size={16} />
                        <span className="flex-1 truncate">{file.name}</span>
                        {files.length > 1 && (
                          <Trash2
                            size={14}
                            className="opacity-0 group-hover:opacity-100 text-[#858585] hover:text-[#cccccc] transition-opacity"
                            onClick={e => handleDeleteFile(file.id, e)}
                          />
                        )}
                        {file.isExecuted && <Check size={12} className="text-green-500" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {sidebarView === 'search' && (
            <>
              <div className="h-[35px] flex items-center px-4 text-[11px] font-bold text-[#bbbbbb] uppercase tracking-wider">
                <span>Search</span>
              </div>
              <div className="px-4 pb-2">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="w-full bg-[#3c3c3c] border border-transparent focus:border-[#007fd4] focus:shadow-[0_0_8px_rgba(0,127,212,0.3)] text-white text-[13px] px-2 py-1 outline-none placeholder:text-[#858585] transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto ide-scroll">
                {filteredFiles.map(file => (
                  <div
                    key={file.id}
                    onClick={() => {
                      handleOpenFile(file.id);
                      setSidebarView('explorer');
                    }}
                    className="px-4 py-1 hover:bg-[#2a2d2e] cursor-pointer text-[13px] flex items-center gap-2 transition-colors"
                  >
                    <FileIcon filename={file.name} size={16} />
                    <span className="text-[#cccccc]">{file.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {sidebarView === 'git' && (
            <>
              <div className="h-[35px] flex items-center px-4 text-[11px] font-bold text-[#bbbbbb] uppercase tracking-wider">
                <span>Source Control</span>
              </div>
              <div className="px-4 mt-2">
                <div className="text-[13px] text-[#cccccc] flex items-center gap-2">
                  <GitBranch size={14} />
                  <span>main</span>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {/* Tabs Container */}
          <div className="h-[35px] bg-[#252526] flex items-center overflow-x-auto ide-scroll">
            {openFileIds.map(fid => {
              const file = files.find(f => f.id === fid);
              if (!file) return null;
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`group h-full px-3 flex items-center gap-2 text-[13px] border-r border-[#252526] cursor-pointer min-w-[120px] max-w-[200px] select-none transition-all duration-150
                    ${activeFileId === file.id
                      ? 'bg-[#1e1e1e] text-white border-t-[2px] border-t-[#007fd4] shadow-[0_-2px_8px_rgba(0,127,212,0.3)] pt-0'
                      : 'bg-[#2d2d2d] text-[#969696] hover:bg-[#2a2d2e] pt-[2px]'}`}
                >
                  <FileIcon filename={file.name} size={16} className={activeFileId !== file.id ? 'grayscale opacity-80' : ''} />
                  <span className={`truncate flex-1 ${activeFileId === file.id ? 'text-white' : 'text-[#969696] italic'}`}>
                    {file.name}
                  </span>
                  {dirtyFileIds.has(file.id) ? (
                    <div
                      onClick={e => handleCloseFile(file.id, e)}
                      className="opacity-100 hover:bg-[#454545] rounded p-1 cursor-pointer transition-colors"
                    >
                      <Circle size={10} fill="currentColor" className="text-white" />
                    </div>
                  ) : (
                    <X
                      size={14}
                      className={`opacity-0 group-hover:opacity-100 hover:bg-[#454545] rounded p-0.5 transition-opacity ${activeFileId === file.id ? 'text-white' : 'text-[#cccccc]'}`}
                      onClick={e => handleCloseFile(file.id, e)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Breadcrumbs */}
          {activeFile && (
            <div className="h-[22px] flex items-center px-4 bg-[#1e1e1e] text-[13px] text-[#858585] gap-1">
              <span>{project.name}</span>
              <ChevronRight size={14} />
              <span className="text-[#cccccc]">{activeFile.name}</span>
              {exportStatus !== 'idle' && (
                <span className="ml-4 text-yellow-500 flex items-center gap-1 text-[11px] animate-pulse">
                  <RefreshCw size={10} className="animate-spin" />
                  Export Validation Mode
                </span>
              )}
            </div>
          )}

          {/* Editor */}
          <div
            className="flex-1 relative bg-[#1e1e1e] overflow-hidden"
            onContextMenu={e => handleContextMenu(e, 'editor')}
          >
            {activeFile ? (
              <Editor
                height="100%"
                language={getLanguage(activeFile.name)}
                theme="vs-dark"
                value={activeFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  minimap: { enabled: true, scale: 0.75, showSlider: 'mouseover' },
                  fontSize: 14,
                  fontFamily: "Consolas, 'Courier New', monospace",
                  fontLigatures: true,
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 10, bottom: 10 },
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                  },
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#858585] gap-4 bg-[#1e1e1e]">
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="w-24 h-24 bg-[url('https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg')] bg-contain bg-no-repeat opacity-10 grayscale invert" />
                </div>
                <div className="flex flex-col gap-3 text-[13px] min-w-[300px]">
                  <div className="flex justify-between">
                    <span>Show All Commands</span>
                    <span className="text-[#cccccc]">Ctrl+Shift+P</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Go to File</span>
                    <span className="text-[#cccccc]">Ctrl+P</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Find in Files</span>
                    <span className="text-[#cccccc]">Ctrl+Shift+F</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Toggle Terminal</span>
                    <span className="text-[#cccccc]">Ctrl+`</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          <div className={`bg-[#1e1e1e] border-t border-[#454545] flex flex-col ${terminalExpanded ? 'h-[200px]' : 'h-[35px]'}`}>
            <div className="h-[35px] flex items-center justify-between px-4 select-none flex-shrink-0 bg-[#1e1e1e]">
              <div className="flex items-center gap-6 h-full">
                <button
                  onClick={() => setTerminalExpanded(!terminalExpanded)}
                  className="text-[11px] font-bold uppercase text-white border-b-2 border-[#007fd4] shadow-[0_2px_6px_rgba(0,127,212,0.4)] h-full pt-2 transition-all"
                >
                  Terminal
                </button>
                <button className="text-[11px] font-bold uppercase text-[#858585] hover:text-[#cccccc] pt-2 transition-colors">Problems</button>
                <button className="text-[11px] font-bold uppercase text-[#858585] hover:text-[#cccccc] pt-2 transition-colors">Output</button>
                <button className="text-[11px] font-bold uppercase text-[#858585] hover:text-[#cccccc] pt-2 transition-colors">Debug Console</button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTerminalExpanded(!terminalExpanded)}
                  className="hover:bg-[#333333] rounded p-1 transition-colors"
                >
                  <PanelBottomClose size={14} className="text-[#cccccc]" />
                </button>
                <button className="hover:bg-[#333333] rounded p-1 transition-colors">
                  <Plus size={14} className="text-[#cccccc]" />
                </button>
              </div>
            </div>

            {exportStatus === 'verifying' && (
              <div className="bg-[#252526] border-b border-[#454545] px-4 py-1 flex items-center justify-between animate-in fade-in duration-200">
                <div className="text-[13px] flex items-center gap-2">
                  <Check size={14} className="text-green-500" />
                  <span>Execution finished for <strong>{activeFile?.name}</strong>. Output captured.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVerifyRetry}
                    className="text-[12px] bg-[#3c3c3c] hover:bg-[#4c4c4c] text-white px-3 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                  <button
                    onClick={handleVerifyContinue}
                    className="text-[12px] bg-[#007fd4] hover:bg-[#0060a0] text-white px-3 py-0.5 rounded flex items-center gap-1 transition-colors"
                  >
                    Continue <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            <div className={`flex-1 w-full h-full overflow-hidden relative pl-2 ${terminalExpanded ? '' : 'hidden'}`}>
              <div ref={terminalRef} className="h-full w-full" />
            </div>
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <footer className="h-[22px] bg-[#007fd4] flex items-center justify-between px-3 text-[12px] text-white select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
            <GitBranch size={12} />
            <span>main</span>
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
            <X size={12} /> 0
            <AlertCircle size={12} className="ml-1" /> 0
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
            Ln {lineCol.line}, Col {lineCol.col}
          </span>
          <span className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
            UTF-8
          </span>
          {activeFile && (
            <span className="cursor-pointer hover:bg-white/20 px-1 py-0.5 rounded transition-colors">
              {getLanguage(activeFile.name)}
            </span>
          )}
        </div>
      </footer>

      {quickOpenVisible && (
        <QuickOpen
          files={files}
          onSelect={(id) => {
            setActiveFileId(id);
            setQuickOpenVisible(false);
          }}
          onClose={() => setQuickOpenVisible(false)}
        />
      )}

      {globalSearchVisible && (
        <GlobalSearch
          files={files}
          onSelect={(id) => {
            setActiveFileId(id);
            setGlobalSearchVisible(false);
          }}
          onClose={() => setGlobalSearchVisible(false)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={
            contextMenu.type === 'editor'
              ? getEditorContextMenuItems({
                  onCopy: () => document.execCommand?.('copy'),
                  onCut: () => document.execCommand?.('cut'),
                  onPaste: () => document.execCommand?.('paste'),
                  onSelectAll: () => document.execCommand?.('selectAll'),
                })
              : contextMenu.type === 'file'
              ? getFileContextMenuItems({
                  onOpen: () => contextMenu.fileId && setActiveFileId(contextMenu.fileId),
                  onDelete: () => contextMenu.fileId && handleDeleteFile(contextMenu.fileId),
                  onCopyPath: () => {
                    const file = files.find(f => f.id === contextMenu.fileId);
                    if (file) navigator.clipboard.writeText(file.name).catch(() => {});
                  },
                })
              : getTerminalContextMenuItems({
                  onCopy: () => {
                    if (termInstance.current) {
                      try {
                        const sel = (termInstance.current as any).getSelection();
                        if (sel) navigator.clipboard.writeText(sel).catch(() => {});
                      } catch {}
                    }
                  },
                  onPaste: async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (termInstance.current && wsRef.current) {
                        wsRef.current.send(JSON.stringify({ type: 'input', data: text }));
                      }
                    } catch {}
                  },
                  onClear: () => termInstance.current?.clear(),
                })
          }
        />
      )}
    </div>
  );
};

