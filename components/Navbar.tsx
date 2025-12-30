'use client';

import React from 'react';
import { useAuth } from './AuthProvider';
import { usePathname } from 'next/navigation';
import { LogOut, Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  
  // Hide Navbar in workspace routes (IDE/Colab usually have their own headers)
  const isWorkspace = pathname?.startsWith('/workspace');
  if (isWorkspace) return null;

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-6 justify-between transition-all">
      <div className="flex items-center gap-3 group cursor-default">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative w-8 h-8 bg-gradient-to-br from-zinc-800 to-black border border-white/10 rounded-lg flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
            <Layers
              size={18}
              className="text-white relative z-10"
              strokeWidth={2.5}
            />
          </div>
        </div>
        <span className="text-lg font-bold tracking-tight text-white font-sans opacity-90 group-hover:opacity-100 transition-opacity">
          AutolabDocs
        </span>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-xs font-medium text-white">{user.name}</span>
            <span className="text-[10px] text-zinc-500">{user.email}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </nav>
  );
};