"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Editor from "@monaco-editor/react";
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
  Command,
  Sparkles,
  Folder,
  FolderOpen,
  Terminal as TerminalIcon,
  Send,
  CornerDownLeft,
  Maximize2,
} from "lucide-react";

// Types
interface IdeFile {
  id: string;
  name: string;
  content: string;
  isExecuted: boolean;
  lastInput?: string;
  lastOutput?: string;
  lastError?: string;
}

interface Project {
  id: string;
  name: string;
  files?: IdeFile[];
}

interface IdeWorkspaceProps {
  project: Project;
  onBack: () => void;
  onExport: () => void;
  onProjectUpdate: (p: Project) => void;
  api: {
    updateProject: (p: Project) => Promise<void>;
    updateFile: (id: string, data: Partial<IdeFile>) => Promise<void>;
  };
}
//@ts-ignore
const FileIcon = ({
  //@ts-ignore

  filename,
  size = 16,
  className = "",
  isActive = false,
}) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  const config = {
    py: { color: "text-yellow-400", bg: "bg-yellow-400/20" },
    js: { color: "text-yellow-300", bg: "bg-yellow-300/20" },
    ts: { color: "text-blue-400", bg: "bg-blue-400/20" },
    tsx: { color: "text-blue-400", bg: "bg-blue-400/20" },
    jsx: { color: "text-cyan-400", bg: "bg-cyan-400/20" },
    cpp: { color: "text-pink-400", bg: "bg-pink-400/20" },
    c: { color: "text-blue-300", bg: "bg-blue-300/20" },
    java: { color: "text-orange-400", bg: "bg-orange-400/20" },
    html: { color: "text-orange-500", bg: "bg-orange-500/20" },
    css: { color: "text-blue-400", bg: "bg-blue-400/20" },
    json: { color: "text-yellow-300", bg: "bg-yellow-300/20" },
    md: { color: "text-zinc-400", bg: "bg-zinc-400/20" },
  };
  //@ts-ignore

  const { color, bg } = config[ext || ""] || {
    color: "text-zinc-500",
    bg: "bg-zinc-500/20",
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {isActive && <div className={`absolute inset-0 ${bg} rounded blur-sm`} />}
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`relative ${color}`}
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    </div>
  );
};
//@ts-ignore

const ExtLabel = ({ filename }) => {
  const ext = filename.split(".").pop()?.toLowerCase();

  const labels = {
    py: { text: "PY", color: "text-yellow-400 bg-yellow-400/10" },
    js: { text: "JS", color: "text-yellow-300 bg-yellow-300/10" },
    ts: { text: "TS", color: "text-blue-400 bg-blue-400/10" },
    tsx: { text: "TSX", color: "text-blue-400 bg-blue-400/10" },
    cpp: { text: "C++", color: "text-pink-400 bg-pink-400/10" },
    c: { text: "C", color: "text-blue-300 bg-blue-300/10" },
    java: { text: "JAVA", color: "text-orange-400 bg-orange-400/10" },
  };
  //@ts-ignore

  const config = labels[ext || ""];
  if (!config) return null;

  return (
    <span
      className={`text-[9px] font-bold px-1 py-0.5 rounded ${config.color}`}
    >
      {config.text}
    </span>
  );
};
//@ts-ignore
//@ts-ignore

