import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

export const LandingHero: React.FC<{ onStart: () => void }> = ({ onStart }) => (
  <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] overflow-hidden">
    {/* Dynamic Background */}
    <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

    {/* Hero Content */}
    <div className="relative z-10 text-center space-y-8 animate-slide-up max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-zinc-400 tracking-wide uppercase mb-4 hover:bg-white/10 transition-colors cursor-default">
        <Zap size={10} className="text-yellow-400 fill-yellow-400" />
        <span>v3.0 Production Ready</span>
      </div>

      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-gradient leading-[1.1]">
        Lab Reports.
        <br />
        <span className="text-white opacity-40">Perfected.</span>
      </h1>

      <p className="text-zinc-400 max-w-xl mx-auto text-lg font-light leading-relaxed">
        Transform Google Colab notebooks and code experiments into clean,
        submission-ready documentation.
      </p>

      <div className="pt-8">
        <button
          onClick={onStart}
          className="group relative px-8 py-4 bg-white text-black rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          <span className="relative flex items-center gap-2">
            Start Session{" "}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </span>
        </button>
      </div>
    </div>
  </div>
);
