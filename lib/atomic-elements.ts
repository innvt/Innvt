/**
 * Chemical Element Configurations for Atomic Dance Scene
 * 
 * Defines visual properties and electron configurations for 9 different elements
 * Used to create a diverse, colorful multi-atom field
 */

export interface ElementConfig {
  symbol: string;
  name: string;
  atomicNumber: number;
  electronCount: number;
  shellConfiguration: number[];  // Electrons per shell [inner, middle, outer, ...]
  nucleusColor: string;
  electronColor: string;
  glowColor: string;
  weight: number;  // Distribution weight (higher = more common)
}

/**
 * Element Configurations
 * Based on CPK (Corey-Pauling-Koltun) coloring standard
 * Colors are HEAVILY desaturated (70% reduction) for subtle, professional appearance
 * Almost grayscale with just a hint of color
 */
export const ELEMENT_CONFIGS: Record<string, ElementConfig> = {
  // Common Elements (70% distribution) - Life-building blocks
  hydrogen: {
    symbol: 'H',
    name: 'Hydrogen',
    atomicNumber: 1,
    electronCount: 1,
    shellConfiguration: [1],
    nucleusColor: '#E8E8E8',  // Pure gray (no saturation needed)
    electronColor: '#C0C0C0',  // Pure gray
    glowColor: '#D0D0D0',      // Pure gray
    weight: 25,  // Most common
  },

  carbon: {
    symbol: 'C',
    name: 'Carbon',
    atomicNumber: 6,
    electronCount: 6,
    shellConfiguration: [2, 4],
    nucleusColor: '#505050',  // Pure dark gray (no saturation needed)
    electronColor: '#606060',  // Pure gray
    glowColor: '#707070',      // Pure gray
    weight: 20,
  },

  nitrogen: {
    symbol: 'N',
    name: 'Nitrogen',
    atomicNumber: 7,
    electronCount: 7,
    shellConfiguration: [2, 5],
    nucleusColor: '#5A5F6E',  // 70% desaturated dark blue (was #3050F8)
    electronColor: '#6A6F7E',  // 70% desaturated blue
    glowColor: '#7A7F8E',      // 70% desaturated blue glow
    weight: 15,
  },

  oxygen: {
    symbol: 'O',
    name: 'Oxygen',
    atomicNumber: 8,
    electronCount: 8,
    shellConfiguration: [2, 6],
    nucleusColor: '#6E5A5A',  // 70% desaturated dark red (was #C01010)
    electronColor: '#7E6A6A',  // 70% desaturated red
    glowColor: '#8E7A7A',      // 70% desaturated red glow
    weight: 20,
  },

  // Noble Gases (15% distribution) - Stable, glowing
  helium: {
    symbol: 'He',
    name: 'Helium',
    atomicNumber: 2,
    electronCount: 2,
    shellConfiguration: [2],
    nucleusColor: '#E8F2F2',  // 70% desaturated pale cyan (was #D9FFFF)
    electronColor: '#D8E2E2',  // 70% desaturated cyan
    glowColor: '#E0EAEA',      // 70% desaturated cyan glow
    weight: 8,
  },

  neon: {
    symbol: 'Ne',
    name: 'Neon',
    atomicNumber: 10,
    electronCount: 10,
    shellConfiguration: [2, 8],
    nucleusColor: '#8E6E7E',  // 70% desaturated deep pink (was #FF1493)
    electronColor: '#9E7E8E',  // 70% desaturated pink
    glowColor: '#AE8E9E',      // 70% desaturated pink glow
    weight: 7,
  },

  // Metals (15% distribution) - Variety
  lithium: {
    symbol: 'Li',
    name: 'Lithium',
    atomicNumber: 3,
    electronCount: 3,
    shellConfiguration: [2, 1],
    nucleusColor: '#8E7E9E',  // 70% desaturated violet (was #CC80FF)
    electronColor: '#9E8EAE',  // 70% desaturated violet
    glowColor: '#AE9EBE',      // 70% desaturated violet glow
    weight: 3,
  },

  sodium: {
    symbol: 'Na',
    name: 'Sodium',
    atomicNumber: 11,
    electronCount: 11,
    shellConfiguration: [2, 8, 1],
    nucleusColor: '#7E6E8E',  // 70% desaturated purple (was #AB5CF2)
    electronColor: '#8E7E9E',  // 70% desaturated purple
    glowColor: '#9E8EAE',      // 70% desaturated purple glow
    weight: 3,
  },

  iron: {
    symbol: 'Fe',
    name: 'Iron',
    atomicNumber: 26,
    electronCount: 26,
    shellConfiguration: [2, 8, 14, 2],  // Simplified for visualization
    nucleusColor: '#8E7A6E',  // 70% desaturated orange (was #E06633)
    electronColor: '#9E8A7E',  // 70% desaturated orange
    glowColor: '#AE9A8E',      // 70% desaturated orange glow
    weight: 4,
  },
};

