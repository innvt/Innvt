'use client';

/**
 * Scale Journey Manager
 * 
 * Orchestrates the quantum-to-cosmic scale journey animation.
 * Manages transitions between 6 scale levels based on scroll position.
 */

import { useRef, useEffect, useState, Suspense } from 'react';
import { useThree } from '@react-three/fiber';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { ScaleLevel, SceneManagerState } from './types';
import { getQualitySettings } from '@/lib/gpu-detection';
import { QuantumField } from './QuantumField';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, useGSAP);

// Lazy load remaining scenes for code splitting
// We'll implement these in subsequent steps
// import { AtomicDance } from './AtomicDance';
// import { MolecularNetwork } from './MolecularNetwork';
// import { OrbitalHarmony } from './OrbitalHarmony';
// import { GalacticExpanse } from './GalacticExpanse';
// import { CosmicWeb } from './CosmicWeb';

interface ScaleJourneyManagerProps {
  enableTransitions?: boolean;
}

export function ScaleJourneyManager({ enableTransitions = true }: ScaleJourneyManagerProps) {
  const { camera } = useThree();
  const sceneGroupRefs = useRef<Record<ScaleLevel, THREE.Group | null>>({
    [ScaleLevel.QUANTUM]: null,
    [ScaleLevel.ATOMIC]: null,
    [ScaleLevel.MOLECULAR]: null,
    [ScaleLevel.SOLAR]: null,
    [ScaleLevel.GALACTIC]: null,
    [ScaleLevel.COSMIC]: null,
  });

  const [state, setState] = useState<SceneManagerState>({
    currentScale: ScaleLevel.QUANTUM,
    previousScale: null,
    transitionProgress: 0,
    isTransitioning: false,
  });

  const qualitySettings = getQualitySettings();

  // Set up scroll-based scene transitions
  useGSAP(() => {
    if (!enableTransitions) return;

    // Scene 1: Quantum Field (Hero Section)
    const quantumTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top bottom', // Start immediately when hero enters viewport
        end: 'bottom top',
        scrub: true,
        onEnter: () => {
          setState(prev => ({
            ...prev,
            currentScale: ScaleLevel.QUANTUM,
            previousScale: prev.currentScale,
          }));
        },
      },
    });

    quantumTimeline
      .to(camera.position, { z: 10, duration: 1 }, 0) // Start zooming out immediately from z:5 to z:10
      .to(
        sceneGroupRefs.current[ScaleLevel.QUANTUM]?.scale || {},
        { x: 1, y: 1, z: 1, duration: 0.3 },
        0
      )
      .to(
        sceneGroupRefs.current[ScaleLevel.QUANTUM]?.scale || {},
        { x: 0, y: 0, z: 0, duration: 0.5 },
        0.5
      );

    // Scene 2: Atomic Dance (Phase 1 - Genesis)
    const atomicTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#phase-1',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onEnter: () => {
          setState(prev => ({
            ...prev,
            currentScale: ScaleLevel.ATOMIC,
            previousScale: prev.currentScale,
          }));
        },
      },
    });

    atomicTimeline
      .fromTo(
        sceneGroupRefs.current[ScaleLevel.ATOMIC]?.scale || {},
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.3 }
      )
      .to(camera.position, { z: 10, duration: 0.5 })
      .to(
        sceneGroupRefs.current[ScaleLevel.ATOMIC]?.scale || {},
        { x: 0, y: 0, z: 0, duration: 0.3 },
        0.7
      );

    // Scene 3: Molecular Network (Phase 2 - Cultivation)
    const molecularTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#phase-2',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onEnter: () => {
          setState(prev => ({
            ...prev,
            currentScale: ScaleLevel.MOLECULAR,
            previousScale: prev.currentScale,
          }));
        },
      },
    });

    molecularTimeline
      .fromTo(
        sceneGroupRefs.current[ScaleLevel.MOLECULAR]?.scale || {},
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.3 }
      )
      .to(camera.position, { z: 15, duration: 0.5 })
      .to(
        sceneGroupRefs.current[ScaleLevel.MOLECULAR]?.scale || {},
        { x: 0, y: 0, z: 0, duration: 0.3 },
        0.7
      );

    // Scene 4: Orbital Harmony (Phase 3 - Symbiosis)
    const solarTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#phase-3',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onEnter: () => {
          setState(prev => ({
            ...prev,
            currentScale: ScaleLevel.SOLAR,
            previousScale: prev.currentScale,
          }));
        },
      },
    });

    solarTimeline
      .fromTo(
        sceneGroupRefs.current[ScaleLevel.SOLAR]?.scale || {},
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.3 }
      )
      .to(camera.position, { z: 30, duration: 0.5 })
      .to(
        sceneGroupRefs.current[ScaleLevel.SOLAR]?.scale || {},
        { x: 0, y: 0, z: 0, duration: 0.3 },
        0.7
      );

    // Scene 5: Galactic Expanse (Phase 4 - Horizon)
    const galacticTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#phase-4',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onEnter: () => {
          setState(prev => ({
            ...prev,
            currentScale: ScaleLevel.GALACTIC,
            previousScale: prev.currentScale,
          }));
        },
      },
    });

    galacticTimeline
      .fromTo(
        sceneGroupRefs.current[ScaleLevel.GALACTIC]?.scale || {},
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.3 }
      )
      .to(camera.position, { z: 50, duration: 0.5 })
      .to(
        sceneGroupRefs.current[ScaleLevel.GALACTIC]?.scale || {},
        { x: 0, y: 0, z: 0, duration: 0.3 },
        0.7
      );

    // Scene 6: Cosmic Web (Final)
    const cosmicTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#phase-5',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onEnter: () => {
          setState(prev => ({
            ...prev,
            currentScale: ScaleLevel.COSMIC,
            previousScale: prev.currentScale,
          }));
        },
      },
    });

    cosmicTimeline
      .fromTo(
        sceneGroupRefs.current[ScaleLevel.COSMIC]?.scale || {},
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 1, z: 1, duration: 0.3 }
      )
      .to(camera.position, { z: 100, duration: 0.5 });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [camera, enableTransitions]);

  // Log current scale (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🌌 Current Scale:', state.currentScale);
    }
  }, [state.currentScale]);

  return (
    <>
      {/* Scene 1: Quantum Field */}
      <group
        ref={el => {
          sceneGroupRefs.current[ScaleLevel.QUANTUM] = el;
        }}
        scale={[1, 1, 1]}
        visible={true}
      >
        <Suspense fallback={null}>
          <QuantumField
            particleCount={qualitySettings.particleCount.quantum}
            isActive={state.currentScale === ScaleLevel.QUANTUM}
          />
        </Suspense>
      </group>

      {/* Scene 2: Atomic Dance */}
      <group
        ref={el => {
          sceneGroupRefs.current[ScaleLevel.ATOMIC] = el;
        }}
        scale={[0, 0, 0]}
        visible={false}
      >
        <Suspense fallback={null}>
          {/* Placeholder removed - will be implemented in Week 2 */}
        </Suspense>
      </group>

      {/* Scene 3: Molecular Network */}
      <group
        ref={el => {
          sceneGroupRefs.current[ScaleLevel.MOLECULAR] = el;
        }}
        scale={[0, 0, 0]}
        visible={false}
      >
        <Suspense fallback={null}>
          {/* Placeholder removed - will be implemented in Week 3 */}
        </Suspense>
      </group>

      {/* Scene 4: Orbital Harmony */}
      <group
        ref={el => {
          sceneGroupRefs.current[ScaleLevel.SOLAR] = el;
        }}
        scale={[0, 0, 0]}
        visible={false}
      >
        <Suspense fallback={null}>
          {/* Placeholder removed - will be implemented in Week 4 */}
        </Suspense>
      </group>

      {/* Scene 5: Galactic Expanse */}
      <group
        ref={el => {
          sceneGroupRefs.current[ScaleLevel.GALACTIC] = el;
        }}
        scale={[0, 0, 0]}
        visible={false}
      >
        <Suspense fallback={null}>
          {/* Placeholder removed - will be implemented in Week 5 */}
        </Suspense>
      </group>

      {/* Scene 6: Cosmic Web */}
      <group
        ref={el => {
          sceneGroupRefs.current[ScaleLevel.COSMIC] = el;
        }}
        scale={[0, 0, 0]}
        visible={false}
      >
        <Suspense fallback={null}>
          {/* Placeholder removed - will be implemented in Week 6 */}
        </Suspense>
      </group>
    </>
  );
}

