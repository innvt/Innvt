'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { ScaleJourneyManager } from '@/components/scenes/ScaleJourneyManager';
import { performanceMonitor } from '@/lib/performance-monitor';
import { useGPUDetection } from '@/components/shared/GPUDetectionProvider';

/**
 * Performance Monitor Component
 * Tracks FPS and adjusts quality automatically
 */
function PerformanceMonitor() {
  useFrame((state, delta) => {
    performanceMonitor.update(delta);
  });

  return null;
}

export default function Scene() {
  const { use2DFallback, isLoading } = useGPUDetection();

  // Don't render 3D scene if using 2D fallback
  if (use2DFallback || isLoading) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance', // Request high-performance GPU
      }}
      dpr={[1, 2]} // Adaptive pixel ratio
      performance={{ min: 0.5 }} // Allow quality reduction if needed
    >
      <Suspense fallback={null}>
        {/* Performance monitoring */}
        <PerformanceMonitor />

        {/* Minimal lighting for black background aesthetic */}
        <ambientLight intensity={0.2} />

        {/* Scale Journey Manager - orchestrates all 6 scales */}
        <ScaleJourneyManager enableTransitions={true} />
      </Suspense>
    </Canvas>
  );
}

