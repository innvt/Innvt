'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ScaleJourneyManager } from '@/components/scenes/ScaleJourneyManager';
import { performanceMonitor } from '@/lib/performance-monitor';
import { useGPUDetection } from '@/components/shared/GPUDetectionProvider';
import { getQualitySettings } from '@/lib/gpu-detection';
import { WebGLErrorBoundary } from '@/components/shared/WebGLErrorBoundary';

/**
 * Performance Monitor Component
 * Tracks FPS and adjusts quality automatically
 */
function PerformanceMonitor() {
  useEffect(() => {
    performanceMonitor.start();
    return () => performanceMonitor.stop();
  }, []);

  useFrame((_state, delta) => {
    performanceMonitor.update(delta);
  });

  return null;
}

/**
 * Minimal loading indicator shown while GPU detection runs.
 * Sits in the fixed canvas-container layer so it doesn't shift layout.
 */
function SceneLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none">
      <div className="h-6 w-6 rounded-full border-2 border-neutral-700 border-t-neutral-400 animate-spin" />
    </div>
  );
}

export default function Scene() {
  const { use2DFallback, isLoading } = useGPUDetection();

  // Show subtle spinner while detecting GPU
  if (isLoading) {
    return <SceneLoading />;
  }

  // Don't render 3D scene if using 2D fallback
  if (use2DFallback) {
    return null;
  }

  return (
    <WebGLErrorBoundary>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          {/* Performance monitoring */}
          <PerformanceMonitor />

          {/* Minimal lighting for black background aesthetic */}
          <ambientLight intensity={0.2} />

          {/* Scale Journey Manager - orchestrates all 6 scales */}
          <ScaleJourneyManager enableTransitions={true} />

          {/* Post-processing: Bloom for sun glow and galaxy cores */}
          {getQualitySettings().enableBloom && (
            <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType}>
              <Bloom
                mipmapBlur
                luminanceThreshold={1.0}
                luminanceSmoothing={0.02}
                intensity={0.25}
                levels={4}
              />
            </EffectComposer>
          )}
        </Suspense>
      </Canvas>
    </WebGLErrorBoundary>
  );
}
