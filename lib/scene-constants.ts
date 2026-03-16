/**
 * Solar System Configuration
 * Scaled to fit within camera view at z=30 (FOV 75°).
 * Sizes exaggerated for visibility but proportionally more realistic.
 */
export interface PlanetConfig {
    name: string;
    radius: number;
    distance: number;
    speed: number;
    color: string;
    eccentricity: number;
    roughness: number;
    metalness: number;
    emissiveIntensity: number;
    rotationSpeed?: number;
    axialTilt?: number;
    oblateness?: number;
    hasRing?: boolean;
    hasAtmosphere?: boolean;
    atmosphereColor?: string;
    atmosphereThickness?: number;
    atmospherePower?: number;
    atmosphereDensity?: number;
    ringColor?: string;
}

/**
 * Orbit configuration for CinematicAtom electron orbits.
 * Each orbit defines an ellipse (a, b), tilts, speed, and trail opacity.
 */
export interface OrbitConfigEntry {
  a: number;
  b: number;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  speed: number;
  trail: number;
}

export const CINEMATIC_ORBIT_CONFIG: OrbitConfigEntry[] = [
  { a: 2.5, b: 2.0, tiltX: 0.3,  tiltY: 0.0,  tiltZ: 0.1,  speed: 1.2, trail: 0.65 },
  { a: 3.2, b: 2.8, tiltX: -0.5, tiltY: 0.4,  tiltZ: -0.2, speed: 0.9, trail: 0.6 },
  { a: 4.0, b: 3.0, tiltX: 1.2,  tiltY: -0.3, tiltZ: 0.5,  speed: 0.75, trail: 0.55 },
  { a: 3.5, b: 3.2, tiltX: -0.8, tiltY: 0.7,  tiltZ: -0.4, speed: 1.0, trail: 0.6 },
  { a: 4.5, b: 3.5, tiltX: 0.6,  tiltY: -0.6, tiltZ: 0.3,  speed: 0.65, trail: 0.5 },
];

export const SOLAR_SYSTEM_CONFIG: PlanetConfig[] = [
    // rotationSpeed scaled proportionally: Jupiter (9.9h) fastest, Venus (243d) slowest
    // Real ratios preserved: Jupiter > Saturn > Neptune > Uranus > Earth ≈ Mars >> Mercury >> Pluto >> Venus
    { name: 'Mercury', radius: 0.4, distance: 8.0, speed: 1.6, color: '#504E51', eccentricity: 0.15, roughness: 0.9, metalness: 0.1, emissiveIntensity: 0.02, rotationSpeed: 0.4 },
    { name: 'Venus', radius: 0.7, distance: 12.0, speed: 1.2, color: '#DDD8D4', eccentricity: 0.07, roughness: 0.8, metalness: 0.05, emissiveIntensity: 0.03, rotationSpeed: -0.15, hasAtmosphere: true, atmosphereColor: '#F8E2B0', atmosphereThickness: 1.18, atmospherePower: 2.0, atmosphereDensity: 0.9 },
    { name: 'Earth', radius: 0.8, distance: 17.0, speed: 1.0, color: '#4A90E2', eccentricity: 0.08, roughness: 0.7, metalness: 0.1, emissiveIntensity: 0.04, rotationSpeed: 3.0, hasAtmosphere: true, atmosphereColor: '#6BA4FF' },
    { name: 'Mars', radius: 0.55, distance: 22.0, speed: 0.8, color: '#C1440E', eccentricity: 0.12, roughness: 0.85, metalness: 0.05, emissiveIntensity: 0.02, rotationSpeed: 2.8, hasAtmosphere: true, atmosphereColor: '#D4956A', atmosphereThickness: 1.06, atmospherePower: 4.0, atmosphereDensity: 0.25 },
    { name: 'Jupiter', radius: 2.2, distance: 32.0, speed: 0.45, color: '#C88B3A', eccentricity: 0.05, roughness: 0.5, metalness: 0.2, emissiveIntensity: 0.03, rotationSpeed: 5.0, oblateness: 0.07, hasAtmosphere: true, atmosphereColor: '#C8A870', atmosphereThickness: 1.08, atmospherePower: 2.5 },
    { name: 'Saturn', radius: 1.8, distance: 42.0, speed: 0.3, color: '#E8D5A3', eccentricity: 0.05, roughness: 0.5, metalness: 0.15, emissiveIntensity: 0.03, rotationSpeed: 4.5, oblateness: 0.10, hasRing: true, hasAtmosphere: true, atmosphereColor: '#E8D5A3', atmosphereThickness: 1.08, atmospherePower: 3.0 },
    { name: 'Uranus', radius: 1.4, distance: 54.0, speed: 0.18, color: '#AFDBF5', eccentricity: 0.04, roughness: 0.6, metalness: 0.1, emissiveIntensity: 0.02, rotationSpeed: 3.5, oblateness: 0.023, axialTilt: 1.71, hasRing: true, ringColor: '#555555' },
    { name: 'Neptune', radius: 1.35, distance: 66.0, speed: 0.12, color: '#3E66F9', eccentricity: 0.03, roughness: 0.6, metalness: 0.1, emissiveIntensity: 0.02, rotationSpeed: 3.8, oblateness: 0.017, hasAtmosphere: true, atmosphereColor: '#4477FF', atmosphereThickness: 1.10, atmospherePower: 2.5 },
    { name: 'Pluto', radius: 0.25, distance: 78.0, speed: 0.08, color: '#534437', eccentricity: 0.10, roughness: 0.9, metalness: 0.05, emissiveIntensity: 0.01, rotationSpeed: 0.3, hasAtmosphere: true, atmosphereColor: '#6688CC', atmosphereThickness: 1.15, atmospherePower: 5.0, atmosphereDensity: 0.15 },
];

