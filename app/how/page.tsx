'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Cpu, FileText, Sparkles, Zap, Coins, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HowItWorksPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white selection:bg-blue-500/30 overflow-x-hidden antialiased pt-20"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', sans-serif" }}
    >
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-6">
            <Sparkles size={12} />
            <span>Behind the Magic</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-tight mb-6">
            How AutoLabDocs
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400">
              actually works.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            We don't just "format" your code. We execute it in a secure, isolated environment, capture the outputs, and generate a pixel-perfect report.
          </p>
        </motion.div>
      </section>

      {/* Detailed Steps */}
      <section className="px-6 py-10 max-w-5xl mx-auto space-y-24">
        
        {/* Step 1: Ingestion */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div className="order-2 md:order-1 relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-transparent blur-xl rounded-full opacity-50" />
             <div className="relative bg-[#111] border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-4 border-b border-white/[0.06] pb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                  </div>
                  <div className="ml-auto text-xs font-mono text-zinc-500">main.py</div>
                </div>
                <div className="space-y-2 font-mono text-xs md:text-sm">
                   <div className="text-blue-400">import <span className="text-white">matplotlib.pyplot</span> as <span className="text-white">plt</span></div>
                   <div className="text-zinc-500"># Your raw code</div>
                   <div>data = [<span className="text-orange-400">1</span>, <span className="text-orange-400">2</span>, <span className="text-orange-400">4</span>, <span className="text-orange-400">8</span>, <span className="text-orange-400">16</span>]</div>
                   <div>plt.plot(data)</div>
                </div>
             </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
              <Code2 size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold">1. Smart Ingestion</h2>
            <p className="text-zinc-400 leading-relaxed">
              Drop your `.ipynb` notebook or paste raw code files (Python, C, C++). Our parser instantly identifies code blocks, markdown documentation, and raw data structures.
            </p>
            <ul className="space-y-2 text-sm text-zinc-500 pt-2">
               <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-500" /> Supports Jupyter Notebooks</li>
               <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-500" /> Multi-file support</li>
               <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-blue-500" /> Automatic language detection</li>
            </ul>
          </div>
        </motion.div>

        {/* Step 2: Execution */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2">
              <Cpu size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold">2. Isolated Execution</h2>
            <p className="text-zinc-400 leading-relaxed">
              We don't just format text. We spin up a secure, ephemeral container to actually <strong>run</strong> your code. This ensures that the outputs in your report exactly match the code provided.
            </p>
            <p className="text-zinc-500 text-sm">
               We capture stdout, stderr, and generated plot images in real-time.
            </p>
          </div>
           <div className="relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-transparent blur-xl rounded-full opacity-50" />
             <div className="relative bg-[#111] border border-white/[0.08] rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                   <div className="animate-pulse w-2 h-2 rounded-full bg-emerald-500" />
                   <div className="text-xs font-mono text-zinc-500">runner-instance-xyz</div>
                </div>
                <div className="space-y-3 font-mono text-xs md:text-sm">
                   <div className="text-zinc-400 flex gap-2">
                      <span className="text-emerald-500">➜</span>
                      <span>python main.py</span>
                   </div>
                   <div className="text-zinc-300 pl-4 border-l border-white/[0.1]">
                      Processing dataset...<br/>
                      <span className="text-emerald-400">Generated plot: output_1.png</span><br/>
                      Done in 0.4s
                   </div>
                </div>
             </div>
          </div>
        </motion.div>

         {/* Step 3: Generation */}
         <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div className="order-2 md:order-1 relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 to-transparent blur-xl rounded-full opacity-50" />
             <div className="relative bg-white text-black rounded-xl p-6 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="border-b-2 border-black pb-2 mb-4">
                   <div className="text-lg font-bold">Lab Report: Data Analysis</div>
                   <div className="text-[10px] text-gray-500">Generated by AutoLabDocs</div>
                </div>
                <div className="space-y-4">
                   <div className="h-2 bg-gray-200 rounded w-full" />
                   <div className="h-2 bg-gray-200 rounded w-5/6" />
                   <div className="mt-4 p-2 border border-gray-300 bg-gray-50 rounded">
                      <div className="w-full h-20 bg-blue-100 flex items-end justify-center gap-1 pb-2">
                         <div className="w-2 h-8 bg-blue-500" />
                         <div className="w-2 h-12 bg-blue-500" />
                         <div className="w-2 h-6 bg-blue-500" />
                         <div className="w-2 h-10 bg-blue-500" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
          <div className="order-1 md:order-2 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2">
              <FileText size={24} />
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold">3. Perfect PDF Generation</h2>
            <p className="text-zinc-400 leading-relaxed">
               We compile the code, documentation, and execution artifacts into a professional-grade PDF (or DOCX).
            </p>
             <ul className="space-y-2 text-sm text-zinc-500 pt-2">
               <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Syntax highlighting preserved</li>
               <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> High-res vector plots</li>
               <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-500" /> Standard academic formatting</li>
            </ul>
          </div>
        </motion.div>

      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-6 bg-[#050505] border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto text-center space-y-8">
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5 }}
           >
             <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4">Pricing</h2>
             <p className="text-zinc-400 text-lg">
               Simple, transparent, and student-friendly.
             </p>
           </motion.div>

           <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.5, delay: 0.2 }}
             className="relative group max-w-sm mx-auto"
           >
             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl opacity-75 blur group-hover:opacity-100 transition duration-500" />
             <div className="relative bg-[#0c0c0c] rounded-2xl p-8 border border-white/[0.1] h-full flex flex-col items-center">
                
                <div className="mb-4 p-3 bg-blue-500/10 rounded-full text-blue-400">
                   <Zap size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-2">Early Access</h3>
                
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-bold text-white">Free</span>
                  <span className="text-zinc-500 text-sm">/ forever (for now)</span>
                </div>

                <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                   AutoLabDocs is currently in beta. All features are free to use.
                </p>

                <div className="w-full h-px bg-white/[0.06] mb-8" />

                <div className="space-y-4 w-full text-left mb-8">
                   <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
                      Unlimited Projects
                   </div>
                   <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
                      PDF & DOCX Export
                   </div>
                   <div className="flex items-center gap-3 text-sm text-zinc-300">
                      <CheckCircle2 size={16} className="text-blue-500 flex-shrink-0" />
                      Python, C, C++ Support
                   </div>
                </div>

                <button 
                  onClick={() => router.push('/signin')}
                  className="w-full py-3 bg-white text-black font-semibold rounded-xl hover:bg-zinc-200 transition-colors"
                >
                   Start Generating
                </button>
             </div>
           </motion.div>

           <div className="mt-12 p-6 bg-[#111] rounded-2xl border border-white/[0.04] max-w-2xl mx-auto flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full text-amber-500 flex-shrink-0">
                 <Coins size={24} />
              </div>
              <div className="text-left">
                 <h4 className="text-white font-medium mb-1">Collect Coins</h4>
                 <p className="text-sm text-zinc-500">
                    Earn coins by generating reports and referring friends. These will be valuable when we launch premium features later. Start hoarding now!
                 </p>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.04] text-center text-sm text-zinc-600">
         <p>© 2024 AutoLabDocs. Built for engineers.</p>
      </footer>
    </div>
  );
}
