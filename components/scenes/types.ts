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


