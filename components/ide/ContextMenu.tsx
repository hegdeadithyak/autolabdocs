import React, { useEffect, useRef } from 'react';
import { 
  Copy, 
  Scissors, 
  ClipboardPaste, 
  Trash2, 
  Edit3, 
  FileText, 
  RefreshCw,
  Terminal,
  Code2,
  FolderOpen
} from 'lucide-react';

interface ContextMenuItem {
  label?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onClick?: () => void;
  divider?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (rect.right > viewportWidth) {
        menuRef.current.style.left = `${x - rect.width}px`;
      }
      if (rect.bottom > viewportHeight) {
        menuRef.current.style.top = `${y - rect.height}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[200px] bg-[#252526] border border-[#454545] rounded shadow-lg py-1"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => (
        item.divider ? (
          <div key={index} className="h-px bg-[#454545] my-1 mx-2" />
        ) : (
          <button
            key={index}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`w-full px-3 py-1.5 flex items-center gap-3 text-[13px] transition-colors ${
              item.disabled 
                ? 'text-[#858585] cursor-not-allowed' 
                : 'text-[#cccccc] hover:bg-[#094771] hover:text-white'
            }`}
          >
            {item.icon && (
              <span className="w-4 h-4 flex items-center justify-center opacity-70">
                {item.icon}
              </span>
            )}
            <span className="flex-1 text-left">{item.label}</span>
            {item.shortcut && (
              <span className={`text-xs ml-4 ${item.disabled ? 'text-[#858585]' : 'text-[#858585] group-hover:text-white'}`}>{item.shortcut}</span>
            )}
          </button>
        )
      ))}
    </div>
  );
}

// Preset menu configurations
export function getEditorContextMenuItems(handlers: {
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onFormat?: () => void;
}): ContextMenuItem[] {
  return [
    { label: 'Cut', icon: <Scissors size={14} />, shortcut: 'Ctrl+X', onClick: handlers.onCut },
    { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', onClick: handlers.onCopy },
    { label: 'Paste', icon: <ClipboardPaste size={14} />, shortcut: 'Ctrl+V', onClick: handlers.onPaste },
    { divider: true },
    { label: 'Select All', shortcut: 'Ctrl+A', onClick: handlers.onSelectAll },
    { divider: true },
    { label: 'Format Document', icon: <Code2 size={14} />, shortcut: 'Shift+Alt+F', onClick: handlers.onFormat },
  ];
}

export function getFileContextMenuItems(handlers: {
  onOpen?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onCopyPath?: () => void;
  onRevealInExplorer?: () => void;
}): ContextMenuItem[] {
  return [
    { label: 'Open', icon: <FileText size={14} />, onClick: handlers.onOpen },
    { divider: true },
    { label: 'Rename', icon: <Edit3 size={14} />, shortcut: 'F2', onClick: handlers.onRename },
    { label: 'Delete', icon: <Trash2 size={14} />, shortcut: 'Del', onClick: handlers.onDelete },
    { divider: true },
    { label: 'Copy Path', onClick: handlers.onCopyPath },
    { label: 'Reveal in Explorer', icon: <FolderOpen size={14} />, onClick: handlers.onRevealInExplorer },
  ];
}

export function getTerminalContextMenuItems(handlers: {
  onCopy?: () => void;
  onPaste?: () => void;
  onClear?: () => void;
  onNewTerminal?: () => void;
}): ContextMenuItem[] {
  return [
    { label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', onClick: handlers.onCopy },
    { label: 'Paste', icon: <ClipboardPaste size={14} />, shortcut: 'Ctrl+V', onClick: handlers.onPaste },
    { divider: true },
    { label: 'Clear Terminal', icon: <RefreshCw size={14} />, onClick: handlers.onClear },
    { label: 'New Terminal', icon: <Terminal size={14} />, onClick: handlers.onNewTerminal },
  ];
}
