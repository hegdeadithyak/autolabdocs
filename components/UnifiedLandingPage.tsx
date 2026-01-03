"use client"

import type React from "react"
import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import { ArrowRight, FileText, Code2, Cpu, Terminal, Clock, Zap, Sparkles } from "lucide-react"

export function UnifiedLandingPage() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: containerRef })

  const smoothScroll = useSpring(scrollYProgress, { stiffness: 60, damping: 20 })
  const opacity = useTransform(smoothScroll, [0, 0.15], [1, 0])
  const scale = useTransform(smoothScroll, [0, 0.15], [1, 0.95])

  return (
    <div
      ref={containerRef}
      className="relative bg-[#0a0a0a] text-white selection:bg-blue-500/30 overflow-x-hidden antialiased"
      style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', sans-serif" }}
    >
      {/* Subtle blue glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
        <motion.div
          style={{ opacity, scale }}
          className="z-10 flex flex-col items-center max-w-4xl mx-auto text-center gap-6"
        >
          {/* Badge */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[13px] font-medium text-zinc-400 tracking-tight">Now in Beta</span>
          </div>

          {/* What it is - Clear context for first-time visitors */}
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Code2 size={16} className="text-blue-400" />
            <span>Code</span>
            <ArrowRight size={14} className="text-zinc-600" />
            <Sparkles size={16} className="text-blue-400" />
            <span>AutoLabDocs</span>
            <ArrowRight size={14} className="text-zinc-600" />
            <FileText size={16} className="text-blue-400" />
            <span>Perfect PDF</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.03em] text-white leading-[1.05]">
            Lab reports that
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
              write themselves.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal tracking-tight">
            Paste your code. Get a <span className="text-white font-medium">professionally formatted PDF</span> with
            syntax highlighting, auto-generated graphs, and proper structure.
            <br />
            <span className="text-zinc-500">In under 2 minutes. Not 2 hours.</span>
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
            <button
              onClick={() => router.push("/signin")}
              className="group px-8 py-4 bg-white text-[#0a0a0a] rounded-full font-semibold text-base hover:bg-zinc-100 transition-all duration-200 flex items-center gap-2"
            >
              Generate your first report
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <span className="text-sm text-zinc-600">Free. No signup required.</span>
          </div>
        </motion.div>

        {/* Live Mockup */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 w-full max-w-5xl z-20 px-4"
        >
          <SplitMockup />
        </motion.div>
      </section>

      <section className="py-20 px-6 bg-[#080808] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-medium text-zinc-600 uppercase tracking-[0.2em]">How it works</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mt-4">Three steps. That's it.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4 p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                <Code2 size={24} className="text-blue-400" />
              </div>
              <div className="text-lg font-semibold text-white">1. Paste your code</div>
              <div className="text-sm text-zinc-500">Python, C, C++ - we run it natively and capture everything.</div>
            </div>
            <div className="text-center space-y-4 p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                <Sparkles size={24} className="text-blue-400" />
              </div>
              <div className="text-lg font-semibold text-white">2. We do the work</div>
              <div className="text-sm text-zinc-500">
                Syntax highlighting, output graphs, proper formatting - automatic.
              </div>
            </div>
            <div className="text-center space-y-4 p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                <FileText size={24} className="text-blue-400" />
              </div>
              <div className="text-lg font-semibold text-white">3. Download PDF</div>
              <div className="text-sm text-zinc-500">Submit-ready. Prof-approved. Weekend-saving.</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PAIN POINT STATS --- */}
      <section className="py-24 px-6 bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
              The average engineering student <span className="text-zinc-500">wastes</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
            <div className="text-center space-y-2">
              <div className="text-5xl md:text-6xl font-semibold tracking-tight text-white">47</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider">Minutes per lab</div>
              <div className="text-xs text-zinc-600">on formatting alone</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-5xl md:text-6xl font-semibold tracking-tight text-white">12</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider">Screenshots</div>
              <div className="text-xs text-zinc-600">manually resized each time</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-5xl md:text-6xl font-semibold tracking-tight text-white">3AM</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider">Submission time</div>
              <div className="text-xs text-zinc-600">because Word crashed. Again.</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- NATIVE SUPPORT --- */}
      <section className="py-20 px-6 bg-[#080808] border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-10">
          <span className="text-xs font-medium text-zinc-600 uppercase tracking-[0.2em]">Native Execution</span>
          <div className="flex flex-wrap justify-center gap-16 md:gap-24">
            <div className="flex flex-col items-center gap-3 group cursor-default">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] group-hover:border-blue-500/20 group-hover:bg-blue-500/[0.03] transition-all duration-300">
                <Code2
                  size={28}
                  strokeWidth={1.5}
                  className="text-zinc-500 group-hover:text-blue-400 transition-colors"
                />
              </div>
              <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                Python
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 group cursor-default">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] group-hover:border-blue-500/20 group-hover:bg-blue-500/[0.03] transition-all duration-300">
                <Cpu
                  size={28}
                  strokeWidth={1.5}
                  className="text-zinc-500 group-hover:text-blue-400 transition-colors"
                />
              </div>
              <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">C++</span>
            </div>
            <div className="flex flex-col items-center gap-3 group cursor-default">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.04] group-hover:border-blue-500/20 group-hover:bg-blue-500/[0.03] transition-all duration-300">
                <Terminal
                  size={28}
                  strokeWidth={1.5}
                  className="text-zinc-500 group-hover:text-blue-400 transition-colors"
                />
              </div>
              <span className="text-sm font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">C</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- COMPARISON SECTION - Smooth Scroll Slider --- */}
      <section className="py-32 px-6 bg-[#050505]">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em]">
              Same deadline.
              <br />
              <span className="text-zinc-500">Different reality.</span>
            </h2>
            <p className="text-zinc-600 text-lg max-w-md mx-auto">
              Drag to see what your classmates are still doing manually.
            </p>
          </div>

          {/* PDF Comparison Slider */}
          <PDFComparisonSlider />

          {/* Savage comparison text */}
          <div className="grid md:grid-cols-2 gap-8 pt-8">
            <div className="space-y-4 p-6 rounded-2xl bg-red-500/[0.03] border border-red-500/10">
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-red-400" />
                <span className="text-red-400 font-medium">The "I'll just use Word" guy</span>
              </div>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>• Spends 45 minutes fighting margins</li>
                <li>• Screenshots get pixelated when resized</li>
                <li>• Code loses syntax highlighting</li>
                <li>• Submits at 11:58 PM, sweating</li>
                <li>• Gets 7/10 because "formatting issues"</li>
              </ul>
            </div>
            <div className="space-y-4 p-6 rounded-2xl bg-blue-500/[0.03] border border-blue-500/10">
              <div className="flex items-center gap-3">
                <Zap size={20} className="text-blue-400" />
                <span className="text-blue-400 font-medium">You, after 2 minutes</span>
              </div>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li>• Paste code, click export</li>
                <li>• Perfect syntax highlighting, always</li>
                <li>• Graphs auto-scaled, pixel-perfect</li>
                <li>• Submitted 3 hours early</li>
                <li>• Prof asks if you want to TA the course</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIAL / SOCIAL PROOF --- */}
      <section className="py-24 px-6 bg-[#0a0a0a] border-y border-white/[0.04]">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="text-2xl md:text-3xl font-normal text-zinc-300 leading-relaxed tracking-tight">
            "I used to spend my entire Sunday on lab reports. Now I finish them during the lecture while the prof is
            still explaining the theory."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
            <div className="text-left">
              <div className="text-sm font-medium text-white">CS Student</div>
              <div className="text-xs text-zinc-600">Who actually has weekends now</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-32 md:py-40 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/[0.02] to-transparent pointer-events-none" />
        <div className="relative z-10 px-6 space-y-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.02em]">
            Your time is worth more
            <br />
            <span className="text-zinc-500">than formatting PDFs.</span>
          </h2>
          <p className="text-zinc-600 text-lg max-w-md mx-auto">
            Join 2,000+ students who stopped wasting their lives in Microsoft Word.
          </p>
          <button
            onClick={() => router.push("/signin")}
            className="px-10 py-5 bg-white text-[#0a0a0a] rounded-full font-semibold text-lg hover:bg-zinc-100 transition-all duration-200"
          >
            Generate your first report
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-600">
          <div className="font-medium text-zinc-400">AutoLabDocs</div>
          <div>Built by students, for students who have better things to do.</div>
        </div>
      </footer>
    </div>
  )
}

