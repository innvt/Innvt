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

// ─── H₂O molecule layout (104.5° bond angle) ────────────────────────────────
const BOND_LENGTH = 3.5;
const HALF_ANGLE = (104.5 / 2) * (Math.PI / 180); // 52.25 degrees
const O_POS = new THREE.Vector3(0, 0, 0);
const H1_POS = new THREE.Vector3(
  -Math.sin(HALF_ANGLE) * BOND_LENGTH,
  -Math.cos(HALF_ANGLE) * BOND_LENGTH,
  0
);
const H2_POS = new THREE.Vector3(
  Math.sin(HALF_ANGLE) * BOND_LENGTH,
  -Math.cos(HALF_ANGLE) * BOND_LENGTH,
  0
);

// ─── Per-atom orbit configurations ──────────────────────────────────────────
// Oxygen: 3 electron orbits (2 core red + 1 lone pair blue-violet)
const OXYGEN_ORBITS: OrbitConfig[] = [
  { a: 1.7, b: 1.3, tiltX: 0.4, tiltY: 0.0, tiltZ: 0.2, speed: 1.6, trail: 0.4 },
  { a: 2.4, b: 2.0, tiltX: -0.6, tiltY: 0.5, tiltZ: -0.3, speed: 1.1, trail: 0.5 },
];

// Oxygen: 1 lone pair orbit (blue-violet)
const OXYGEN_LONE_PAIR_ORBITS: OrbitConfig[] = [
  { a: 2.0, b: 1.2, tiltX: -1.0, tiltY: 0.0, tiltZ: 0.8, speed: 0.85, trail: 0.55 },
];

// Hydrogen: 2 orbits each (red)
const HYDROGEN_ORBITS: OrbitConfig[] = [
  { a: 1.3, b: 1.0, tiltX: 0.3, tiltY: -0.2, tiltZ: 0.1, speed: 1.4, trail: 0.35 },
  { a: 1.6, b: 1.15, tiltX: -0.5, tiltY: 0.3, tiltZ: -0.3, speed: 0.95, trail: 0.4 },
];