export function IdeWorkspace({
  //@ts-ignore

  project,
  //@ts-ignore

  onBack,
  //@ts-ignore

  onExport,
  //@ts-ignore

  onProjectUpdate,
  //@ts-ignore

  api,
}) {
  // State
  const [files, setFiles] = useState(project.files || []);
  const [activeFileId, setActiveFileId] = useState(
    project.files?.[0]?.id || ""
  );
  const [openFileIds, setOpenFileIds] = useState(
    project.files?.[0] ? [project.files[0].id] : []
  );
  const [dirtyFileIds, setDirtyFileIds] = useState(new Set());
  const [newFileIds, setNewFileIds] = useState(new Set());
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [sidebarView, setSidebarView] = useState("explorer");
  const [searchQuery, setSearchQuery] = useState("");
  const [lineCol, setLineCol] = useState({ line: 1, col: 1 });
  const [explorerExpanded, setExplorerExpanded] = useState(true);
  const [terminalExpanded, setTerminalExpanded] = useState(true);
  const [exportStatus, setExportStatus] = useState("idle");
  const [exportQueue, setExportQueue] = useState([]);
  const [terminalOutput, setTerminalOutput] = useState([
    "\x1b[38;5;39m➜\x1b[0m \x1b[38;5;75m~/project\x1b[0m $ ",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [awaitingInput, setAwaitingInput] = useState(false);
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Refs
  const newFileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const editorRef = useRef(null);
  const currentOutputBuffer = useRef("");
  const currentInputBuffer = useRef("");
  const wsRef = useRef(null);
  const terminalRef = useRef(null);
  const saveFileRef = useRef(() => Promise.resolve());
  const terminalInputRef = useRef(null);

  // Save file
  const saveFile = useCallback(
    //@ts-ignore

    async (fileIdToSave) => {
      const targetId = fileIdToSave || activeFileId;
      if (!targetId) return;
      //@ts-ignore

      const fileToSave = files.find((f) => f.id === targetId);
      if (!fileToSave) return;

      try {
        const isNew = newFileIds.has(targetId);

        if (isNew) {
          await api.updateProject({ ...project, files });
          setNewFileIds((prev) => {
            const next = new Set(prev);
            next.delete(targetId);
            return next;
          });
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
        setDirtyFileIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } catch (err) {
        console.error("Failed to save", err);
        alert("Failed to save changes!");
      }
    },
    [activeFileId, files, project, onProjectUpdate, newFileIds, api]
  );

  //@ts-ignore
  useEffect(() => {
    //@ts-ignore

    saveFileRef.current = saveFile;
  }, [saveFile]);

  // Export runner
  useEffect(() => {
    if (exportStatus !== "running" || isRunning) return;

    if (exportQueue.length === 0) {
      onProjectUpdate({ ...project, files });
      setExportStatus("idle");
      onExport();
      return;
    }

    const nextId = exportQueue[0];

    if (activeFileId !== nextId) {
      setActiveFileId(nextId);
      const t = setTimeout(() => {
        if (!isRunning) handleRun(true);
      }, 80);
      return () => clearTimeout(t);
    } else {
      if (!isRunning) {
        handleRun(true);
      }
    }
  }, [exportStatus, isRunning, exportQueue, activeFileId, files]);

  // Focus handlers
  useEffect(() => {
    if (isCreatingFile && newFileInputRef.current) {
      //@ts-ignore

      newFileInputRef.current.focus();
    }
  }, [isCreatingFile]);

  useEffect(() => {
    if (sidebarView === "search" && searchInputRef.current) {
      //@ts-ignore

      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [sidebarView]);

  // Keyboard shortcuts
  useEffect(() => {
    //@ts-ignore

    const onKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && !e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
      }

      if (ctrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveFileRef.current();
      }

      if (ctrl && e.key === "`") {
        e.preventDefault();
        setTerminalExpanded((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // File operations
  const handleCreateFile = useCallback(() => {
    const name = newFileName.trim();
    if (!name) {
      setIsCreatingFile(false);
      return;
    }

    const newFile = {
      id: crypto.randomUUID(),
      name,
      content: "",
      isExecuted: false,
    };
    //@ts-ignore

    setFiles((prev) => {
      const out = [...prev, newFile];
      onProjectUpdate({ ...project, files: out });
      return out;
    });

    setNewFileIds((prev) => {
      const next = new Set(prev);
      next.add(newFile.id);
      return next;
    });

    setIsCreatingFile(false);
    setNewFileName("");
    setOpenFileIds((prev) => [...prev, newFile.id]);
    setActiveFileId(newFile.id);
  }, [newFileName, onProjectUpdate, project]);
  //@ts-ignore

  const handleOpenFile = useCallback((id) => {
    setOpenFileIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveFileId(id);
  }, []);
  //@ts-ignore

  const handleCloseFile = useCallback(
    //@ts-ignore

    async (id, e) => {
      e?.stopPropagation();
      if (dirtyFileIds.has(id)) {
        if (confirm("You have unsaved changes. Save before closing?")) {
          await saveFile(id);
        } else {
          return;
        }
      }

      setOpenFileIds((prev) => prev.filter((fid) => fid !== id));
      //@ts-ignore

      setActiveFileId((prevActive) => {
        if (prevActive !== id) return prevActive;
        const remaining = openFileIds.filter((fid) => fid !== id);
        return remaining.length ? remaining[remaining.length - 1] : "";
      });
    },
    [dirtyFileIds, openFileIds, saveFile]
  );

  //@ts-ignore
  const handleDeleteFile = useCallback(
    //@ts-ignore

    (id, e) => {
      e?.stopPropagation();
      if (!confirm("Delete this file?")) return;
      //@ts-ignore

      setFiles((prev) => {
        //@ts-ignore

        const remaining = prev.filter((f) => f.id !== id);
        onProjectUpdate({ ...project, files: remaining });
        return remaining;
      });
      setOpenFileIds((prev) => prev.filter((fid) => fid !== id));
      //@ts-ignore

      setActiveFileId((prev) => (prev === id ? "" : prev));
    },
    [onProjectUpdate, project]
  );

  const handleEditorChange = useCallback(
    //@ts-ignore

    (value) => {
      if (value === undefined) return;
      //@ts-ignore

      setFiles((prev) =>
        //@ts-ignore

        prev.map((f) => (f.id === activeFileId ? { ...f, content: value } : f))
      );
      setDirtyFileIds((prev) => {
        const s = new Set(prev);
        s.add(activeFileId);
        return s;
      });
    },
    [activeFileId]
  );
  //@ts-ignore

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
    try {
      //@ts-ignore

      editor.onDidChangeCursorPosition((e) => {
        setLineCol({ line: e.position.lineNumber, col: e.position.column });
      });
    } catch {}
  };

  // Run / WebSocket - now with stdin support
  const handleRun = useCallback(
    async (isExportRun = false) => {
      //@ts-ignore

      const activeFile = files.find((f) => f.id === activeFileId);
      if (!activeFile) return;
      if (isRunning) return;

      setIsRunning(true);
      setAwaitingInput(false);
      currentOutputBuffer.current = "";
      currentInputBuffer.current = "";

      // close previous ws
      if (wsRef.current) {
        try {
          //@ts-ignore

          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }

      const ext = activeFile.name.split(".").pop()?.toLowerCase();
      let cmd = `./${activeFile.name}`;
      if (ext === "py") cmd = `python ${activeFile.name}`;
      else if (ext === "js") cmd = `node ${activeFile.name}`;
      else if (ext === "ts") cmd = `ts-node ${activeFile.name}`;
      else if (ext === "c") cmd = `gcc ${activeFile.name} -o main && ./main`;
      else if (ext === "cpp") cmd = `g++ ${activeFile.name} -o main && ./main`;

      setTerminalOutput((prev) => [
        ...prev,
        `\x1b[38;5;39m➜\x1b[0m \x1b[38;5;75m~/project\x1b[0m $ ${cmd}`,
      ]);

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "ws://ec2-13-203-158-119.ap-south-1.compute.amazonaws.com:8080";
      const ws = new WebSocket(backendUrl);
      //@ts-ignore

      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "init",
            code: activeFile.content,
            filename: activeFile.name,
          })
        );
      };

      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          msg = { type: "output", data: String(event.data) };
        }

        // Normal output chunk
        if (msg.type === "output") {
          currentOutputBuffer.current += msg.data;
          setTerminalOutput((prev) => [...prev, msg.data]);
        }
        // Runner requests input from user
        else if (
          msg.type === "input_request" ||
          msg.type === "stdin" ||
          msg.type === "request_input" ||
          msg.type === "prompt"
        ) {
          // Add prompt text if available
          if (msg.prompt) {
            setTerminalOutput((prev) => [...prev, msg.prompt]);
          } else {
            setTerminalOutput((prev) => [...prev, "Input required: "]);
          }
          setAwaitingInput(true);
          // focus input
          //@ts-ignore

          setTimeout(() => terminalInputRef.current?.focus(), 80);
        }
        // process exit
        else if (msg.type === "exit") {
          setTerminalOutput((prev) => [
            ...prev,
            `\nProcess exited with code ${msg.code}`,
          ]);
          //@ts-ignore

          setFiles((prev) =>
            //@ts-ignore

            prev.map((f) =>
              f.id === activeFileId
                ? {
                    ...f,
                    isExecuted: true,
                    lastOutput: currentOutputBuffer.current,
                    lastInput: currentInputBuffer.current,
                  }
                : f
            )
          );
          setIsRunning(false);
          setAwaitingInput(false);
          try {
            ws.close();
          } catch {}
          if (isExportRun) setExportStatus("verifying");
        }
        // error
        else if (msg.type === "error") {
          setTerminalOutput((prev) => [...prev, `\nError: ${msg.data}`]);
          setIsRunning(false);
          setAwaitingInput(false);
          if (isExportRun) setExportStatus("verifying");
        }
        // fallback - unknown typed message, treat as output
        else {
          if (typeof msg === "string") {
            currentOutputBuffer.current += msg;
            setTerminalOutput((prev) => [...prev, msg]);
          } else if (msg.data) {
            currentOutputBuffer.current += msg.data;
            setTerminalOutput((prev) => [...prev, msg.data]);
          }
        }
      };

      ws.onclose = () => {
        setIsRunning(false);
        setAwaitingInput(false);
      };

      ws.onerror = () => {
        setTerminalOutput((prev) => [
          ...prev,
          "\nFailed to connect to runner service.",
        ]);
        setIsRunning(false);
        setAwaitingInput(false);
      };
    },
    [activeFileId, files, isRunning]
  );

  //@ts-ignore
  const sendTerminalInput = useCallback(
    //@ts-ignore

    (inputText) => {
      const value = inputText !== undefined ? inputText : terminalInput;
      //@ts-ignore

      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setTerminalOutput((prev) => [
          ...prev,
          `\nCan't send input: runner not connected.`,
        ]);
        setTerminalInput("");
        setAwaitingInput(false);
        return;
      }
      currentInputBuffer.current += value + "\n";
      try {
        //@ts-ignore

        wsRef.current.send(
          JSON.stringify({ type: "input", data: value + "\n" })
        );
      } catch (err) {
        console.error("Failed to send input", err);
        setTerminalOutput((prev) => [
          ...prev,
          `\nFailed to send input: ${String(err)}`,
        ]);
      }
      // Echo the input in terminal
      setTerminalOutput((prev) => [...prev, value + "\n"]);

      // Add to command history
      if (value.trim()) {
        //@ts-ignore

        setCommandHistory((prev) => [...prev, value]);
      }

      setTerminalInput("");
      setAwaitingInput(false);
      setHistoryIndex(-1);
      // focus back
      //@ts-ignore

      setTimeout(() => terminalInputRef.current?.focus(), 20);
    },
    [terminalInput]
  );

  const handleStartExport = useCallback(() => {
    if (files.length === 0) return;
    if (
      confirm(
        `Run ${files.length} files to generate report? This allows you to verify output for each.`
      )
    ) {
      //@ts-ignore

      setExportQueue(files.map((f) => f.id));
      setExportStatus("running");
      setTerminalExpanded(true);
    }
  }, [files]);

  const handleVerifyContinue = useCallback(() => {
    setExportQueue((prev) => prev.slice(1));
    setExportStatus("running");
  }, []);

  const handleVerifyRetry = useCallback(() => {
    setExportStatus("running");
  }, []);

  // Command history navigation
  const handleKeyDown = useCallback(
    //@ts-ignore

    (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (commandHistory.length === 0) return;
        const newIndex =
          historyIndex === -1
            ? commandHistory.length - 1
            : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setTerminalInput(commandHistory[newIndex]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex === -1) return;
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setTerminalInput("");
        } else {
          setHistoryIndex(newIndex);
          setTerminalInput(commandHistory[newIndex]);
        }
      } else if (e.key === "Enter") {
        //@ts-ignore

        if (terminalInput.trim().length > 0) sendTerminalInput();
        else {
          if (awaitingInput) sendTerminalInput("");
        }
      }
    },
    [
      commandHistory,
      historyIndex,
      terminalInput,
      awaitingInput,
      sendTerminalInput,
    ]
  );

  // Helpers
  const getLanguage = useCallback((filename: any) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const langMap = {
      py: "python",
      js: "javascript",
      ts: "typescript",
      tsx: "typescript",
      jsx: "javascript",
      cpp: "cpp",
      c: "c",
      java: "java",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
    };
    //@ts-ignore
    return langMap[ext || ""] || "plaintext";
  }, []);
  //@ts-ignore

  const activeFile = useMemo(
    //@ts-ignore

    () => files.find((f) => f.id === activeFileId),
    [files, activeFileId]
  );

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return files;
    //@ts-ignore

    return files.filter(
      //@ts-ignore

      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.content || "").toLowerCase().includes(q)
    );
  }, [files, searchQuery]);

  // Auto scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      //@ts-ignore

      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  return (
    <div
      className="h-screen flex flex-col bg-[#09090b] text-zinc-300 overflow-hidden"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif',
      }}
    >
      <header className="h-12 flex items-center justify-between px-4 bg-[#0a0a0a] border-b border-white/[0.06] select-none">
        <div className="flex items-center gap-8">
          <button
            onClick={onBack}
            className="hover:bg-white/5 p-2 rounded-lg transition-all text-zinc-500 hover:text-white"
            title="Exit"
          >
            <LogOut size={16} />
          </button>
          <div className="flex items-center gap-6 text-[13px] text-zinc-600">
            <span className="hover:text-zinc-300 cursor-default transition-colors">
              File
            </span>
            <span className="hover:text-zinc-300 cursor-default transition-colors">
              Edit
            </span>
            <span className="hover:text-zinc-300 cursor-default transition-colors">
              View
            </span>
            <span className="hover:text-zinc-300 cursor-default transition-colors">
              Run
            </span>
          </div>
        </div>

        <div className="flex-1 text-center">
          <span className="text-sm text-zinc-300 font-medium tracking-[-0.01em]">
            {project.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRun(false)}
            disabled={isRunning || exportStatus !== "idle"}
            className="group relative flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Run"
          >
            {/* Glow */}
            <div className="absolute inset-0 rounded-lg bg-blue-500/50 blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
            <span className="relative flex items-center gap-2">
              <Play
                size={14}
                fill="currentColor"
                className="group-hover:scale-110 transition-transform"
              />
              Run
            </span>
          </button>
          <button
            onClick={handleStartExport}
            disabled={exportStatus !== "idle"}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export"
          >
            <Eye size={14} />
            Export
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <nav className="w-14 bg-[#0a0a0a] flex flex-col items-center py-3 gap-2 border-r border-white/[0.06]">
          {[
            { id: "explorer", icon: Files, label: "Explorer" },
            { id: "search", icon: Search, label: "Search" },
            { id: "git", icon: GitBranch, label: "Git" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSidebarView(item.id)}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                sidebarView === item.id
                  ? "text-white bg-white/[0.08]"
                  : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.03]"
              }`}
              title={item.label}
            >
              <item.icon size={20} strokeWidth={1.5} />
              {sidebarView === item.id && (
                <>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-blue-500 rounded-r-full" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-8 bg-blue-500/30 blur-md rounded-r-full" />
                </>
              )}
            </button>
          ))}

          <div className="flex-1" />

          <button
            className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:text-zinc-400 rounded-xl hover:bg-white/[0.03] transition-all"
            title="Settings"
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </nav>

        <aside className="w-64 bg-[#0a0a0a]/50 flex flex-col border-r border-white/[0.06]">
          {sidebarView === "explorer" && (
            <>
              <div className="h-12 flex items-center justify-between px-4">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                  Explorer
                </span>
                <button
                  onClick={() => setIsCreatingFile(true)}
                  className="hover:bg-white/5 p-1.5 rounded-lg transition-colors hover:text-white text-zinc-500"
                  title="New File"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-2">
                {/* Project folder header */}
                <button
                  onClick={() => setExplorerExpanded(!explorerExpanded)}
                  className="w-full px-2 py-2 flex items-center gap-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.03] rounded-lg transition-colors"
                >
                  {explorerExpanded ? (
                    <FolderOpen size={16} className="text-blue-400" />
                  ) : (
                    <Folder size={16} className="text-blue-400" />
                  )}
                  <span className="truncate">{project.name}</span>
                  <ChevronDown
                    size={14}
                    className={`text-zinc-600 ml-auto transition-transform ${
                      explorerExpanded ? "" : "-rotate-90"
                    }`}
                  />
                </button>

                {explorerExpanded && (
                  <div className="ml-2 mt-1 space-y-0.5">
                    {/* New file input */}
                    {isCreatingFile && (
                      <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2 mx-1">
                        <FileIcon
                          filename={newFileName || "file.txt"}
                          size={14}
                        />
                        <input
                          ref={newFileInputRef}
                          value={newFileName}
                          onChange={(e) => setNewFileName(e.target.value)}
                          onBlur={() =>
                            !newFileName && setIsCreatingFile(false)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreateFile();
                            if (e.key === "Escape") setIsCreatingFile(false);
                          }}
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-zinc-600"
                          style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}
                          placeholder="filename.py"
                        />
                      </div>
                    )}

                    {/* File list */}

                    {files.map((file: any) => (
                      <div
                        key={file.id}
                        onClick={() => handleOpenFile(file.id)}
                        className={`group relative pl-4 pr-2 py-2 flex items-center gap-3 text-sm cursor-pointer rounded-lg mx-1 transition-all ${
                          activeFileId === file.id
                            ? "bg-white/[0.08] text-white"
                            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                        }`}
                      >
                        {/* Active indicator glow */}
                        {activeFileId === file.id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        )}

                        <FileIcon
                          filename={file.name}
                          size={16}
                          isActive={activeFileId === file.id}
                        />
                        <span
                          className="flex-1 truncate"
                          style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                            fontSize: "13px",
                            letterSpacing: "0.2px",
                          }}
                        >
                          {file.name}
                        </span>

                        {/* Status indicators */}
                        <div className="flex items-center gap-1.5">
                          {file.isExecuted && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <Check size={10} className="text-emerald-400" />
                            </div>
                          )}
                          {files.length > 1 && (
                            <Trash2
                              size={14}
                              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-0.5"
                              onClick={(e) => handleDeleteFile(file.id, e)}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {sidebarView === "search" && (
            <>
              <div className="h-12 flex items-center px-4">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                  Search
                </span>
              </div>
              <div className="px-3 pb-3">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search files..."
                    className="w-full bg-white/[0.03] border border-white/[0.06] focus:border-blue-500/50 text-white text-sm pl-9 pr-3 py-2.5 outline-none rounded-lg placeholder:text-zinc-600 transition-all"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-2">
                {filteredFiles.map((file: any) => (
                  <div
                    key={file.id}
                    onClick={() => {
                      handleOpenFile(file.id);
                      setSidebarView("explorer");
                    }}
                    className="px-3 py-2 hover:bg-white/[0.04] cursor-pointer text-sm flex items-center gap-3 rounded-lg transition-colors mx-1"
                  >
                    <FileIcon filename={file.name} size={16} />
                    <span
                      className="text-zinc-400"
                      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif' }}
                    >
                      {file.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {sidebarView === "git" && (
            <>
              <div className="h-12 flex items-center px-4">
                <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                  Source Control
                </span>
              </div>
              <div className="px-4 mt-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                  <GitBranch size={14} className="text-cyan-400" />
                  <span className="text-sm text-zinc-300">main</span>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Main Editor Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#09090b]">
          <div className="h-10 bg-[#0a0a0a] flex items-center overflow-x-auto border-b border-white/[0.06]">
            {openFileIds.map((fid) => {
              const file = files.find((f: any) => f.id === fid);
              if (!file) return null;
              const isActive = activeFileId === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`group relative h-full px-4 flex items-center gap-2.5 text-sm cursor-pointer min-w-[140px] max-w-[200px] select-none transition-all border-r border-white/[0.04] ${
                    isActive
                      ? "bg-[#09090b] text-white"
                      : "bg-[#0a0a0a] text-zinc-500 hover:text-zinc-300 hover:bg-[#0a0a0a]/80"
                  }`}
                >
                  {/* Active tab glow */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  )}

                  <FileIcon
                    filename={file.name}
                    size={14}
                    isActive={isActive}
                  />
                  <span
                    className="truncate flex-1"
                    style={{
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
                      fontSize: "12px",
                    }}
                  >
                    {file.name}
                  </span>

                  {dirtyFileIds.has(file.id) ? (
                    <div
                      onClick={(e) => handleCloseFile(file.id, e)}
                      className="p-1 hover:bg-white/10 rounded cursor-pointer"
                    >
                      <Circle
                        size={8}
                        fill="currentColor"
                        className="text-blue-400"
                      />
                    </div>
                  ) : (
                    <X
                      size={14}
                      className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 transition-opacity"
                      onClick={(e) => handleCloseFile(file.id, e)}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Breadcrumbs */}
          {activeFile && (
            <div className="h-7 flex items-center px-4 text-xs text-zinc-600 gap-1.5 border-b border-white/[0.04] bg-[#09090b]">
              <Folder size={12} className="text-blue-400/70" />
              <span>{project.name}</span>
              <ChevronRight size={12} />
              <span className="text-zinc-400">{activeFile.name}</span>
              <ExtLabel filename={activeFile.name} />
              {exportStatus !== "idle" && (
                <span className="ml-4 text-amber-400 flex items-center gap-1.5 text-[10px] bg-amber-400/10 px-2 py-0.5 rounded-full">
                  <RefreshCw size={10} className="animate-spin" />
                  Export Mode
                </span>
              )}
            </div>
          )}

          <div className="flex-1 relative bg-[#09090b] overflow-hidden">
            {activeFile ? (
              <Editor
                height="100%"
                language={getLanguage(activeFile.name)}
                theme="vs-dark"
                value={activeFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorMount}
                options={{
                  minimap: {
                    enabled: true,
                    scale: 0.75,
                    showSlider: "mouseover",
                  },
                  fontSize: 14,
                  fontFamily:
                    '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Monaco, monospace',
                  fontLigatures: true,
                  lineNumbers: "on",
                  lineHeight: 1.6,
                  renderLineHighlight: "line",
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  scrollbar: {
                    vertical: "visible",
                    horizontal: "visible",
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                    useShadows: false,
                  },
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-blue-500/10 blur-2xl" />
                  <div className="relative w-24 h-24 rounded-2xl bg-zinc-900/50 border border-white/[0.06] flex items-center justify-center">
                    <Sparkles size={36} className="text-zinc-600" />
                  </div>
                </div>
                <div className="flex flex-col gap-4 text-sm">
                  <div className="flex justify-between gap-12 px-4 py-2 hover:bg-white/[0.02] rounded-lg transition-colors">
                    <span>Go to File</span>
                    <span className="text-zinc-500 flex items-center gap-1 font-mono text-xs bg-white/5 px-2 py-0.5 rounded">
                      <Command size={10} />P
                    </span>
                  </div>
                  <div className="flex justify-between gap-12 px-4 py-2 hover:bg-white/[0.02] rounded-lg transition-colors">
                    <span>Toggle Terminal</span>
                    <span className="text-zinc-500 flex items-center gap-1 font-mono text-xs bg-white/5 px-2 py-0.5 rounded">
                      <Command size={10} />`
                    </span>
                  </div>
                  <div className="flex justify-between gap-12 px-4 py-2 hover:bg-white/[0.02] rounded-lg transition-colors">
                    <span>Save File</span>
                    <span className="text-zinc-500 flex items-center gap-1 font-mono text-xs bg-white/5 px-2 py-0.5 rounded">
                      <Command size={10} />S
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========== ENHANCED TERMINAL SECTION ========== */}
          <div
            className={`relative bg-gradient-to-b from-[#0a0a0a] to-[#0c0c0c] border-t border-white/[0.08] flex flex-col transition-all duration-300 ease-in-out backdrop-blur-sm ${
              terminalExpanded ? "h-64" : "h-11"
            }`}
            style={{
              boxShadow: terminalExpanded
                ? "0 -4px 24px rgba(0, 0, 0, 0.6), 0 -1px 3px rgba(59, 130, 246, 0.1)"
                : "none",
            }}
          >
            {/* Ambient glow effect */}
            {terminalExpanded && (
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            )}

            {/* Terminal Header */}
            <div className="relative h-11 flex items-center justify-between px-4 select-none flex-shrink-0 border-b border-white/[0.06]">
              <div className="flex items-center gap-6 h-full">
                <button
                  onClick={() => setTerminalExpanded(!terminalExpanded)}
                  className={`group flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest h-full px-1 border-b-2 transition-all ${
                    terminalExpanded
                      ? "text-emerald-400 border-emerald-500 shadow-[0_2px_8px_rgba(52,211,153,0.3)]"
                      : "text-zinc-500 border-transparent hover:text-zinc-300"
                  }`}
                >
                  <TerminalIcon
                    size={14}
                    className={terminalExpanded ? "animate-pulse" : ""}
                  />
                  Terminal
                  {isRunning && (
                    <span className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    </span>
                  )}
                </button>
                <span className="text-[11px] font-semibold uppercase text-zinc-600 tracking-widest cursor-default hover:text-zinc-500 transition-colors">
                  Problems
                </span>
                <span className="text-[11px] font-semibold uppercase text-zinc-600 tracking-widest cursor-default hover:text-zinc-500 transition-colors">
                  Output
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTerminalExpanded(!terminalExpanded)}
                  className="hover:bg-white/10 rounded-lg p-1.5 transition-all hover:scale-110 active:scale-95"
                  title={terminalExpanded ? "Minimize" : "Maximize"}
                >
                  <PanelBottomClose
                    size={14}
                    className={`text-zinc-400 transition-transform ${
                      terminalExpanded ? "" : "rotate-180"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Export Verification Banner */}
            {exportStatus === "verifying" && (
              <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border-b border-emerald-500/30 px-4 py-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-300">
                <div className="text-sm flex items-center gap-3 text-emerald-300">
                  <div className="relative">
                    <Check size={16} className="relative z-10" />
                    <div className="absolute inset-0 bg-emerald-500 blur-md opacity-50" />
                  </div>
                  <span className="font-medium">
                    Execution completed for{" "}
                    <strong className="text-emerald-200">
                      {activeFile?.name}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVerifyRetry}
                    className="group text-sm bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all border border-white/[0.08] hover:border-white/[0.15]"
                  >
                    <RefreshCw
                      size={12}
                      className="group-hover:rotate-180 transition-transform duration-500"
                    />{" "}
                    Retry
                  </button>
                  <button
                    onClick={handleVerifyContinue}
                    className="group text-sm bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                  >
                    Continue{" "}
                    <ArrowRight
                      size={12}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Terminal Output Area */}
            <div
              ref={terminalRef}
              className={`flex-1 overflow-auto px-4 py-3 text-[13px] leading-relaxed scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-600 transition-all ${
                terminalExpanded ? "opacity-100" : "opacity-0 h-0"
              }`}
              style={{
                fontFamily:
                  '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
                letterSpacing: "0.3px",
              }}
            >
              {terminalOutput.map((line, i) => (
                <div
                  key={i}
                  className="text-zinc-300 whitespace-pre-wrap transition-all hover:bg-white/[0.02] px-1 -mx-1 rounded"
                  dangerouslySetInnerHTML={{
                    __html: line
                      .replace(
                        /\x1b\[38;5;39m/g,
                        '<span class="text-cyan-400 font-semibold">'
                      )
                      .replace(
                        /\x1b\[38;5;75m/g,
                        '<span class="text-blue-400 font-medium">'
                      )
                      .replace(/\x1b\[0m/g, "</span>"),
                  }}
                />
              ))}
              {isRunning && !awaitingInput && (
                <div className="flex items-center gap-3 text-emerald-400 mt-3 animate-in fade-in duration-300">
                  <div className="flex gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    Running process...
                  </span>
                </div>
              )}
            </div>

            {/* Terminal Input Area - Enhanced */}
            {terminalExpanded && (
              <div className="px-4 pb-4 pt-3 border-t border-white/[0.06] bg-[#0c0c0c]/50 backdrop-blur-sm">
                <div className="relative group">
                  {/* Glow effect on focus */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg opacity-0 group-focus-within:opacity-20 blur transition-opacity duration-300" />

                  <div className="relative flex items-center gap-2 bg-gradient-to-r from-zinc-900/90 to-zinc-900/70 border border-white/[0.08] rounded-lg overflow-hidden group-focus-within:border-blue-500/50 transition-all">
                    {/* Input prompt indicator */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-800/50 border-r border-white/[0.06]">
                      <span className="text-cyan-400 font-semibold text-sm">
                        $
                      </span>
                      {awaitingInput && (
                        <span className="text-xs text-amber-400 font-medium animate-pulse">
                          Input Required
                        </span>
                      )}
                    </div>

                    <input
                      ref={terminalInputRef}
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={
                        isRunning
                          ? awaitingInput
                            ? "Type input and press Enter..."
                            : "Type input to send to process..."
                          : "Start a run to send input (Cmd+Enter)"
                      }
                      disabled={!isRunning}
                      className="flex-1 bg-transparent text-zinc-100 text-sm px-3 py-2.5 outline-none placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      }}
                    />

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 pr-2">
                      <button
                        //@ts-ignore
                        onClick={() => sendTerminalInput()}
                        disabled={
                          !isRunning || terminalInput.trim().length === 0
                        }
                        className="group/btn relative px-3 py-1.5 rounded-md bg-blue-600/80 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 overflow-hidden"
                        title="Send Input (Enter)"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                        <div className="relative flex items-center gap-1.5 text-white text-xs font-medium">
                          <Send size={12} />
                          <span>Send</span>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          // send EOF if backend supports it
                        }}
                        disabled={!isRunning}
                        className="px-3 py-1.5 rounded-md bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-medium border border-white/[0.08]"
                        title="Send EOF"
                      >
                        EOF
                      </button>
                    </div>
                  </div>

                  {/* Helper text */}
                  <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                      <span className="flex items-center gap-1">
                        <CornerDownLeft size={10} />
                        Enter to send
                      </span>
                      <span className="flex items-center gap-1">
                        ↑↓ Command history
                      </span>
                    </div>
                    {commandHistory.length > 0 && (
                      <span className="text-[10px] text-zinc-600">
                        History: {commandHistory.length} command
                        {commandHistory.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* ========== END ENHANCED TERMINAL SECTION ========== */}
        </main>
      </div>

      <footer className="h-7 bg-blue-600 flex items-center justify-between px-4 text-xs text-white select-none relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/20 px-2 py-1 rounded transition-colors">
            <GitBranch size={12} />
            <span>main</span>
          </div>
          <div className="flex items-center gap-1.5 cursor-pointer hover:bg-white/20 px-2 py-1 rounded transition-colors">
            <X size={12} /> 0
            <AlertCircle size={12} className="ml-1" /> 0
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer hover:bg-white/20 px-2 py-1 rounded transition-colors">
            Ln {lineCol.line}, Col {lineCol.col}
          </span>
          <span className="cursor-pointer hover:bg-white/20 px-2 py-1 rounded transition-colors">
            UTF-8
          </span>
          {activeFile && (
            <span className="cursor-pointer hover:bg-white/20 px-2 py-1 rounded transition-colors capitalize">
              {getLanguage(activeFile.name)}
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