// --- SPLIT MOCKUP COMPONENT ---
const SplitMockup = () => {
  return (
    <div className="relative rounded-2xl bg-[#111] border border-white/[0.06] shadow-2xl shadow-black/50 overflow-hidden aspect-[16/9] flex flex-col md:flex-row">
      {/* Left: Code Editor */}
      <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-white/[0.04] bg-[#0d0d0d]">
        {/* Tab Bar */}
        <div className="h-10 bg-[#151515] border-b border-white/[0.04] flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
            <div className="w-3 h-3 rounded-full bg-zinc-700" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 ml-4 bg-[#0d0d0d] rounded text-xs text-zinc-400 font-medium">
            <Code2 size={12} /> main.py
          </div>
        </div>
        {/* Editor Content */}
        <div className="flex-1 p-6 font-mono text-sm leading-relaxed text-zinc-400 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#0d0d0d] flex flex-col items-end pr-4 pt-6 text-zinc-700 select-none text-xs">
            <div>1</div>
            <div>2</div>
            <div>3</div>
            <div>4</div>
            <div>5</div>
            <div>6</div>
          </div>
          <div className="pl-8 space-y-1">
            <div>
              <span className="text-blue-400">def</span> <span className="text-cyan-400">generate_report</span>(data):
            </div>
            <div className="pl-4 text-zinc-600">{`"""Process lab results"""`}</div>
            <div className="pl-4">
              <span className="text-zinc-300">results</span> = []
            </div>
            <div className="pl-4">
              <span className="text-blue-400">for</span> item <span className="text-blue-400">in</span> data:
            </div>
            <div className="pl-8">
              results.append(item * <span className="text-orange-400">2</span>)
            </div>
            <div className="pl-4">
              <span className="text-blue-400">return</span> results
            </div>
          </div>

          <div className="absolute bottom-4 left-14 right-4 h-28 bg-[#0a0a0a] border border-white/[0.04] rounded-lg p-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-zinc-600 mb-2 border-b border-white/[0.04] pb-2">
              <Terminal size={12} /> Output
            </div>
            <div className="text-emerald-400">
              $ python main.py
              <br />
              <span className="text-zinc-500">Processing 1024 records...</span>
              <br />
              <span className="text-emerald-400">Done in 0.003s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: PDF Preview */}
      <div className="flex-1 flex flex-col bg-[#151515] relative">
        {/* Toolbar */}
        <div className="h-10 bg-[#1a1a1a] border-b border-white/[0.04] flex items-center justify-between px-4">
          <span className="text-xs text-zinc-500 font-medium flex items-center gap-2">
            <FileText size={12} /> report.pdf
          </span>
          <div className="text-xs text-emerald-400 font-medium">Auto-generated</div>
        </div>

        {/* PDF Canvas */}
        <div className="flex-1 p-6 flex items-center justify-center bg-[#1a1a1a] overflow-hidden">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-[85%] aspect-[1/1.4] bg-white rounded-sm shadow-2xl p-6 text-[8px] text-zinc-800 flex flex-col gap-3 relative"
          >
            <div className="text-base font-bold text-black border-b border-zinc-200 pb-2">Lab Report 01</div>
            <div className="text-[9px] text-zinc-500">Author: Student ID 12345</div>

            <div className="space-y-1.5">
              <div className="font-semibold text-[10px]">1. Introduction</div>
              <div className="h-1.5 w-full bg-zinc-100 rounded" />
              <div className="h-1.5 w-full bg-zinc-100 rounded" />
              <div className="h-1.5 w-3/4 bg-zinc-100 rounded" />
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-[10px]">2. Code</div>
              <div className="w-full bg-zinc-50 p-2 rounded border border-zinc-100 font-mono text-[6px] text-zinc-600">
                <span className="text-blue-600">def</span> generate_report(data):
                <br />
                &nbsp;&nbsp;<span className="text-blue-600">return</span> [x * 2{" "}
                <span className="text-blue-600">for</span> x <span className="text-blue-600">in</span> data]
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-[10px]">3. Results</div>
              <div className="w-full h-16 bg-blue-50 border border-blue-100 rounded flex items-center justify-center">
                <div className="w-full h-10 flex items-end justify-center gap-1 px-3">
                  <div className="w-1.5 h-3 bg-blue-400 rounded-t" />
                  <div className="w-1.5 h-5 bg-blue-400 rounded-t" />
                  <div className="w-1.5 h-7 bg-blue-400 rounded-t" />
                  <div className="w-1.5 h-4 bg-blue-400 rounded-t" />
                  <div className="w-1.5 h-8 bg-blue-400 rounded-t" />
                  <div className="w-1.5 h-6 bg-blue-400 rounded-t" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// --- PDF COMPARISON SLIDER ---
const PDFComparisonSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    const percent = (x / rect.width) * 100
    setSliderPosition(percent)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return
    handleMove(e.clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-2xl overflow-hidden cursor-ew-resize select-none bg-[#0d0d0d] border border-white/[0.06]"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={(e) => handleMove(e.clientX)}
    >
      {/* Before - Word Document (Full width, clipped) */}
      <div className="absolute inset-0 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md aspect-[1/1.3] bg-white rounded shadow-2xl p-6 relative">
          {/* Messy Word Doc */}
          <div className="absolute top-2 left-2 right-2 h-6 bg-[#217346] flex items-center px-2 gap-1">
            <div className="w-2 h-2 bg-white/30 rounded-sm" />
            <div className="w-2 h-2 bg-white/30 rounded-sm" />
            <div className="w-2 h-2 bg-white/30 rounded-sm" />
            <span className="text-[6px] text-white ml-2">Document1 - Word</span>
          </div>
          <div className="pt-8 space-y-3">
            <div className="text-xs font-bold text-black">Lab Report 01</div>
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-zinc-200 rounded" />
              <div className="h-1.5 w-3/4 bg-zinc-200 rounded" />
            </div>
            {/* Ugly screenshot */}
            <div className="w-full h-20 bg-zinc-100 border-2 border-dashed border-zinc-300 rounded flex items-center justify-center">
              <div className="text-[8px] text-zinc-400 text-center">
                screenshot_2024_final_v3_REAL.png
                <br />
                <span className="text-red-400">(pixelated)</span>
              </div>
            </div>
            {/* Code without highlighting */}
            <div className="w-full bg-zinc-50 p-2 rounded border border-zinc-200 font-mono text-[6px] text-black">
              def generate_report(data):
              <br />
              &nbsp;&nbsp;return [x * 2 for x in data]
            </div>
            <div className="absolute bottom-4 right-4 px-2 py-1 bg-red-500 text-white text-[8px] font-bold rounded">
              45 min
            </div>
          </div>
        </div>
      </div>

      {/* After - AutoLabDocs PDF (Revealed by slider) */}
      <div
        className="absolute inset-0 flex items-center justify-center p-8 md:p-16 bg-[#0d0d0d]"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <div className="w-full max-w-md aspect-[1/1.3] bg-white rounded shadow-2xl p-6 relative">
          {/* Clean PDF */}
          <div className="space-y-3">
            <div className="text-base font-bold text-black border-b border-zinc-200 pb-2">Lab Report 01</div>
            <div className="text-[9px] text-zinc-500">Generated by AutoLabDocs</div>

            <div className="space-y-1.5">
              <div className="font-semibold text-[10px]">1. Introduction</div>
              <div className="h-1.5 w-full bg-zinc-100 rounded" />
              <div className="h-1.5 w-full bg-zinc-100 rounded" />
              <div className="h-1.5 w-3/4 bg-zinc-100 rounded" />
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-[10px]">2. Code</div>
              <div className="w-full bg-zinc-900 p-2 rounded font-mono text-[6px]">
                <span className="text-blue-400">def</span> <span className="text-cyan-400">generate_report</span>(data):
                <br />
                &nbsp;&nbsp;<span className="text-blue-400">return</span>{" "}
                <span className="text-zinc-300">[x * 2 for x in data]</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-semibold text-[10px]">3. Results</div>
              <div className="w-full h-16 bg-blue-50 border border-blue-100 rounded flex items-center justify-center">
                <div className="w-full h-10 flex items-end justify-center gap-1 px-3">
                  <div className="w-1.5 h-3 bg-blue-500 rounded-t" />
                  <div className="w-1.5 h-5 bg-blue-500 rounded-t" />
                  <div className="w-1.5 h-7 bg-blue-500 rounded-t" />
                  <div className="w-1.5 h-4 bg-blue-500 rounded-t" />
                  <div className="w-1.5 h-8 bg-blue-500 rounded-t" />
                  <div className="w-1.5 h-6 bg-blue-500 rounded-t" />
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 right-4 px-2 py-1 bg-blue-500 text-white text-[8px] font-bold rounded">
              2 min
            </div>
          </div>
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-0.5">
            <div className="w-0.5 h-4 bg-zinc-400 rounded" />
            <div className="w-0.5 h-4 bg-zinc-400 rounded" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-red-500/90 text-white text-xs font-medium rounded-full">
        Word + Pain
      </div>
      <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-blue-500/90 text-white text-xs font-medium rounded-full">
        AutoLabDocs
      </div>
    </div>
  )
}
