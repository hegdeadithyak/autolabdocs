import React, { useEffect, useRef } from 'react';

interface SineWaveLoadingProps {
  // No external color prop needed now, as it's full rainbow
}

interface WaveConfig {
  amplitude: number;
  frequency: number;
  phaseOffset: number;
  phaseSpeed: number;
  color: string;
  lineWidth: number;
  initialAmplitude: number;
  initialFrequency: number;
  targetAmplitude: number;
  targetFrequency: number;
  animationProgress: number;
  animationDuration: number;
  delay: number;
  startTime: number | null;
}

const SineWaveLoading: React.FC<SineWaveLoadingProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const centerY = canvas.height / 2;
    const numberOfWaves = 7; // More waves for more complexity
    const waves: WaveConfig[] = [];

    // Initialize multiple waves with varied properties
    for (let i = 0; i < numberOfWaves; i++) {
      const initialAmplitude = 20 + Math.random() * 40; // Vary initial height
      const targetAmplitude = 5 + Math.random() * 15; // Vary final height
      const initialFrequency = 0.01 + Math.random() * 0.03; // Vary initial spread
      const targetFrequency = 0.08 + Math.random() * 0.05; // Vary final spread

      waves.push({
        amplitude: initialAmplitude,
        frequency: initialFrequency,
        phaseOffset: Math.random() * Math.PI * 2, // Random start point for each wave
        phaseSpeed: 0.005 + Math.random() * 0.01, // Vary speed
        color: `hsl(${i * (360 / numberOfWaves)}, 80%, 60%)`, // Rainbow colors
        lineWidth: 1 + Math.random() * 2, // Vary thickness
        initialAmplitude,
        initialFrequency,
        targetAmplitude,
        targetFrequency,
        animationProgress: 0,
        animationDuration: 4000, // Fixed 4-second duration for each wave's internal transition
        delay: i * 150, // Stagger wave animations more subtly
        startTime: null,
      });
    }

    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    const draw = (timestamp: DOMHighResTimeStamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear entire canvas

      waves.forEach(wave => {
        if (!wave.startTime) wave.startTime = timestamp;
        
        const elapsedTime = timestamp - wave.startTime - wave.delay;
        let progress = 0;
        if (elapsedTime > 0) {
            progress = Math.min(elapsedTime / wave.animationDuration, 1);
        }

        // Loop the animation
        if (progress === 1) {
            wave.startTime = timestamp; // Reset start time
            wave.delay = 0; // No delay after the first cycle
            progress = 0; // Reset progress
            // Randomize targets for continuous subtle variation
            wave.initialAmplitude = wave.amplitude;
            wave.initialFrequency = wave.frequency;
            wave.targetAmplitude = 5 + Math.random() * 15;
            wave.targetFrequency = 0.08 + Math.random() * 0.05;
            wave.animationDuration = 5000 + Math.random() * 3000;
        }

        const easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress); // Ease in-out

        wave.amplitude = wave.initialAmplitude - (wave.initialAmplitude - wave.targetAmplitude) * easedProgress;
        wave.frequency = wave.initialFrequency + (wave.targetFrequency - wave.initialFrequency) * easedProgress;
        wave.phaseOffset += wave.phaseSpeed; // Continue phase animation

        ctx.beginPath();
        ctx.moveTo(0, centerY + wave.amplitude * Math.sin(wave.phaseOffset));

        for (let x = 0; x < canvas.width; x++) {
          const y = centerY + wave.amplitude * Math.sin(x * wave.frequency + wave.phaseOffset);
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.stroke();
      });

      animationFrameId.current = requestAnimationFrame(draw);
    };

    animationFrameId.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full block"></canvas>
      <p className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-3xl md:text-5xl font-extrabold tracking-wider animate-pulse font-sans">Loading Project...</p>
    </div>
  );
};

export default SineWaveLoading;