/**
 * Get a random element based on distribution weights
 */
export function getRandomElement(): ElementConfig {
  const elements = Object.values(ELEMENT_CONFIGS);
  const totalWeight = elements.reduce((sum, el) => sum + el.weight, 0);
  
  let random = Math.random() * totalWeight;
  
  for (const element of elements) {
    random -= element.weight;
    if (random <= 0) {
      return element;
    }
  }
  
  // Fallback to hydrogen
  return ELEMENT_CONFIGS.hydrogen;
}

/**
 * Atom Position in 3D space
 */
export interface AtomPosition {
  x: number;
  y: number;
  z: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  element: ElementConfig;
  rotationOffset: number;  // Random rotation offset for variety
}

/**
 * Generate atom positions distributed in 3D space
 * 
 * @param count - Number of atoms to generate
 * @param spaceSize - Size of the 3D space (atoms distributed in -spaceSize to +spaceSize)
 * @returns Array of atom positions with velocities
 */
export function generateAtomPositions(count: number, spaceSize: number = 50): AtomPosition[] {
  const positions: AtomPosition[] = [];
  
  for (let i = 0; i < count; i++) {
    const element = getRandomElement();
    
    // Random position in 3D space
    const x = (Math.random() - 0.5) * spaceSize * 2;
    const y = (Math.random() - 0.5) * spaceSize * 2;
    const z = (Math.random() - 0.5) * spaceSize * 2;
    
    // Slow, organic velocity (similar to quantum field motion)
    const velocityX = (Math.random() - 0.5) * 0.02;  // Very slow movement
    const velocityY = (Math.random() - 0.5) * 0.02;
    const velocityZ = (Math.random() - 0.5) * 0.02;
    
    // Random rotation offset for visual variety
    const rotationOffset = Math.random() * Math.PI * 2;
    
    positions.push({
      x,
      y,
      z,
      velocityX,
      velocityY,
      velocityZ,
      element,
      rotationOffset,
    });
  }
  
  return positions;
}

/**
 * Calculate orbital radii based on shell configuration
 *
 * FIX: Reduced orbital radii to make electrons visible
 * - Nucleus radius: 0.12 units
 * - First shell: 0.5 units (4.2x nucleus radius - scientifically reasonable)
 * - Each shell: 0.4 units further out
 * - Results: [0.5, 0.9, 1.3, 1.7] for shells 1-4
 *
 * @param shellConfig - Array of electron counts per shell
 * @returns Array of orbital radii
 */
export function calculateOrbitalRadii(shellConfig: number[]): number[] {
  const baseRadius = 0.5;      // First shell at 0.5 units (was 2.0 - 4x closer)
  const radiusIncrement = 0.4; // Each shell 0.4 units further (was 1.5 - 3.75x closer)

  return shellConfig.map((_, index) => baseRadius + (index * radiusIncrement));
}

/**
 * Calculate orbital speeds (inner shells faster, outer shells slower)
 * 
 * @param shellConfig - Array of electron counts per shell
 * @returns Array of orbital speeds
 */
export function calculateOrbitalSpeeds(shellConfig: number[]): number[] {
  const baseSpeed = 1.0;
  const speedDecrement = 0.3;
  
  return shellConfig.map((_, index) => Math.max(0.3, baseSpeed - (index * speedDecrement)));
}

/**
 * Tier-based atom counts
 */
export const ATOM_COUNTS_BY_TIER: Record<number, number> = {
  0: 0,      // Tier 0: Fallback (no WebGL)
  1: 75,     // Tier 1: Low-end (50-100 range)
  2: 250,    // Tier 2: Mid-range (200-300 range)
  3: 750,    // Tier 3: High-end (500-1,000 range)
};

/**
 * Get atom count for a given GPU tier
 */
export function getAtomCountForTier(tier: number): number {
  return ATOM_COUNTS_BY_TIER[tier] || 0;
}

