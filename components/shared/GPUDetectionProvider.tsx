'use client';

/**
 * GPU Detection Provider
 * 
 * Initializes GPU detection on app load and provides quality settings
 * to child components via context.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { detectGPUTier, getQualitySettings, shouldUse2DFallback } from '@/lib/gpu-detection';
import type { QualitySettings } from '@/lib/gpu-detection';
import type { TierResult } from 'detect-gpu';

interface GPUDetectionContextValue {
  gpuTier: TierResult | null;
  qualitySettings: QualitySettings | null;
  isLoading: boolean;
  use2DFallback: boolean;
}

const GPUDetectionContext = createContext<GPUDetectionContextValue>({
  gpuTier: null,
  qualitySettings: null,
  isLoading: true,
  use2DFallback: false,
});

export function useGPUDetection() {
  const context = useContext(GPUDetectionContext);
  if (!context) {
    throw new Error('useGPUDetection must be used within GPUDetectionProvider');
  }
  return context;
}

interface GPUDetectionProviderProps {
  children: ReactNode;
}

export function GPUDetectionProvider({ children }: GPUDetectionProviderProps) {
  const [gpuTier, setGPUTier] = useState<TierResult | null>(null);
  const [qualitySettings, setQualitySettings] = useState<QualitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [use2DFallback, setUse2DFallback] = useState(false);

  useEffect(() => {
    async function initGPUDetection() {
      try {
        // Detect GPU tier
        const { gpuTier: tier, qualitySettings: settings } = await detectGPUTier();
        
        setGPUTier(tier);
        setQualitySettings(settings);
        setUse2DFallback(shouldUse2DFallback());
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🎮 GPU Detection Complete:', {
            tier: tier.tier,
            gpu: tier.gpu,
            isMobile: tier.isMobile,
            fps: tier.fps,
            use2DFallback: shouldUse2DFallback(),
          });
        }
      } catch (error) {
        console.error('❌ GPU detection failed:', error);
        
        // Use fallback settings
        setUse2DFallback(true);
      } finally {
        setIsLoading(false);
      }
    }

    initGPUDetection();
  }, []);

  // Listen for quality adjustment events
  useEffect(() => {
    function handleQualityAdjusted(event: Event) {
      const customEvent = event as CustomEvent;
      const { newTier, reason } = customEvent.detail;
      
      // Update quality settings
      const newSettings = getQualitySettings();
      setQualitySettings(newSettings);
      
      // Show notification to user (optional)
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎮 Quality adjusted to Tier ${newTier} (${reason})`);
      }
    }

    window.addEventListener('quality-adjusted', handleQualityAdjusted);
    
    return () => {
      window.removeEventListener('quality-adjusted', handleQualityAdjusted);
    };
  }, []);

  return (
    <GPUDetectionContext.Provider
      value={{
        gpuTier,
        qualitySettings,
        isLoading,
        use2DFallback,
      }}
    >
      {children}
    </GPUDetectionContext.Provider>
  );
}

/**
 * Loading fallback component
 */
export function GPUDetectionLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-foreground-secondary">Initializing...</p>
      </div>
    </div>
  );
}

/**
 * 2D Fallback component for devices that can't handle WebGL
 */
export function Fallback2D() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-4">
        <h2 className="text-2xl font-bold mb-4">
          <span className="gradient-text">Innvt</span>
        </h2>
        <p className="text-foreground-secondary mb-4">
          Your device doesn&apos;t support the full 3D experience.
        </p>
        <p className="text-sm text-foreground-secondary">
          For the best experience, please visit on a device with WebGL support.
        </p>
      </div>
    </div>
  );
}

