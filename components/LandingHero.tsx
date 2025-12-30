import React from 'react';
import { ArrowRight, Zap } from 'lucide-react';

export const LandingHero: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-black overflow-hidden">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
      
      {/* Single Clean Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[140px] rounded-full" />

      {/* Hero Content */}
      <div className="relative z-10 text-center space-y-6 max-w-2xl mx-auto">
        {/* Version Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 hover:bg-white/10 transition-colors">
          <Zap size={12} className="text-yellow-400 fill-yellow-400" />
          v1.0 Production Ready
        </div>

        {/* Main Headline */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-none">
            Automate Labsheets.
          </h1>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white/30 leading-none">
            Spend Time Wisely.
          </h2>
        </div>

        {/* Description */}
        <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed pt-4">
          Stop wasting hours on documentation. Transform messy Colab notebooks into polished lab reports while you actually live your life.
        </p>

        {/* CTA Button */}
        <div className="pt-8">
          <button
            onClick={onStart}
            className="group relative px-8 py-4 bg-white text-black rounded-full font-semibold text-base transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.3)]"
          >
            <span className="flex items-center gap-2">
              Start Session
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};