// ─── Nucleus component (procedural sun-like, matching CinematicAtom) ─────────
function MoleculeNucleus({
  radius,
  isOxygen,
  opacityRef,
}: {
  radius: number;
  isOxygen: boolean;
  opacityRef: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uIsOxygen: { value: isOxygen ? 1.0 : 0.0 },
  }), [isOxygen]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
    if (lightRef.current) {
      lightRef.current.intensity = opacityRef.current * (isOxygen ? 1.52 : 0.72);
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[radius, isOxygen ? 32 : 16]} />
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
            uniform float uIsOxygen;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vViewDir;

            void main() {
              float mu = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);

              vec2 w = worley3D(vPosition * 8.0 + uTime * 0.02);
              float granulation = smoothstep(0.0, 0.4, w.y - w.x);

              vec3 st = vPosition * 4.0;
              vec3 q;
              q.x = fbm(st + vec3(0.0, 0.0, uTime * 0.06), 3);
              q.y = fbm(st + vec3(5.2, 1.3, uTime * 0.06), 3);
              q.z = fbm(st + vec3(1.7, 9.2, uTime * 0.06), 3);
              float turbulence = fbm(st + q * 1.5, 3) * 0.5 + 0.5;

              float surface = mix(granulation, turbulence, 0.4);
              surface = mix(0.15, 1.0, smoothstep(0.1, 0.9, surface));

              float spotNoise = fbm(vPosition * 1.5 + uTime * 0.01, 3) * 0.5 + 0.5;
              surface *= mix(0.2, 1.0, smoothstep(0.15, 0.25, spotNoise));

              // Oxygen: warm gold tones | Hydrogen: cool blue-white tones
              vec3 centerColor = uIsOxygen > 0.5
                ? vec3(4.2, 2.72, 0.88)
                : vec3(3.0, 3.0, 3.6);
              vec3 edgeColor = uIsOxygen > 0.5
                ? vec3(1.52, 0.6, 0.12)
                : vec3(0.88, 1.0, 1.8);
              vec3 color = mix(edgeColor, centerColor, pow(mu, 0.35));
              color *= surface;
              color *= pow(mu, 0.15);

              // Clamp to prevent bloom (keep below luminanceThreshold of 1.0)
              color = min(color, vec3(3.0));

              gl_FragColor = vec4(color, uOpacity);
            }
          `}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        color={isOxygen ? '#FFF0DD' : '#E8EEFF'}
        intensity={0}
        distance={isOxygen ? 40 : 25}
        decay={2}
      />
    </group>
  );
}

// ─── Nucleus Glow Corona (billboard, matching CinematicAtom style) ───────────
function NucleusCorona({
  size,
  isOxygen,
  opacityRef,
}: {
  size: number;
  isOxygen: boolean;
  opacityRef: MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uIsOxygen: { value: isOxygen ? 1.0 : 0.0 },
  }), [isOxygen]);

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
      <planeGeometry args={[size, size]} />
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
          uniform float uIsOxygen;
          varying vec2 vUv;

          void main() {
            vec2 center = vUv - 0.5;
            float dist = length(center) * 2.0;

            float glow = 0.72 * exp(-dist * 4.5)
                       + 0.36 * exp(-dist * 2.0)
                       + 0.15 * exp(-dist * 0.8);

            vec3 noiseCoord = vec3(center * 4.0, uTime * 0.04);
            float wisps = pow(fbm(noiseCoord, 3) * 0.5 + 0.5, 2.0);
            glow += 0.06 * wisps * exp(-dist * 0.8);

            float angle = atan(center.y, center.x);
            float streaks = sin(angle * 8.0 + uTime * 0.2) * 0.5 + 0.5;
            streaks *= sin(angle * 5.0 - uTime * 0.15) * 0.5 + 0.5;
            glow += 0.04 * pow(streaks, 3.0) * exp(-dist * 0.5);

            glow *= 1.0 + 0.05 * sin(uTime * 2.0);

            vec3 coreColor = uIsOxygen > 0.5
              ? vec3(1.8, 1.52, 0.88)
              : vec3(1.52, 1.52, 1.8);
            vec3 outerColor = uIsOxygen > 0.5
              ? vec3(0.88, 0.6, 0.18)
              : vec3(0.6, 0.72, 1.2);
            vec3 color = mix(coreColor, outerColor, smoothstep(0.0, 0.5, dist));

            float alpha = glow * uOpacity;
            alpha *= smoothstep(1.0, 0.0, dist);

            // Clamp to prevent additive stacking from exceeding bloom threshold
            vec3 finalColor = min(color * glow, vec3(1.52));
            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
      />
    </mesh>
  );
}

// ─── Bond (glowing line between two nuclei) ──────────────────────────────────
function MoleculeBond({
  startRef,
  endRef,
  opacityRef,
}: {
  startRef: MutableRefObject<THREE.Vector3>;
  endRef: MutableRefObject<THREE.Vector3>;
  opacityRef: MutableRefObject<number>;
}) {
  const lineObj = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]);
    const mat = new THREE.LineBasicMaterial({
      color: '#D4A54A',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(geom, mat);
  }, []);

  useFrame(() => {
    const positions = lineObj.geometry.attributes.position as THREE.BufferAttribute;
    positions.setXYZ(0, startRef.current.x, startRef.current.y, startRef.current.z);
    positions.setXYZ(1, endRef.current.x, endRef.current.y, endRef.current.z);
    positions.needsUpdate = true;

    if (lineObj.material instanceof THREE.LineBasicMaterial) {
      lineObj.material.opacity = opacityRef.current * 0.5;
    }
  });

  return <primitive object={lineObj} />;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface MolecularNetworkProps extends SceneProps {
  molecules?: unknown[];
  nodes?: THREE.Vector3[];
  nextTransitionProgress?: number;
  nextTargets?: THREE.Vector3[];
  transitionProgressRef?: MutableRefObject<number>;
  nextTransitionProgressRef?: MutableRefObject<number>;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function MolecularNetwork({
  transitionProgress = 0,
  transitionProgressRef,
  nextTransitionProgressRef,
  nextTransitionProgress = 0,
}: MolecularNetworkProps) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);

  // Live nucleus positions (updated each frame based on spread progress)
  const oxygenPosRef = useRef(new THREE.Vector3(0, 0, 0));
  const h1PosRef = useRef(new THREE.Vector3(0, 0, 0));
  const h2PosRef = useRef(new THREE.Vector3(0, 0, 0));

  // Refs for individual nucleus groups to position them
  const oxygenGroupRef = useRef<THREE.Group>(null);
  const h1GroupRef = useRef<THREE.Group>(null);
  const h2GroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const tp = transitionProgressRef ? transitionProgressRef.current : transitionProgress;
    const ntp = nextTransitionProgressRef ? nextTransitionProgressRef.current : nextTransitionProgress;

    if (tp === 0 && ntp === 0) return;

    const time = state.clock.elapsedTime;

    // NO molecule group rotation — only individual nuclei rotate

    // Animate position from atom's y=2.2 to molecule's y=3.5 during entry
    const posProgress = Math.min(tp * 2, 1); // complete position move in first half of transition
    const easedPos = posProgress * posProgress * (3 - 2 * posProgress);
    groupRef.current.position.y = THREE.MathUtils.lerp(2.2, 3.5, easedPos);

    // Nuclei spread from center as transition progresses
    const spread = Math.min(tp * 1.5, 1);
    const easedSpread = spread * spread * (3 - 2 * spread); // smoothstep

    // Molecular breathing (subtle symmetric stretch vibration)
    const breathe = 1.0 + 0.015 * Math.sin(time * 1.5);
    const finalSpread = easedSpread * breathe;

    // Update nucleus positions
    oxygenPosRef.current.set(
      O_POS.x * finalSpread,
      O_POS.y * finalSpread,
      O_POS.z * finalSpread,
    );
    h1PosRef.current.set(
      H1_POS.x * finalSpread,
      H1_POS.y * finalSpread,
      H1_POS.z * finalSpread,
    );
    h2PosRef.current.set(
      H2_POS.x * finalSpread,
      H2_POS.y * finalSpread,
      H2_POS.z * finalSpread,
    );

    // Position nucleus groups
    if (oxygenGroupRef.current) oxygenGroupRef.current.position.copy(oxygenPosRef.current);
    if (h1GroupRef.current) h1GroupRef.current.position.copy(h1PosRef.current);
    if (h2GroupRef.current) h2GroupRef.current.position.copy(h2PosRef.current);

    // No shrink on exit — stay in place so solar system can morph from molecule
    const BASE_SCALE = 0.56;
    groupRef.current.scale.setScalar(BASE_SCALE);

    // Opacity: fade in with tp, fade out quickly with ntp (gone by ntp ~0.25)
    opacityRef.current = tp * Math.max(1 - ntp * 4, 0);
  });

  return (
    <group ref={groupRef} position={[0, 2.2, 0]} scale={0.56}>
      {/* ═══ Oxygen (center) ═══ */}
      <group ref={oxygenGroupRef}>
        <NucleusCorona size={14} isOxygen opacityRef={opacityRef} />
        <MoleculeNucleus radius={1.0} isOxygen opacityRef={opacityRef} />
        {/* Core electron orbits (red) */}
        {OXYGEN_ORBITS.map((orbit, i) => (
          <group key={`o-core-${i}`}>
            <OrbitPath config={orbit} opacityRef={opacityRef} />
            <OrbitTrail config={orbit} index={i} opacityRef={opacityRef} />
            <ProceduralElectron config={orbit} index={i} opacityRef={opacityRef} />
          </group>
        ))}
        {/* Lone pair orbits (blue-violet) */}
        {OXYGEN_LONE_PAIR_ORBITS.map((orbit, i) => (
          <group key={`o-lp-${i}`}>
            <OrbitPath config={orbit} opacityRef={opacityRef} color="#4466cc" />
            <OrbitTrail config={orbit} index={i + 10} opacityRef={opacityRef} color="#4466cc" />
            <ProceduralElectron config={orbit} index={i + 10} opacityRef={opacityRef} />
          </group>
        ))}
      </group>

      {/* ═══ Hydrogen 1 ═══ */}
      <group ref={h1GroupRef}>
        <NucleusCorona size={9} isOxygen={false} opacityRef={opacityRef} />
        <MoleculeNucleus radius={0.65} isOxygen={false} opacityRef={opacityRef} />
        {HYDROGEN_ORBITS.map((orbit, i) => (
          <group key={`h1-orbit-${i}`}>
            <OrbitPath config={orbit} opacityRef={opacityRef} />
            <OrbitTrail config={orbit} index={i + 20} opacityRef={opacityRef} />
            <ProceduralElectron config={orbit} index={i + 20} opacityRef={opacityRef} />
          </group>
        ))}
      </group>

      {/* ═══ Hydrogen 2 ═══ */}
      <group ref={h2GroupRef}>
        <NucleusCorona size={9} isOxygen={false} opacityRef={opacityRef} />
        <MoleculeNucleus radius={0.65} isOxygen={false} opacityRef={opacityRef} />
        {HYDROGEN_ORBITS.map((orbit, i) => (
          <group key={`h2-orbit-${i}`}>
            <OrbitPath config={orbit} opacityRef={opacityRef} />
            <OrbitTrail config={orbit} index={i + 30} opacityRef={opacityRef} />
            <ProceduralElectron config={orbit} index={i + 30} opacityRef={opacityRef} />
          </group>
        ))}
      </group>

      {/* ═══ Bonds ═══ */}
      <MoleculeBond startRef={oxygenPosRef} endRef={h1PosRef} opacityRef={opacityRef} />
      <MoleculeBond startRef={oxygenPosRef} endRef={h2PosRef} opacityRef={opacityRef} />

    </group>
  );
}
