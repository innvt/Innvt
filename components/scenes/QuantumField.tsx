'use client';

/**
 * Quantum Field - Scale 1
 * 
 * High-performance particle system representing the quantum realm.
 * Uses GPU-based curl noise for organic, swirling particle motion.
 * 
 * SIMPLIFIED APPROACH (No FBO):
 * - Direct BufferGeometry with 3D position attributes
 * - Curl noise calculated in vertex shader on GPU
 * - Much better performance than FBO approach
 * - Achieves 60 FPS with 50,000 particles on M1 Max
 */

import { useRef, useMemo, useEffect, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneProps } from './types';
import { curlNoise } from '@/lib/shaders/noise.glsl';

/**
 * Particle Material with GPU-based Curl Noise
 * All animation happens in the vertex shader for maximum performance
 */
class QuantumParticleMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 1.3923 },        // Increased by 20%: 1.16025 * 1.2 = 1.3923
        uViewportWidth: { value: typeof window !== 'undefined' ? window.innerWidth : 1920 }, // Viewport width for responsive scaling
        uPixelRatio: { value: 1.0 },     // Always 1.0 - ignore device pixel ratio, use CSS pixels only
        uNoiseScale: { value: 0.15 },    // Smooth motion
        uNoiseSpeed: { value: 0.05 },    // Slow, calmer motion
        uNoiseStrength: { value: 0.7 },  // Gentle displacement
        uTransitionProgress: { value: 0 }, // 0 = fully visible, 1 = transitioned away
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        uniform float uViewportWidth;
        uniform float uPixelRatio;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        uniform float uNoiseStrength;
        uniform float uTransitionProgress;

        attribute vec3 aInitialPosition;
        attribute float aRandomOffset;

        // Morph target attributes (optional)
        attribute vec3 aTargetPosition;
        attribute float aTargetType;  // 0 = electron, 1 = nucleus
        attribute float aOrbitalRadius;
        attribute float aOrbitalSpeed;
        attribute float aOrbitalOffset;
        attribute float aOrbitalTilt;

        varying vec3 vPosition;
        varying float vDistance;
        varying float vRandomOffset;
        varying float vTransitionProgress;
        varying float vTargetType;

        ${curlNoise}

        void main() {
          // Start from initial position
          vec3 pos = aInitialPosition;

          // Add curl noise displacement over time
          vec3 noiseInput = pos * uNoiseScale + uTime * uNoiseSpeed + aRandomOffset;
          vec3 displacement = curlNoise(noiseInput) * uNoiseStrength;

          pos += displacement;

          // No position morph — particles stay in place and fade out

          vPosition = pos;
          vRandomOffset = aRandomOffset;
          vTransitionProgress = uTransitionProgress;
          vTargetType = aTargetType;

          // Transform to view space
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          vDistance = length(mvPosition.xyz);

          // Responsive particle size - scales with viewport width
          // Reference: 1920px viewport = 1.0x scale
          // Smaller screens get proportionally smaller particles
          // Larger screens get proportionally larger particles
          float viewportScale = uViewportWidth / 1920.0;
          float responsiveSize = uSize * viewportScale;

          gl_PointSize = responsiveSize * (50.0 / -mvPosition.z);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
            uniform float uTime;
            uniform float uPixelRatio;

            varying vec3 vPosition;
            varying float vDistance;
            varying float vRandomOffset;
            varying float vTransitionProgress;
            varying float vTargetType;

            void main() {
              // Create circular particle shape
              vec2 center = gl_PointCoord - 0.5;
              float dist = length(center);

              // Discard pixels outside circle
              if (dist > 0.5) discard;

              // --- QUANTUM MODE (Blue/Purple) ---
              // MAXIMUM SHARPNESS - 30% sharper edges
              float alphaQuantum = 1.0 - smoothstep(0.0, 0.35, dist);
              alphaQuantum = pow(alphaQuantum, 9.1);

              // Quantum-inspired color gradient (blue to purple)
              float colorMix = (vPosition.z * 0.05 + 0.5 + vRandomOffset * 0.2);
              colorMix = clamp(colorMix, 0.0, 1.0);

              vec3 colorQuantum = mix(vec3(0.4, 0.7, 1.0), vec3(0.7, 0.4, 1.0), colorMix);
              colorQuantum *= 2.145; // Boost brightness

              // Add strong white core
              float coreWhite = 1.0 - smoothstep(0.0, 0.25, dist);
              coreWhite = pow(coreWhite, 2.0);
              colorQuantum = mix(colorQuantum, vec3(1.0), coreWhite * 0.85);

              // Add subtle pulsing
              float pulse = sin(uTime * 2.0 + vRandomOffset * 10.0) * 0.1 + 0.9;
              colorQuantum *= pulse;

              // Distance-based opacity
              float distanceFade = 1.0 - smoothstep(10.0, 50.0, vDistance);
              alphaQuantum *= distanceFade;


              // --- FADE OUT during transition (no morph to atomic) ---
              float fadeOut = 1.0 - smoothstep(0.0, 0.8, vTransitionProgress);
              float finalAlpha = alphaQuantum * 0.468 * fadeOut;

              gl_FragColor = vec4(colorQuantum, finalAlpha);
            }
          `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
  }
}

interface QuantumFieldProps extends SceneProps {
  transitionProgress?: number;  // 0 = fully visible, 1 = transitioned to next scale
  transitionProgressRef?: MutableRefObject<number>;
  morphTargets?: {
    targetPositions: Float32Array;
    targetTypes: Float32Array;
    orbitalRadii: Float32Array;
    orbitalSpeeds: Float32Array;
    orbitalOffsets: Float32Array;
    orbitalTilts: Float32Array;
  };
}

export function QuantumField({ particleCount, isActive: _isActive, transitionProgress = 0, transitionProgressRef, morphTargets }: QuantumFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Create geometry with initial positions and random offsets
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const initialPositions = new Float32Array(particleCount * 3);
    const randomOffsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Random positions in a MUCH LARGER sphere (20 instead of 8)
      // This spreads particles out to reduce density
      const radius = Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      // Set both position and initial position
      positions[i3 + 0] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      initialPositions[i3 + 0] = x;
      initialPositions[i3 + 1] = y;
      initialPositions[i3 + 2] = z;

      // Random offset for variation
      randomOffsets[i] = Math.random() * 10.0;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aInitialPosition', new THREE.BufferAttribute(initialPositions, 3));
    geo.setAttribute('aRandomOffset', new THREE.BufferAttribute(randomOffsets, 1));

    return geo;
  }, [particleCount]);

  // Create material
  const material = useMemo(() => new QuantumParticleMaterial(), []);

  // Set morph target attributes when provided
  useEffect(() => {
    if (!morphTargets || !geometry) return;

    console.log('[QuantumField] Setting morph targets for particle morphing');

    geometry.setAttribute('aTargetPosition', new THREE.BufferAttribute(morphTargets.targetPositions, 3));
    geometry.setAttribute('aTargetType', new THREE.BufferAttribute(morphTargets.targetTypes, 1));
    geometry.setAttribute('aOrbitalRadius', new THREE.BufferAttribute(morphTargets.orbitalRadii, 1));
    geometry.setAttribute('aOrbitalSpeed', new THREE.BufferAttribute(morphTargets.orbitalSpeeds, 1));
    geometry.setAttribute('aOrbitalOffset', new THREE.BufferAttribute(morphTargets.orbitalOffsets, 1));
    geometry.setAttribute('aOrbitalTilt', new THREE.BufferAttribute(morphTargets.orbitalTilts, 1));
  }, [morphTargets, geometry]);

  // Keep uPixelRatio at 1.0 - we ignore device pixel ratio and use CSS pixels only
  // This ensures consistent rendering based on window size, not display type
  useEffect(() => {
    if (!material) return;

    // Always set to 1.0 to ignore DPR
    if (material.uniforms.uPixelRatio) {
      material.uniforms.uPixelRatio.value = 1.0;
    }
  }, [material]);

  // Update viewport width on resize for responsive particle sizing
  useEffect(() => {
    if (typeof window === 'undefined' || !material) return;

    const updateViewportWidth = () => {
      if (material.uniforms.uViewportWidth) {
        material.uniforms.uViewportWidth.value = window.innerWidth;
      }
    };

    // Initial update
    updateViewportWidth();

    // Listen for window resize
    window.addEventListener('resize', updateViewportWidth);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
    };
  }, [material]);

  // Animation loop - ALWAYS animate, regardless of isActive
  useFrame((state) => {
    if (!material) return;

    const time = state.clock.elapsedTime;
    material.uniforms.uTime.value = time;

    // Read live transition progress from ref (avoids stale closure from missing re-renders)
    const tp = transitionProgressRef ? transitionProgressRef.current : transitionProgress;
    material.uniforms.uTransitionProgress.value = tp;
  });

  // Cleanup geometry and material on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}
