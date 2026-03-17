'use client';

/**
 * Scale Journey Manager
 *
 * Orchestrates the quantum-to-cosmic scale journey animation.
 * Each DOM section (#hero, #evolution, #phase-1 … #phase-4, #belief-section)
 * has its own ScrollTrigger that drives the corresponding 3D scene transition.
 *
 * Scene mapping:
 *   Hero / Evolution → QuantumField → CinematicAtom
 *   Phase 1 → CinematicAtom (atom)
 *   Phase 2 → MolecularNetwork (molecules from fusing atoms)
 *   Phase 3 → OrbitalHarmony (solar system)
 *   Phase 4 → GalacticExpanse (galaxy)
 *   Belief → GalacticExpanse continues (cosmic zoom-out, galaxy becomes dot among many)
 *
 * All transition state is ref-based — no React re-renders during scroll.
 */

import { useRef, Suspense, useMemo, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { ScaleLevel } from './types';
import { getQualitySettings } from '@/lib/gpu-detection';
import {
  assignParticlesToAtoms,
  particleTargetsToAttributes,
  type AtomMorphConfig,
} from '@/lib/particle-morphing';
import { generateAtomPositions } from '@/lib/atomic-elements';
import { QuantumField } from './QuantumField';
import CinematicAtom from './CinematicAtom';
import MolecularNetwork from './MolecularNetwork';
import OrbitalHarmony from './OrbitalHarmony';
import GalacticExpanse from './GalacticExpanse';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

interface ScaleJourneyManagerProps {
  enableTransitions?: boolean;
}

export function ScaleJourneyManager({ enableTransitions = true }: ScaleJourneyManagerProps) {
  const { camera } = useThree();

  // Scene group refs for imperative visibility updates
  const quantumGroupRef = useRef<THREE.Group>(null);
  const atomicGroupRef = useRef<THREE.Group>(null);
  const molecularGroupRef = useRef<THREE.Group>(null);
  const solarGroupRef = useRef<THREE.Group>(null);
  const galacticGroupRef = useRef<THREE.Group>(null);

  const currentScaleRef = useRef<ScaleLevel>(ScaleLevel.QUANTUM);

  // Per-scene transition refs — children read these in useFrame for live values
  const quantumMorphRef = useRef(0);      // QuantumField morph progress (0=quantum, 1=atomic)
  const atomicTransRef = useRef(0);       // CinematicAtom entry
  const atomicNextRef = useRef(0);        // CinematicAtom exit → molecular
  const molecularTransRef = useRef(0);    // MolecularNetwork entry
  const molecularNextRef = useRef(0);     // MolecularNetwork exit → solar
  const solarTransRef = useRef(0);        // OrbitalHarmony entry
  const solarNextRef = useRef(0);         // OrbitalHarmony exit → galactic
  const galacticTransRef = useRef(0);     // GalacticExpanse entry
  const galacticNextRef = useRef(0);      // GalacticExpanse cosmic zoom-out (0=galaxy view, 1=cosmic web)

  // Camera z target ref — updated by ScrollTriggers, applied smoothly in useFrame
  const cameraZRef = useRef(5);

  const qualitySettings = getQualitySettings();

  // Generate morph targets for particle morphing (Quantum Field → Atomic Dance)
  const { quantumToAtomicAttributes } = useMemo(() => {
    const atomPositions = generateAtomPositions(qualitySettings.atomCount, 30);
    const atoms: AtomMorphConfig[] = atomPositions.map(atomPos => ({
      position: new THREE.Vector3(atomPos.x, atomPos.y, atomPos.z),
      element: atomPos.element,
      nucleusParticleCount: 0,
      electronParticleCount: 0,
      rotationOffset: atomPos.rotationOffset,
    }));
    const particleTargets = assignParticlesToAtoms(
      qualitySettings.particleCount.quantum,
      atoms
    );
    return { quantumToAtomicAttributes: particleTargetsToAttributes(particleTargets) };
  }, [qualitySettings.particleCount.quantum, qualitySettings.atomCount]);

  // Re-create ScrollTriggers when Lenis re-initializes (e.g. after back navigation)
  const [triggerKey, setTriggerKey] = useState(0);
  useEffect(() => {
    const handler = () => setTriggerKey(k => k + 1);
    window.addEventListener('lenis-ready', handler);
    return () => window.removeEventListener('lenis-ready', handler);
  }, []);

  // Set up per-section ScrollTriggers
  const createScrollTriggers = useCallback(() => {
    if (!enableTransitions) return;

    // Hero section: QuantumField visible, camera zooms 5 → 10
    ScrollTrigger.create({
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        cameraZRef.current = 5 + self.progress * 5;
      },
    });

    // Evolution intro: Quantum → Atomic crossfade
    ScrollTrigger.create({
      trigger: '#evolution',
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        quantumMorphRef.current = p;
        atomicTransRef.current = Math.min(p / 0.5, 1);
        cameraZRef.current = 10;
      },
    });

    // Phase 1: Atomic scene fully visible, camera at 10
    ScrollTrigger.create({
      trigger: '#phase-1',
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onUpdate: () => {
        cameraZRef.current = 10;
      },
    });

    // Phase 1 → Phase 2: Atomic → Molecular crossfade
    ScrollTrigger.create({
      trigger: '#phase-2',
      start: 'top bottom',
      end: 'top center',
      scrub: true,
      onUpdate: (self) => {
        atomicNextRef.current = self.progress;
        molecularTransRef.current = self.progress;
      },
    });

    // Phase 2: Molecular scene fully visible, camera at 12 (single molecule, closer)
    ScrollTrigger.create({
      trigger: '#phase-2',
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onUpdate: () => {
        cameraZRef.current = 12;
      },
    });

    // Phase 2 → Phase 3: Molecular → Solar crossfade
    ScrollTrigger.create({
      trigger: '#phase-3',
      start: 'top bottom',
      end: 'top center',
      scrub: true,
      onUpdate: (self) => {
        molecularNextRef.current = self.progress;
        solarTransRef.current = self.progress;
      },
    });

    // Phase 3: Solar scene fully visible, camera at 20
    ScrollTrigger.create({
      trigger: '#phase-3',
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onUpdate: () => {
        cameraZRef.current = 20;
      },
    });

    // Phase 3 → Phase 4: Solar → Galactic morph (no camera zoom during morph)
    // Solar system stays in place and fades out, galaxy grows from sun position
    ScrollTrigger.create({
      trigger: '#phase-4',
      start: 'top bottom',
      end: 'top center',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        // Solar system fades out — stays in place (no shrink), matches earlier transitions
        solarNextRef.current = p;
        // Galaxy grows from sun position
        galacticTransRef.current = p;
        // Camera stays at solar distance during morph, then starts gentle zoom-out
        // Only begin zoom after morph is mostly done (p > 0.6)
        const zoomPhase = Math.max((p - 0.6) / 0.4, 0);
        const ease = zoomPhase * zoomPhase * (3 - 2 * zoomPhase);
        cameraZRef.current = 20 + ease * 20; // 20 → 40 (gentle start)
      },
    });

    // Phase 4: Galactic scene fully visible, cinematic zoom-out to see full galaxy
    ScrollTrigger.create({
      trigger: '#phase-4',
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onUpdate: (self) => {
        // Continue zoom-out from 40 → 70 as user scrolls through Phase 4
        const ease = self.progress * self.progress * (3 - 2 * self.progress);
        cameraZRef.current = 40 + ease * 30;
      },
    });

    // Phase 4 → Belief: Galaxy shrinks + cosmic web appears
    // Galaxy scale shrinks to dot, distant galaxies + filaments fade in
    ScrollTrigger.create({
      trigger: '#belief-section',
      start: 'top bottom',
      end: 'top center',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        galacticNextRef.current = p;
        // Gentle camera pull-back (galaxy shrink does most visual work)
        const ease = p * p * (3 - 2 * p);
        cameraZRef.current = 70 - ease * 20; // 70 → 50
      },
    });

    // Belief: Tree view settled, camera at 50
    ScrollTrigger.create({
      trigger: '#belief-section',
      start: 'top center',
      end: 'bottom center',
      scrub: true,
      onUpdate: () => {
        cameraZRef.current = 50;
      },
    });
  }, [enableTransitions]);

  // Create and clean up ScrollTriggers
  useEffect(() => {
    createScrollTriggers();
    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [triggerKey, createScrollTriggers]);

  // useFrame: update camera + group visibility from refs
  useFrame(() => {
    // Smooth camera z — faster lerp for large deltas (cosmic zoom)
    const delta = Math.abs(cameraZRef.current - camera.position.z);
    const lerpSpeed = delta > 50 ? 0.15 : 0.1;
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, cameraZRef.current, lerpSpeed);

    const qm = quantumMorphRef.current;
    const at = atomicTransRef.current;
    const an = atomicNextRef.current;
    const mt = molecularTransRef.current;
    const mn = molecularNextRef.current;
    const st = solarTransRef.current;
    const sn = solarNextRef.current;
    const gt = galacticTransRef.current;

    // Update group visibility imperatively
    if (quantumGroupRef.current) {
      quantumGroupRef.current.visible = qm < 1;
    }
    if (atomicGroupRef.current) {
      atomicGroupRef.current.visible = at > 0 && an < 1;
    }
    if (molecularGroupRef.current) {
      molecularGroupRef.current.visible = mt > 0 && mn < 1;
    }
    if (solarGroupRef.current) {
      solarGroupRef.current.visible = st > 0 && sn < 1;
    }
    if (galacticGroupRef.current) {
      // Galaxy stays visible throughout belief section (no longer gated by gn < 1)
      galacticGroupRef.current.visible = gt > 0;
    }
  });

  return (
    <>
      {/* Scene 1: Quantum Field */}
      <group ref={quantumGroupRef}>
        <Suspense fallback={null}>
          <QuantumField
            particleCount={qualitySettings.particleCount.quantum}
            isActive={currentScaleRef.current === ScaleLevel.QUANTUM}
            transitionProgress={0}
            transitionProgressRef={quantumMorphRef}
            morphTargets={quantumToAtomicAttributes}
          />
        </Suspense>
      </group>

      {/* Scene 2: Cinematic Atom (Phase 1 "Genesis") */}
      <group ref={atomicGroupRef}>
        <Suspense fallback={null}>
          <CinematicAtom
            particleCount={qualitySettings.particleCount.quantum}
            isActive={currentScaleRef.current === ScaleLevel.ATOMIC}
            transitionProgress={0}
            transitionProgressRef={atomicTransRef}
            nextTransitionProgressRef={atomicNextRef}
            nextTransitionProgress={0}
          />
        </Suspense>
      </group>

      {/* Scene 3: Molecular Network (Phase 2 "Cultivation") */}
      <group ref={molecularGroupRef}>
        <Suspense fallback={null}>
          <MolecularNetwork
            particleCount={qualitySettings.particleCount.quantum}
            isActive={currentScaleRef.current === ScaleLevel.MOLECULAR}
            transitionProgress={0}
            transitionProgressRef={molecularTransRef}
            nextTransitionProgressRef={molecularNextRef}
            nextTransitionProgress={0}
          />
        </Suspense>
      </group>

      {/* Scene 4: Orbital Harmony (Phase 3 "Symbiosis") */}
      <group ref={solarGroupRef}>
        <Suspense fallback={null}>
          <OrbitalHarmony
            particleCount={qualitySettings.particleCount.quantum}
            isActive={currentScaleRef.current === ScaleLevel.SOLAR}
            transitionProgress={0}
            transitionProgressRef={solarTransRef}
            nextTransitionProgressRef={solarNextRef}
            nextTransitionProgress={0}
          />
        </Suspense>
      </group>

      {/* Scene 5: Galactic Expanse (Phase 4 "Horizon" + Belief "Cosmic Web") */}
      <group ref={galacticGroupRef}>
        <Suspense fallback={null}>
          <GalacticExpanse
            particleCount={qualitySettings.particleCount.quantum}
            isActive={currentScaleRef.current === ScaleLevel.GALACTIC}
            transitionProgress={0}
            transitionProgressRef={galacticTransRef}
            nextTransitionProgressRef={galacticNextRef}
            nextTransitionProgress={0}
          />
        </Suspense>
      </group>
    </>
  );
}
