'use client';

import { useRef, useMemo, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneProps } from './types';
import {
  NOISE_GLSL,
  type OrbitConfig,
  OrbitTrail,
  OrbitPath,
  ProceduralElectron,
} from '@/lib/orbital-components';

interface CinematicAtomProps extends SceneProps {
  gpuTier?: number;
  nextTransitionProgress?: number;
  transitionProgressRef?: MutableRefObject<number>;
  nextTransitionProgressRef?: MutableRefObject<number>;
  molecularNodes?: THREE.Vector3[];
}

// ─── Orbit Configuration ────────────────────────────────────────────────────
const ORBIT_CONFIG: OrbitConfig[] = [
  { a: 2.5, b: 2.0, tiltX: 0.3,  tiltY: 0.0,  tiltZ: 0.1,  speed: 1.2, trail: 0.65 },
  { a: 3.2, b: 2.8, tiltX: -0.5, tiltY: 0.4,  tiltZ: -0.2, speed: 0.9, trail: 0.6 },
  { a: 4.0, b: 3.0, tiltX: 1.2,  tiltY: -0.3, tiltZ: 0.5,  speed: 0.75, trail: 0.55 },
  { a: 3.5, b: 3.2, tiltX: -0.8, tiltY: 0.7,  tiltZ: -0.4, speed: 1.0, trail: 0.6 },
  { a: 4.5, b: 3.5, tiltX: 0.6,  tiltY: -0.6, tiltZ: 0.3,  speed: 0.65, trail: 0.5 },
];

