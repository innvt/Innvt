/**
 * GPU Detection and Quality Tier System
 * 
 * Uses detect-gpu to classify device capabilities into tiers (0-3)
 * and provides quality settings for each tier.
 */

import { getGPUTier, TierResult } from 'detect-gpu';

export type QualityTier = 0 | 1 | 2 | 3;

export interface QualitySettings {
  tier: QualityTier;
  particleCount: {
    quantum: number;
    atomic: number;
    molecular: number;
    solar: number;
    galactic: number;
    cosmic: number;
  };
  atomCount: number;  // Number of atoms for multi-atom atomic scene
  postProcessing: boolean;
  shadowQuality: 'none' | 'low' | 'medium' | 'high';
  particleSize: 'small' | 'medium' | 'large';
  useWebGL: boolean;
  use2DFallback: boolean;
  maxFPS: number;
  enableBloom: boolean;
  enableGlow: boolean;
  shaderComplexity: 'low' | 'medium' | 'high';
}

/**
 * Quality settings for each GPU tier
 */
const QUALITY_PRESETS: Record<QualityTier, QualitySettings> = {
  // Tier 0: Fallback (no WebGL or very low-end)
  0: {
    tier: 0,
    particleCount: {
      quantum: 0,
      atomic: 0,
      molecular: 0,
      solar: 0,
      galactic: 0,
      cosmic: 0,
    },
    atomCount: 0,  // No atoms for fallback
    postProcessing: false,
    shadowQuality: 'none',
    particleSize: 'small',
    useWebGL: false,
    use2DFallback: true,
    maxFPS: 30,
    enableBloom: false,
    enableGlow: false,
    shaderComplexity: 'low',
  },

  // Tier 1: Low-end (15-30 FPS target)
  1: {
    tier: 1,
    particleCount: {
      quantum: 15000,      // Increased by 5000 more (was 10000)
      atomic: 10,
      molecular: 100,
      solar: 10,
      galactic: 10000,
      cosmic: 5000,
    },
    atomCount: 75,  // 50-100 range for Tier 1
    postProcessing: false,
    shadowQuality: 'none',
    particleSize: 'small',
    useWebGL: true,
    use2DFallback: false,
    maxFPS: 30,
    enableBloom: false,
    enableGlow: true,
    shaderComplexity: 'low',
  },

  // Tier 2: Mid-range (30-60 FPS target)
  2: {
    tier: 2,
    particleCount: {
      quantum: 40000,      // Increased by 5000 more (was 35000)
      atomic: 10,
      molecular: 200,
      solar: 15,
      galactic: 50000,
      cosmic: 30000,
    },
    atomCount: 250,  // 200-300 range for Tier 2
    postProcessing: false,
    shadowQuality: 'low',
    particleSize: 'medium',
    useWebGL: true,
    use2DFallback: false,
    maxFPS: 60,
    enableBloom: true,
    enableGlow: true,
    shaderComplexity: 'medium',
  },

  // Tier 3: High-end (60+ FPS target)
  3: {
    tier: 3,
    particleCount: {
      quantum: 50000,
      atomic: 10,
      molecular: 500,
      solar: 20,
      galactic: 100000,
      cosmic: 50000,
    },
    atomCount: 750,  // 500-1,000 range for Tier 3
    postProcessing: true,
    shadowQuality: 'high',
    particleSize: 'large',
    useWebGL: true,
    use2DFallback: false,
    maxFPS: 60,
    enableBloom: true,
    enableGlow: true,
    shaderComplexity: 'high',
  },
};

/**
 * Cached GPU tier result to avoid multiple detections
 */
let cachedGPUTier: TierResult | null = null;
let cachedQualitySettings: QualitySettings | null = null;

/**
 * Detect GPU tier and return quality settings
 */
export async function detectGPUTier(): Promise<{
  gpuTier: TierResult;
  qualitySettings: QualitySettings;
}> {
  // Return cached result if available
  if (cachedGPUTier && cachedQualitySettings) {
    return {
      gpuTier: cachedGPUTier,
      qualitySettings: cachedQualitySettings,
    };
  }

  try {
    // Detect GPU tier
    const gpuTier = await getGPUTier();
    
    // Get quality settings based on tier
    const tier = Math.min(3, Math.max(0, gpuTier.tier)) as QualityTier;
    const qualitySettings = QUALITY_PRESETS[tier];

    // Cache results
    cachedGPUTier = gpuTier;
    cachedQualitySettings = qualitySettings;

    // Log detection results (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('🎮 GPU Detection Results:', {
        tier: gpuTier.tier,
        type: gpuTier.type,
        isMobile: gpuTier.isMobile,
        fps: gpuTier.fps,
        gpu: gpuTier.gpu,
        qualitySettings: {
          particleCount: qualitySettings.particleCount,
          postProcessing: qualitySettings.postProcessing,
          shaderComplexity: qualitySettings.shaderComplexity,
        },
      });
    }

    return { gpuTier, qualitySettings };
  } catch (error) {
    console.error('❌ GPU detection failed, using fallback settings:', error);
    
    // Fallback to Tier 1 (safe default)
    const fallbackSettings = QUALITY_PRESETS[1];
    
    return {
      gpuTier: {
        tier: 1,
        type: 'FALLBACK',
        isMobile: false,
        fps: 30,
        gpu: 'unknown',
      },
      qualitySettings: fallbackSettings,
    };
  }
}

/**
 * Get cached quality settings (must call detectGPUTier first)
 */
export function getQualitySettings(): QualitySettings {
  if (!cachedQualitySettings) {
    console.warn('⚠️ Quality settings not initialized. Using Tier 1 fallback.');
    return QUALITY_PRESETS[1];
  }
  return cachedQualitySettings;
}

/**
 * Override quality settings (for testing or manual adjustment)
 */
export function setQualityTier(tier: QualityTier): void {
  cachedQualitySettings = QUALITY_PRESETS[tier];
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎮 Quality tier manually set to: ${tier}`);
  }
}

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * Check if 2D fallback should be used
 */
export function shouldUse2DFallback(): boolean {
  const settings = getQualitySettings();
  return settings.use2DFallback || !isWebGLSupported();
}

