/**
 * Type definitions for scale journey scenes
 */

/**
 * Scale levels in the quantum-to-cosmic journey
 */
export enum ScaleLevel {
  QUANTUM = 'quantum',
  ATOMIC = 'atomic',
  MOLECULAR = 'molecular',
  SOLAR = 'solar',
  GALACTIC = 'galactic',
  COSMIC = 'cosmic',
}

/**
 * Props for individual scene components
 */
export interface SceneProps {
  particleCount: number;
  isActive: boolean;
  transitionProgress?: number;
}

/**
 * Scene metadata
 */
export interface SceneMetadata {
  id: ScaleLevel;
  name: string;
  description: string;
  scientificScale: string;
  targetParticleCount: {
    tier0: number;
    tier1: number;
    tier2: number;
    tier3: number;
  };
  estimatedLoadTime: number; // in milliseconds
}

/**
 * Scene manager state
 */
export interface SceneManagerState {
  currentScale: ScaleLevel;
  previousScale: ScaleLevel | null;
  transitionProgress: number;
  isTransitioning: boolean;
}

/**
 * Transition configuration
 */
export interface TransitionConfig {
  duration: number; // in seconds
  ease: string; // GSAP easing function
  morphParticles: boolean;
  cameraAnimation: boolean;
}