// ─── Nucleus Glow Corona (Billboard with wisps + streaks) ───────────────────
function NucleusGlow({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
  }), []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.quaternion.copy(state.camera.quaternion);
    }
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh ref={meshRef} renderOrder={2}>
      <planeGeometry args={[14, 14]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          varying vec2 vUv;

          void main() {
            vec2 center = vUv - 0.5;
            float dist = length(center) * 2.0;

            // Multi-layer exponential glow — softer decay for full 360° coverage
            float glow = 0.8 * exp(-dist * 4.0)
                       + 0.5 * exp(-dist * 1.8)
                       + 0.25 * exp(-dist * 0.6);

            // Animated wisps (from SunCorona pattern)
            vec3 noiseCoord = vec3(center * 4.0, uTime * 0.04);
            float wisps = pow(fbm(noiseCoord, 3) * 0.5 + 0.5, 2.0);
            glow += 0.06 * wisps * exp(-dist * 0.8);

            // Angular streaks / rays (from SunCorona)
            float angle = atan(center.y, center.x);
            float streaks = sin(angle * 8.0 + uTime * 0.2) * 0.5 + 0.5;
            streaks *= sin(angle * 5.0 - uTime * 0.15) * 0.5 + 0.5;
            glow += 0.03 * pow(streaks, 3.0) * exp(-dist * 0.5);

            // Subtle pulsing
            glow *= 1.0 + 0.05 * sin(uTime * 2.0);

            // Color: white-gold center to gold edges
            vec3 coreColor = vec3(1.0, 0.98, 0.9);
            vec3 goldColor = vec3(0.83, 0.69, 0.22);
            vec3 color = mix(coreColor, goldColor, smoothstep(0.0, 0.5, dist));

            float alpha = glow * uOpacity;
            // Gradual fade to edges — full 360° coverage
            alpha *= smoothstep(1.2, 0.0, dist);

            gl_FragColor = vec4(color * glow, alpha);
          }
        `}
      />
    </mesh>
  );
}

// ─── Procedural Nucleus (Sun-like icosahedron with Worley + FBM) ────────────
function ProceduralNucleus({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
    if (lightRef.current) {
      lightRef.current.intensity = opacityRef.current * 3.0;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.35, 32]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          toneMapped={false}
          uniforms={uniforms}
          vertexShader={`
            ${NOISE_GLSL}
            uniform float uTime;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vViewDir;
            void main() {
              vPosition = position;
              vNormal = normalize(normalMatrix * normal);
              vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
              vViewDir = normalize(-mvPos.xyz);
              // FBM displacement for roiling surface
              float disp1 = fbm(position * 3.0 + uTime * 0.1, 3) * 0.04;
              float disp2 = fbm(position * 6.0 - uTime * 0.08, 2) * 0.015;
              vec3 newPosition = position + normal * (disp1 + disp2);
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
          `}
          fragmentShader={`
            ${NOISE_GLSL}
            uniform float uTime;
            uniform float uOpacity;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vViewDir;

            void main() {
              float mu = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);

              // Worley granulation
              vec2 w = worley3D(vPosition * 8.0 + uTime * 0.02);
              float granulation = smoothstep(0.0, 0.4, w.y - w.x);

              // FBM turbulence
              vec3 st = vPosition * 4.0;
              vec3 q;
              q.x = fbm(st + vec3(0.0, 0.0, uTime * 0.06), 3);
              q.y = fbm(st + vec3(5.2, 1.3, uTime * 0.06), 3);
              q.z = fbm(st + vec3(1.7, 9.2, uTime * 0.06), 3);
              float turbulence = fbm(st + q * 1.5, 3) * 0.5 + 0.5;

              float surface = mix(granulation, turbulence, 0.4);
              surface = mix(0.15, 1.0, smoothstep(0.1, 0.9, surface));

              // Sunspot darkening
              float spotNoise = fbm(vPosition * 1.5 + uTime * 0.01, 3) * 0.5 + 0.5;
              surface *= mix(0.2, 1.0, smoothstep(0.15, 0.25, spotNoise));

              // Color: HDR white-gold center → gold edge (limb darkening)
              vec3 centerColor = vec3(4.0, 2.5, 1.0);
              vec3 edgeColor = vec3(1.2, 0.5, 0.08);
              vec3 color = mix(edgeColor, centerColor, pow(mu, 0.35));
              color *= surface;
              color *= pow(mu, 0.15);

              gl_FragColor = vec4(color, uOpacity);
            }
          `}
        />
      </mesh>

      {/* Point light for nucleus illumination */}
      <pointLight
        ref={lightRef}
        color="#FFF0DD"
        intensity={0}
        distance={30}
        decay={2}
      />
    </group>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CinematicAtom({
  particleCount: _particleCount,
  isActive: _isActive,
  transitionProgress = 1,
  transitionProgressRef,
  nextTransitionProgressRef,
  gpuTier: _gpuTier,
  nextTransitionProgress = 0,
  molecularNodes: _molecularNodes,
}: CinematicAtomProps) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);

  const BASE_SCALE = 0.56;
  useFrame(() => {
    if (!groupRef.current) return;
    const tp = transitionProgressRef ? transitionProgressRef.current : transitionProgress;
    const ntp = nextTransitionProgressRef ? nextTransitionProgressRef.current : nextTransitionProgress;
    if (tp === 0 && ntp === 0) return;
    // No shrink on exit — stay in place so molecule can morph from atom
    groupRef.current.scale.setScalar(BASE_SCALE);
    opacityRef.current = tp * Math.max(1 - ntp * 1.5, 0);
  });

  return (
    <group ref={groupRef} position={[0, 2.2, 0]} scale={0.56}>
      {/* Nucleus glow corona */}
      <NucleusGlow opacityRef={opacityRef} />

      {/* Procedural nucleus (Sun-like) */}
      <ProceduralNucleus opacityRef={opacityRef} />

      {/* Orbit paths, trails, and electrons */}
      {ORBIT_CONFIG.map((orbit, i) => (
        <group key={i}>
          <OrbitPath config={orbit} opacityRef={opacityRef} />
          <OrbitTrail config={orbit} index={i} opacityRef={opacityRef} />
          <ProceduralElectron config={orbit} index={i} opacityRef={opacityRef} />
        </group>
      ))}
    </group>
  );
}
