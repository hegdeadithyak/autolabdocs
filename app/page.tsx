'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvider';
import { Dashboard } from '../components/Dashboard';
import { LandingHero } from '../components/LandingHero';
import SineWaveLoading from '../components/SineWaveLoading';
import { Project, ProjectType, ParsedCell } from '../types';
import { api } from '../lib/api';
import { parseNotebook } from '../lib/notebookService';

const MIN_LOADING_TIME = 4000;

export default function Page() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const normalizeNotebook = (p: Project): Project => {
    if (p.type === ProjectType.COLAB) {
      const nc = (p as any).notebookContent;
      if (typeof nc === "string" && nc.trim()) {
        try {
          return { ...p, notebookContent: parseNotebook(nc) };
        } catch {
          return p;
        }
      }
    }
    return p;
  };

  const handleOpenProjectWithMinimumLoading = async (p: Project) => {
    setShowLoadingOverlay(true);
    const start = Date.now();

    try {
      // In a real app, we might want to fetch fresh data here.
      // But for navigation, we assume the ID is enough.
      // However, the original logic fetched the full project.
      const full = await api.getProject(p.id);
      const normalized = normalizeNotebook(full);
      
      // We don't need to set state here because we are navigating away.
      // But we do need to wait.

      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_TIME - elapsed;

      const navigate = () => {
        router.push(`/workspace/${p.id}`);
        // We assume the new page will handle its own loading or data fetching
        // or we rely on Next.js cache.
      };

      if (remaining > 0) {
        timeoutRef.current = setTimeout(() => {
          navigate();
          // Keep overlay until unmount/nav
        }, remaining);
      } else {
        navigate();
      }
    } catch (err) {
      console.error("Failed to open project:", err);
      setShowLoadingOverlay(false);
      alert("Failed to load project.");
    }
  };

  if (authLoading) {
     return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Loading Auth...</div>;
  }

  return (
    <>
      {showLoadingOverlay && <SineWaveLoading />}
      <main>
        {user ? (
          <Dashboard 
            user={user} 
            onOpenProject={handleOpenProjectWithMinimumLoading} 
            onLogout={logout}
          />
        ) : (
          <LandingHero onStart={() => router.push('/signup')} />
        )}
      </main>
    </>
  );
}