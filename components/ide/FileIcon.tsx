import React from 'react';
import {
  FileCode2,
  FileJson,
  FileText,
  FileType,
  Braces,
  Hash,
  Terminal,
  Settings,
  Image,
  File,
  FileSpreadsheet,
} from 'lucide-react';

interface FileIconProps {
  filename: string;
  size?: number;
  className?: string;
}

const extensionConfig: Record<string, { icon: React.ElementType; color: string }> = {
  // JavaScript/TypeScript
  js: { icon: Braces, color: '#f0db4f' },
  jsx: { icon: Braces, color: '#61dafb' },
  ts: { icon: Braces, color: '#3178c6' },
  tsx: { icon: Braces, color: '#3178c6' },
  
  // Python
  py: { icon: FileCode2, color: '#3776ab' },
  
  // C/C++
  c: { icon: Hash, color: '#5391FE' },
  cpp: { icon: Hash, color: '#00599C' },
  h: { icon: Hash, color: '#6b7280' },
  hpp: { icon: Hash, color: '#6b7280' },
  
  // Web
  html: { icon: FileCode2, color: '#e34f26' },
  css: { icon: FileCode2, color: '#264de4' },
  scss: { icon: FileCode2, color: '#c6538c' },
  
  // Data
  json: { icon: FileJson, color: '#6b7280' },
  yaml: { icon: FileSpreadsheet, color: '#cb171e' },
  yml: { icon: FileSpreadsheet, color: '#cb171e' },
  xml: { icon: FileCode2, color: '#ff6600' },
  
  // Config
  env: { icon: Settings, color: '#ecd53f' },
  config: { icon: Settings, color: '#6b7280' },
  
  // Shell
  sh: { icon: Terminal, color: '#4eaa25' },
  bash: { icon: Terminal, color: '#4eaa25' },
  zsh: { icon: Terminal, color: '#4eaa25' },
  
  // Docs
  md: { icon: FileText, color: '#083fa1' },
  txt: { icon: FileType, color: '#6b7280' },
  
  // Images
  png: { icon: Image, color: '#4f46e5' },
  jpg: { icon: Image, color: '#4f46e5' },
  jpeg: { icon: Image, color: '#4f46e5' },
  svg: { icon: Image, color: '#ffb13b' },
  gif: { icon: Image, color: '#4f46e5' },
  
  // Java
  java: { icon: FileCode2, color: '#b07219' },
  
  // Go
  go: { icon: FileCode2, color: '#00add8' },
  
  // Rust
  rs: { icon: FileCode2, color: '#dea584' },
};

export function FileIcon({ filename, size = 16, className = '' }: FileIconProps) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const config = extensionConfig[ext] || { icon: File, color: '#6b7280' };
  const IconComponent = config.icon;

  return (
    <IconComponent 
      size={size} 
      className={className}
      style={{ color: config.color }}
    />
  );
}

// Badge style file type indicator
export function FileTypeBadge({ filename, size = 14 }: { filename: string; size?: number }) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const colorMap: Record<string, { bg: string; fg: string }> = {
    py: { bg: '#306998', fg: '#fff' },
    js: { bg: '#f0db4f', fg: '#000' },
    ts: { bg: '#3178c6', fg: '#fff' },
    tsx: { bg: '#3178c6', fg: '#fff' },
    jsx: { bg: '#61dafb', fg: '#000' },
    cpp: { bg: '#00599C', fg: '#fff' },
    c: { bg: '#5391FE', fg: '#fff' },
    java: { bg: '#b07219', fg: '#fff' },
    html: { bg: '#e34f26', fg: '#fff' },
    css: { bg: '#264de4', fg: '#fff' },
    json: { bg: '#292929', fg: '#fff' },
    md: { bg: '#083fa1', fg: '#fff' },
    sh: { bg: '#4eaa25', fg: '#000' },
  };

  const colors = colorMap[ext] || { bg: '#4b5563', fg: '#fff' };
  const label = ext ? ext.toUpperCase() : 'FILE';

  return (
    <span
      className="inline-flex items-center justify-center font-mono font-semibold rounded"
      style={{
        minWidth: size * 2,
        height: size * 1.2,
        padding: '0 6px',
        fontSize: Math.max(9, size * 0.65),
        backgroundColor: colors.bg,
        color: colors.fg,
      }}
    >
      {label}
    </span>
  );
}
