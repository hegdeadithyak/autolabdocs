"use client"

import type React from "react"
import { useEffect, useRef } from "react"

const SineWaveLoading: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameId = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const centerY = canvas.height / 2
    const numberOfWaves = 5

    interface Wave {
      amplitude: number
      frequency: number
      phaseOffset: number
      phaseSpeed: number
      opacity: number
      lineWidth: number
    }

    const waves: Wave[] = []

    // Blue-only palette
    const blueShades = [
      "59, 130, 246", // blue-500
      "96, 165, 250", // blue-400
      "37, 99, 235", // blue-600
      "147, 197, 253", // blue-300
      "29, 78, 216", // blue-700
    ]

    for (let i = 0; i < numberOfWaves; i++) {
      waves.push({
        amplitude: 30 + i * 15,
        frequency: 0.003 + i * 0.001,
        phaseOffset: (i * Math.PI) / 3,
        phaseSpeed: 0.015 - i * 0.002,
        opacity: 0.6 - i * 0.08,
        lineWidth: 2,
      })
    }

    let time = 0

    const draw = () => {
      ctx.fillStyle = "#050505"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Subtle radial gradient overlay
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
      )
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.05)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      waves.forEach((wave, i) => {
        wave.phaseOffset += wave.phaseSpeed

        ctx.beginPath()
        ctx.moveTo(0, centerY)

        for (let x = 0; x < canvas.width; x++) {
          const y =
            centerY + wave.amplitude * Math.sin(x * wave.frequency + wave.phaseOffset) * Math.sin(time * 0.5 + i)
          ctx.lineTo(x, y)
        }

        ctx.strokeStyle = `rgba(${blueShades[i % blueShades.length]}, ${wave.opacity})`
        ctx.lineWidth = wave.lineWidth
        ctx.stroke()

        // Glow effect
        ctx.shadowColor = `rgba(${blueShades[i % blueShades.length]}, 0.5)`
        ctx.shadowBlur = 20
        ctx.stroke()
        ctx.shadowBlur = 0
      })

      time += 0.02
      animationFrameId.current = requestAnimationFrame(draw)
    }

    window.addEventListener("resize", resize)
    animationFrameId.current = requestAnimationFrame(draw)

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]">
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo pulse */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.4)]">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-blue-500/30 animate-ping" />
        </div>

        {/* Text */}
        <div className="text-center">
          <h2
            className="text-2xl font-semibold text-white tracking-[-0.02em]"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, sans-serif' }}
          >
            Loading Project
          </h2>
          <p className="text-zinc-500 text-sm mt-2 tracking-[-0.01em]">Preparing your workspace...</p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-blue-500"
              style={{
                animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}

export default SineWaveLoading
export { SineWaveLoading }
