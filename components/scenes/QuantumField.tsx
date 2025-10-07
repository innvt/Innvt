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

import { useRef, useMemo, useEffect } from 'react';
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
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSize;
        uniform float uViewportWidth;
        uniform float uPixelRatio;
        uniform float uNoiseScale;
        uniform float uNoiseSpeed;
        uniform float uNoiseStrength;

        attribute vec3 aInitialPosition;
        attribute float aRandomOffset;

        varying vec3 vPosition;
        varying float vDistance;
        varying float vRandomOffset;

        ${curlNoise}

        void main() {
          // Start from initial position
          vec3 pos = aInitialPosition;

          // Add curl noise displacement over time
          vec3 noiseInput = pos * uNoiseScale + uTime * uNoiseSpeed + aRandomOffset;
          vec3 displacement = curlNoise(noiseInput) * uNoiseStrength;

          pos += displacement;

          vPosition = pos;
          vRandomOffset = aRandomOffset;

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

        void main() {
          // Create circular particle shape
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);

          // Discard pixels outside circle
          if (dist > 0.5) discard;

          // MAXIMUM SHARPNESS - 30% sharper edges
          float alpha = 1.0 - smoothstep(0.0, 0.35, dist); // Even tighter range (0.38 * 0.92 ≈ 0.35)
          alpha = pow(alpha, 9.1); // 30% higher power: 7.0 * 1.3 = 9.1

          // Quantum-inspired color gradient (blue to purple)
          float colorMix = (vPosition.z * 0.05 + 0.5 + vRandomOffset * 0.2);
          colorMix = clamp(colorMix, 0.0, 1.0);

          // Vibrant blue and purple base colors
          vec3 color1 = vec3(0.4, 0.7, 1.0);   // Bright blue
          vec3 color2 = vec3(0.7, 0.4, 1.0);   // Bright purple
          vec3 color = mix(color1, color2, colorMix);

          // Boost brightness FIRST - 30% brighter
          color *= 2.145; // 30% increase: 1.65 * 1.3 = 2.145

          // THEN add strong white core (after brightness, to avoid overflow)
          float coreWhite = 1.0 - smoothstep(0.0, 0.25, dist); // Larger core: 25% of particle
          coreWhite = pow(coreWhite, 2.0); // Moderate falloff for smooth gradient
          color = mix(color, vec3(1.0), coreWhite * 0.85); // Mix 85% white for strong core

          // Add subtle pulsing
          float pulse = sin(uTime * 2.0 + vRandomOffset * 10.0) * 0.1 + 0.9;
          color *= pulse;

          // Distance-based opacity (extended range for larger sphere)
          float distanceFade = 1.0 - smoothstep(10.0, 50.0, vDistance);
          alpha *= distanceFade;

          // Base opacity: 0.468 for brighter particles (0.36 * 1.3 = 0.468, 30% brighter)
          // Additive blending naturally handles particle overlap
          // No manual DPR compensation needed - renderer handles it
          gl_FragColor = vec4(color, alpha * 0.468);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    });
  }
}

export function QuantumField({ particleCount, isActive }: SceneProps) {
  const materialRef = useRef<QuantumParticleMaterial>(null);
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
  });

  // Cleanup
  useMemo(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
  );
}
