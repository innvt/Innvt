/**
 * Particle Morphing System
 * 
 * Assigns 23,500 Quantum Field particles to atomic components (nucleus + electrons)
 * for smooth morphing transition instead of fade-out.
 * 
 * Scientific Accuracy:
 * - Quantum Field Theory: All particles (electrons, protons, neutrons) are excitations in quantum fields
 * - This morphing represents the transition from quantum field view to atomic structure view
 * - Each atom's components are made from quantum field particles
 */

import * as THREE from 'three';
import {
  type ElementConfig,
  calculateOrbitalRadii,
  calculateOrbitalSpeeds
} from './atomic-elements';

/**
 * Target position for a quantum particle during morphing
 */
export interface ParticleTarget {
  atomIndex: number;           // Which atom this particle belongs to
  isNucleus: boolean;          // true = nucleus, false = electron
  electronIndex?: number;      // If electron, which electron (0-based)
  targetPosition: THREE.Vector3;  // Final position in atomic structure
  orbitalRadius?: number;      // If electron, orbital radius
  orbitalSpeed?: number;       // If electron, orbital speed
  orbitalOffset?: number;      // If electron, orbital offset angle
  orbitalTilt?: number;        // If electron, orbital tilt
}

/**
 * Atom configuration for morphing
 */
export interface AtomMorphConfig {
  position: THREE.Vector3;
  element: ElementConfig;
  nucleusParticleCount: number;
  electronParticleCount: number;
  rotationOffset: number;
}

/**
 * Calculate how many particles should form each atom's nucleus
 * Based on atomic number (more protons/neutrons = more particles)
 */
function calculateNucleusParticleCount(element: ElementConfig): number {
  // Base particles per nucleus (minimum)
  const baseParticles = 50;

  // Additional particles based on atomic number
  // Heavier atoms get more particles
  const atomicNumberFactor = element.atomicNumber / 26; // Normalized to Iron (heaviest in our set)
  const additionalParticles = Math.floor(atomicNumberFactor * 100);

  return baseParticles + additionalParticles;
}

/**
 * Calculate how many particles should form each electron
 * Electrons are smaller than nucleus, so fewer particles
 */
function calculateElectronParticleCount(nucleusCount: number): number {
  // Electrons are much smaller than nucleus
  // Use about 20% of nucleus particle count per electron
  return Math.max(10, Math.floor(nucleusCount * 0.2));
}

/**
 * Calculate orbital parameters for an electron
 * USES SHARED LOGIC from atomic-elements.ts to ensure visual consistency
 */
function calculateElectronOrbital(
  shellIndex: number,
  electronIndexInShell: number,
  electronsInShell: number,
  shellConfig: number[]
): {
  radius: number;
  speed: number;
  offset: number;
  tilt: number;
} {
  // Get radii and speeds from shared source of truth
  const radii = calculateOrbitalRadii(shellConfig);
  const speeds = calculateOrbitalSpeeds(shellConfig);

  const radius = radii[shellIndex] || 0.5;
  const speed = speeds[shellIndex] || 1.0;

  // Offset angle (evenly distribute electrons in shell)
  const offset = (electronIndexInShell / electronsInShell) * Math.PI * 2;

  // Random tilt for variety
  const tilt = Math.random() * Math.PI * 0.3;

  return { radius, speed, offset, tilt };
}

/**
 * Generate random position within nucleus sphere
 */
function generateNucleusPosition(nucleusRadius: number = 0.12): THREE.Vector3 {
  // Random position within sphere
  // Matches AtomicDanceMulti nucleus size (approx 0.2-0.3 diameter -> 0.1-0.15 radius)
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.cbrt(Math.random()) * nucleusRadius; // Cubic root for uniform distribution

  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
}

/**
 * Generate position on electron orbital
 */
function generateElectronPosition(
  orbitalRadius: number,
  orbitalOffset: number,
  orbitalTilt: number,
  time: number = 0
): THREE.Vector3 {
  const angle = time + orbitalOffset;

  // Basic orbital position
  const x = orbitalRadius * Math.cos(angle);
  const z = orbitalRadius * Math.sin(angle);
  const y = Math.sin(angle * 3.0) * 0.2; // Slight vertical oscillation

  // Apply tilt (rotation around x-axis)
  const yTilted = y * Math.cos(orbitalTilt) - z * Math.sin(orbitalTilt);
  const zTilted = y * Math.sin(orbitalTilt) + z * Math.cos(orbitalTilt);

  return new THREE.Vector3(x, yTilted, zTilted);
}

/**
 * Assign quantum particles to atomic components
 * 
 * @param particleCount - Total number of quantum particles (23,500)
 * @param atoms - Array of atom configurations
 * @returns Array of particle targets (one per quantum particle)
 */
export function assignParticlesToAtoms(
  particleCount: number,
  atoms: AtomMorphConfig[]
): ParticleTarget[] {
  const targets: ParticleTarget[] = [];
  let particleIndex = 0;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[ParticleMorphing] Assigning ${particleCount} particles to ${atoms.length} atoms`);
  }

  // Calculate total particles needed for all atoms
  let totalNeeded = 0;
  const atomParticleCounts: { nucleus: number; electrons: number[] }[] = [];

  atoms.forEach((atom) => {
    const nucleusCount = calculateNucleusParticleCount(atom.element);
    const electronCount = calculateElectronParticleCount(nucleusCount);
    const electronCounts = atom.element.shellConfiguration.map(() => electronCount);

    atomParticleCounts.push({
      nucleus: nucleusCount,
      electrons: electronCounts,
    });

    totalNeeded += nucleusCount + electronCounts.reduce((sum, count) => sum + count, 0);
  });

  // Scale particle counts to match available particles
  const scaleFactor = particleCount / totalNeeded;
  if (process.env.NODE_ENV === 'development') {
    console.log(`[ParticleMorphing] Scale factor: ${scaleFactor.toFixed(3)}`);
  }

  // Assign particles to each atom
  atoms.forEach((atom, atomIndex) => {
    const counts = atomParticleCounts[atomIndex];
    const scaledNucleusCount = Math.floor(counts.nucleus * scaleFactor);

    // Assign nucleus particles
    for (let i = 0; i < scaledNucleusCount && particleIndex < particleCount; i++) {
      const localPos = generateNucleusPosition(0.18);
      const targetPosition = localPos.clone().add(atom.position);

      targets.push({
        atomIndex,
        isNucleus: true,
        targetPosition,
      });

      particleIndex++;
    }

    // Assign electron particles
    let electronGlobalIndex = 0;
    atom.element.shellConfiguration.forEach((electronsInShell, shellIndex) => {
      for (let electronInShell = 0; electronInShell < electronsInShell; electronInShell++) {
        const scaledElectronCount = Math.floor(counts.electrons[shellIndex] * scaleFactor);
        const orbital = calculateElectronOrbital(shellIndex, electronInShell, electronsInShell, atom.element.shellConfiguration);

        // Assign particles to this electron
        for (let i = 0; i < scaledElectronCount && particleIndex < particleCount; i++) {
          // Distribute particles along the orbital path
          const timeOffset = (i / scaledElectronCount) * Math.PI * 2;
          const localPos = generateElectronPosition(
            orbital.radius,
            orbital.offset,
            orbital.tilt,
            timeOffset
          );
          const targetPosition = localPos.clone().add(atom.position);

          targets.push({
            atomIndex,
            isNucleus: false,
            electronIndex: electronGlobalIndex,
            targetPosition,
            orbitalRadius: orbital.radius,
            orbitalSpeed: orbital.speed,
            orbitalOffset: orbital.offset + timeOffset,
            orbitalTilt: orbital.tilt,
          });

          particleIndex++;
        }

        electronGlobalIndex++;
      }
    });
  });

  // If we have leftover particles, assign them to random atoms' nuclei
  while (particleIndex < particleCount) {
    const randomAtomIndex = Math.floor(Math.random() * atoms.length);
    const atom = atoms[randomAtomIndex];

    const localPos = generateNucleusPosition(0.18);
    const targetPosition = localPos.clone().add(atom.position);

    targets.push({
      atomIndex: randomAtomIndex,
      isNucleus: true,
      targetPosition,
    });

    particleIndex++;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[ParticleMorphing] Assigned ${targets.length} particles`);
    const nucleusCount = targets.filter(t => t.isNucleus).length;
    console.log(`[ParticleMorphing] Nucleus particles: ${nucleusCount}`);
    console.log(`[ParticleMorphing] Electron particles: ${targets.length - nucleusCount}`);
  }

  return targets;
}

/**
 * Convert particle targets to Float32Array for shader attributes
 */
export function particleTargetsToAttributes(targets: ParticleTarget[]): {
  targetPositions: Float32Array;
  targetTypes: Float32Array;  // 0 = electron, 1 = nucleus
  orbitalRadii: Float32Array;
  orbitalSpeeds: Float32Array;
  orbitalOffsets: Float32Array;
  orbitalTilts: Float32Array;
} {
  const targetPositions = new Float32Array(targets.length * 3);
  const targetTypes = new Float32Array(targets.length);
  const orbitalRadii = new Float32Array(targets.length);
  const orbitalSpeeds = new Float32Array(targets.length);
  const orbitalOffsets = new Float32Array(targets.length);
  const orbitalTilts = new Float32Array(targets.length);

  targets.forEach((target, i) => {
    // Target position
    targetPositions[i * 3] = target.targetPosition.x;
    targetPositions[i * 3 + 1] = target.targetPosition.y;
    targetPositions[i * 3 + 2] = target.targetPosition.z;

    // Target type
    targetTypes[i] = target.isNucleus ? 1.0 : 0.0;

    // Orbital parameters (only for electrons)
    orbitalRadii[i] = target.orbitalRadius || 0.0;
    orbitalSpeeds[i] = target.orbitalSpeed || 0.0;
    orbitalOffsets[i] = target.orbitalOffset || 0.0;
    orbitalTilts[i] = target.orbitalTilt || 0.0;
  });

  return {
    targetPositions,
    targetTypes,
    orbitalRadii,
    orbitalSpeeds,
    orbitalOffsets,
    orbitalTilts,
  };
}

