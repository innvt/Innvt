'use client';

import { useRef, useMemo, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneProps } from './types';

interface GalacticExpanseProps extends SceneProps {
  galaxyNodes?: THREE.Vector3[];
  nextTransitionProgress?: number;
  nextTargets?: THREE.Vector3[];
  transitionProgressRef?: MutableRefObject<number>;
  nextTransitionProgressRef?: MutableRefObject<number>;
}

// Seeded RNG for deterministic generation
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Generate a point along a line segment with perpendicular noise
function pointOnEdge(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
  noise: number,
  rand: () => number,
): [number, number, number] {
  const x = a[0] + (b[0] - a[0]) * t;
  const y = a[1] + (b[1] - a[1]) * t;
  const z = a[2] + (b[2] - a[2]) * t;

  // Perpendicular offset in xz plane
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = (rand() - 0.5) * noise;
  const zOffset = (rand() - 0.5) * noise;

  return [x + nx * offset, y + ny * offset, z + zOffset];
}

export default function GalacticExpanse({
  particleCount: _particleCount,
  isActive: _isActive,
  transitionProgress = 0,
  transitionProgressRef,
  nextTransitionProgressRef,
  galaxyNodes: _galaxyNodes = [],
  nextTransitionProgress = 0,
  nextTargets: _nextTargets = [],
}: GalacticExpanseProps) {
  const groupRef = useRef<THREE.Group>(null);
  const galaxyGroupRef = useRef<THREE.Group>(null);

  const diskMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const coreMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const dustMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const starsMaterialRef = useRef<THREE.ShaderMaterial>(null);

  // ─── Spiral Disk Particles ───────────────────────────────────────────────
  const diskData = useMemo(() => {
    const count = Math.max(_particleCount, 50000);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const rnd = new Float32Array(count);

    const arms = 2;
    const galaxyRadius = 35.0;
    const windFactor = 2.5;

    const colorCore = new THREE.Color('#FFF4D6');
    const colorGold = new THREE.Color('#D4A54A');
    const colorRed = new THREE.Color('#CC4422');
    const colorBlue = new THREE.Color('#3355BB');

    for (let i = 0; i < count; i++) {
      const rawR = Math.random();
      const r = Math.pow(rawR, 0.6) * galaxyRadius;

      const armIndex = i % arms;
      const baseAngle = (armIndex / arms) * Math.PI * 2;
      const spinAngle = r * windFactor / galaxyRadius * Math.PI * 4;

      const isInterArm = Math.random() < 0.6;
      let scatter: number;
      if (isInterArm) {
        scatter = Math.random() * Math.PI * 2;
      } else {
        const armSpread = 0.4 + 1.0 * (r / galaxyRadius);
        scatter = (Math.pow(Math.random(), 1.5) * (Math.random() < 0.5 ? 1 : -1)) * armSpread;
      }

      const angle = isInterArm ? scatter : baseAngle + spinAngle + scatter;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      const diskThickness = 0.2 + 2.0 * Math.exp(-r / 6);
      const y = (Math.random() - 0.5) * diskThickness * Math.pow(Math.random(), 0.5);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const t = r / galaxyRadius;
      let mixedColor: THREE.Color;
      if (t < 0.1) {
        mixedColor = colorCore.clone().lerp(colorGold, t / 0.1);
      } else if (t < 0.3) {
        mixedColor = colorGold.clone().lerp(colorRed, (t - 0.1) / 0.2);
      } else if (t < 0.6) {
        mixedColor = colorRed.clone().lerp(colorBlue, (t - 0.3) / 0.3);
      } else {
        mixedColor = colorBlue.clone().lerp(new THREE.Color('#1A2A66'), (t - 0.6) / 0.4);
      }
      const dimFactor = isInterArm ? 0.7 : 1.0;
      const colorVar = (0.9 + Math.random() * 0.2) * dimFactor;
      col[i * 3] = mixedColor.r * colorVar;
      col[i * 3 + 1] = mixedColor.g * colorVar;
      col[i * 3 + 2] = mixedColor.b * colorVar;

      const baseSize = t < 0.15
        ? 3.0 + Math.random() * 3.0
        : (isInterArm ? 0.4 + Math.random() * 1.0 : 0.8 + Math.random() * 2.0);
      siz[i] = baseSize * (1 - t * 0.2);
      rnd[i] = Math.random();
    }

    return { pos, col, siz, rnd, count };
  }, [_particleCount]);

  // ─── Tree Morph Targets (abstract geometric tree) ─────────────────────────
  const treeData = useMemo(() => {
    const count = diskData.count;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const rand = mulberry32(999);

    // Rounded deciduous tree — outline only, drawn from galaxy dots
    // Canopy: larger ellipsoid dome, particles only on surface shell
    const canopyCenterY = -4;
    const canopyRadiusX = 16;   // wider horizontal spread
    const canopyRadiusY = 13;   // taller
    const canopyRadiusZ = 14;   // deeper

    // Trunk: tapered outline only (surface of cylinder)
    const trunkBaseY = -22;
    const trunkTopY = -12;
    const trunkBaseWidth = 2.0;
    const trunkTopWidth = 1.2;

    // Colors
    const greens = [
      new THREE.Color('#1E4D2B'),
      new THREE.Color('#2D5A27'),
      new THREE.Color('#3B7A33'),
      new THREE.Color('#4A9A3F'),
      new THREE.Color('#367A2E'),
    ];
    const lightGreen = new THREE.Color('#6BBF59');
    const goldHighlight = new THREE.Color('#C8A84A');
    const browns = [
      new THREE.Color('#5C3A1E'),
      new THREE.Color('#7A4E2A'),
      new THREE.Color('#6B4423'),
    ];

    // Particle allocation — all outline, no fill
    const canopyShellCount = Math.floor(count * 0.82); // surface shell only
    const trunkCount = Math.floor(count * 0.18);

    let idx = 0;

    // ── Canopy shell particles (on the ellipsoid surface only) ──
    for (let p = 0; p < canopyShellCount && idx < count; p++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(1 - 2 * rand());
      const yNorm = Math.cos(phi);

      // Dome shape — skip bottom portion
      if (yNorm < -0.25) {
        const theta2 = rand() * Math.PI * 2;
        const phi2 = Math.acos(1 - rand() * 1.25);
        // Thin shell noise — particles sit right on the surface
        const r = 1.0 + (rand() - 0.5) * 0.06;
        pos[idx * 3] = Math.sin(phi2) * Math.cos(theta2) * canopyRadiusX * r;
        pos[idx * 3 + 1] = Math.cos(phi2) * canopyRadiusY * r + canopyCenterY;
        pos[idx * 3 + 2] = Math.sin(phi2) * Math.sin(theta2) * canopyRadiusZ * r;
      } else {
        const r = 1.0 + (rand() - 0.5) * 0.06;
        pos[idx * 3] = Math.sin(phi) * Math.cos(theta) * canopyRadiusX * r;
        pos[idx * 3 + 1] = yNorm * canopyRadiusY * r + canopyCenterY;
        pos[idx * 3 + 2] = Math.sin(phi) * Math.sin(theta) * canopyRadiusZ * r;
      }

      // Color varies by height
      const heightFrac = (pos[idx * 3 + 1] - (canopyCenterY - canopyRadiusY)) / (canopyRadiusY * 2);
      const green = greens[Math.floor(rand() * greens.length)];
      const c = green.clone();
      if (heightFrac > 0.85) {
        c.lerp(goldHighlight, rand() * 0.4);
      } else if (heightFrac > 0.6) {
        c.lerp(lightGreen, rand() * 0.3);
      }
      const bright = 0.7 + rand() * 0.3;
      col[idx * 3] = c.r * bright;
      col[idx * 3 + 1] = c.g * bright;
      col[idx * 3 + 2] = c.b * bright;
      idx++;
    }

    // ── Trunk particles (surface of tapered cylinder only) ──
    for (let p = 0; p < trunkCount && idx < count; p++) {
      const t = rand(); // 0=base, 1=top
      const y = trunkBaseY + t * (trunkTopY - trunkBaseY);
      const width = trunkBaseWidth + t * (trunkTopWidth - trunkBaseWidth);

      // Slight organic curve
      const curveOffset = Math.sin(t * Math.PI) * 0.4;

      // Surface only — particles on the cylinder edge
      const angle = rand() * Math.PI * 2;
      const r = width * (0.95 + rand() * 0.05);
      pos[idx * 3] = Math.cos(angle) * r + curveOffset;
      pos[idx * 3 + 1] = y;
      pos[idx * 3 + 2] = Math.sin(angle) * r;

      const brown = browns[Math.floor(rand() * browns.length)];
      const bright = 0.5 + rand() * 0.4;
      col[idx * 3] = brown.r * bright;
      col[idx * 3 + 1] = brown.g * bright;
      col[idx * 3 + 2] = brown.b * bright;
      idx++;
    }

    // Fill any remaining on canopy shell
    while (idx < count) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(1 - rand() * 1.25);
      pos[idx * 3] = Math.sin(phi) * Math.cos(theta) * canopyRadiusX;
      pos[idx * 3 + 1] = Math.cos(phi) * canopyRadiusY + canopyCenterY;
      pos[idx * 3 + 2] = Math.sin(phi) * Math.sin(theta) * canopyRadiusZ;
      const green = greens[0];
      col[idx * 3] = green.r * 0.6;
      col[idx * 3 + 1] = green.g * 0.6;
      col[idx * 3 + 2] = green.b * 0.6;
      idx++;
    }

    return { pos, col };
  }, [diskData.count]);

  // ─── Bright Core Particles ──────────────────────────────────────────────
  const coreData = useMemo(() => {
    const count = 8000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    const coreColor = new THREE.Color('#FFF0C8');
    const warmColor = new THREE.Color('#FFBA50');

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 2.0) * 10.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3;
      pos[i * 3 + 2] = r * Math.cos(phi);

      const t = r / 10.0;
      const c = coreColor.clone().lerp(warmColor, t);
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      siz[i] = (1 - t) * 4.0 + Math.random() * 2.0;
    }

    return { pos, col, siz, count };
  }, []);

  // ─── Dust Lane Particles ────────────────────────────────────────────────
  const dustData = useMemo(() => {
    const count = 4000;
    const pos = new Float32Array(count * 3);
    const siz = new Float32Array(count);

    const galaxyRadius = 45.0;
    const arms = 2;

    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 0.6) * galaxyRadius * 0.7;
      const armIndex = i % arms;
      const baseAngle = (armIndex / arms) * Math.PI * 2;
      const spinAngle = r * 1.8 / galaxyRadius * Math.PI * 4;
      const offset = 0.3 + Math.random() * 0.2;
      const angle = baseAngle + spinAngle + offset;

      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = Math.sin(angle) * r;

      siz[i] = 2.0 + Math.random() * 3.0;
    }

    return { pos, siz, count };
  }, []);

  // ─── Background Stars ─────────────────────────────────────────────────
  const starsData = useMemo(() => {
    const count = 8000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const siz = new Float32Array(count);
    const rnd = new Float32Array(count);

    const starColors = [
      new THREE.Color('#FFFFFF'),
      new THREE.Color('#FFE4C4'),
      new THREE.Color('#FFD2A1'),
      new THREE.Color('#FFB870'),
      new THREE.Color('#FF8866'),
      new THREE.Color('#AACCFF'),
      new THREE.Color('#88AAFF'),
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 40 + Math.random() * 160;

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const colorIndex = Math.random() < 0.6
        ? Math.floor(Math.random() * 3)
        : Math.floor(Math.random() * starColors.length);
      const c = starColors[colorIndex];
      const brightness = 0.6 + Math.random() * 0.4;
      col[i * 3] = c.r * brightness;
      col[i * 3 + 1] = c.g * brightness;
      col[i * 3 + 2] = c.b * brightness;

      const roll = Math.random();
      if (roll < 0.10) {
        siz[i] = 1.5 + Math.random() * 2.5;
      } else {
        siz[i] = 0.4 + Math.random() * 1.0;
      }
      rnd[i] = Math.random();
    }

    return { pos, col, siz, rnd, count };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const tp = transitionProgressRef ? transitionProgressRef.current : transitionProgress;
    const ntp = nextTransitionProgressRef ? nextTransitionProgressRef.current : nextTransitionProgress;
    if (tp === 0 && ntp === 0) return;

    const time = state.clock.elapsedTime;

    // Root group position drift (galaxy entry morph)
    const driftPhase = Math.max((tp - 0.5) / 0.5, 0);
    const driftEase = driftPhase * driftPhase * (3 - 2 * driftPhase);
    groupRef.current.position.y = THREE.MathUtils.lerp(8, 22, driftEase);

    const morphProgress = tp;
    const ntpEased = ntp * ntp * (3 - 2 * ntp);

    // ── Remove galaxy tilt during tree morph ──
    if (galaxyGroupRef.current) {
      const tiltFade = 1 - ntpEased;
      galaxyGroupRef.current.rotation.x = 0.45 * tiltFade;
      galaxyGroupRef.current.rotation.y = 0.3 * tiltFade;
      galaxyGroupRef.current.rotation.z = 0.1 * tiltFade;
    }

    // Galaxy opacity stays for disk (particles morph), core/dust fade out
    const galaxyOpacity = tp;

    if (diskMaterialRef.current) {
      diskMaterialRef.current.uniforms.uTime.value = time;
      diskMaterialRef.current.uniforms.uOpacity.value = galaxyOpacity;
      diskMaterialRef.current.uniforms.uMorphProgress.value = morphProgress;
      diskMaterialRef.current.uniforms.uTreeMorph.value = ntp;
    }
    if (coreMaterialRef.current) {
      coreMaterialRef.current.uniforms.uTime.value = time;
      // Core fades out during tree morph
      coreMaterialRef.current.uniforms.uOpacity.value = tp * Math.max(1 - ntp * 2.5, 0);
      coreMaterialRef.current.uniforms.uMorphProgress.value = morphProgress;
      coreMaterialRef.current.uniforms.uCoreBoost.value = 1.0;
    }
    if (dustMaterialRef.current) {
      dustMaterialRef.current.uniforms.uTime.value = time;
      // Dust fades out during tree morph
      dustMaterialRef.current.uniforms.uOpacity.value = tp * Math.max(1 - ntp * 2.0, 0);
      dustMaterialRef.current.uniforms.uMorphProgress.value = morphProgress;
    }
    if (starsMaterialRef.current) {
      starsMaterialRef.current.uniforms.uTime.value = time;
      const starsOpacity = Math.max((tp - 0.5) / 0.5, 0);
      // Stars dim slightly but stay visible as backdrop
      starsMaterialRef.current.uniforms.uOpacity.value = starsOpacity * Math.max(1 - ntp * 0.4, 0.5);
    }
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 2;

  return (
    <group ref={groupRef}>
      <group ref={galaxyGroupRef} rotation={[0.45, 0.3, 0.1]}>
        {/* ─── Spiral Disk Stars → Tree Morph ─── */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[diskData.pos, 3]} />
            <bufferAttribute attach="attributes-color" args={[diskData.col, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[diskData.siz, 1]} />
            <bufferAttribute attach="attributes-aRandom" args={[diskData.rnd, 1]} />
            <bufferAttribute attach="attributes-aTreePos" args={[treeData.pos, 3]} />
            <bufferAttribute attach="attributes-aTreeCol" args={[treeData.col, 3]} />
          </bufferGeometry>
          <shaderMaterial
            ref={diskMaterialRef}
            depthWrite={false}
            transparent
            blending={THREE.AdditiveBlending}
            vertexColors
            uniforms={{
              uTime: { value: 0 },
              uOpacity: { value: 0 },
              uSize: { value: 80.0 * dpr },
              uMorphProgress: { value: 0 },
              uTreeMorph: { value: 0 },
            }}
            vertexShader={`
              uniform float uTime;
              uniform float uSize;
              uniform float uMorphProgress;
              uniform float uTreeMorph;
              attribute float aSize;
              attribute float aRandom;
              attribute vec3 aTreePos;
              attribute vec3 aTreeCol;
              varying vec3 vColor;
              varying float vAlpha;
              varying float vTreeBlend;
              void main() {
                float twinkle = 0.85 + 0.15 * sin(uTime * (1.0 + aRandom * 3.0) + aRandom * 100.0);
                vAlpha = twinkle;

                // Galaxy entry morph (quantum → galaxy)
                float radius = length(position.xz);
                float maxRadius = 35.0;
                float normalizedR = clamp(radius / maxRadius, 0.0, 1.0);
                float staggerStart = normalizedR * 0.6;
                float staggerEnd = staggerStart + 0.4;
                float particleMorph = smoothstep(staggerStart, staggerEnd, uMorphProgress);
                vec3 morphedPos = position * particleMorph;

                // Galaxy rotation (slows down during tree morph)
                float rotationFade = 1.0 - uTreeMorph;
                float morphedRadius = length(morphedPos.xz);
                float angularSpeed = 0.4 / (morphedRadius + 0.5) * rotationFade;
                float angle = -uTime * angularSpeed;
                float cosA = cos(angle);
                float sinA = sin(angle);
                vec3 rotatedPos = vec3(
                  morphedPos.x * cosA - morphedPos.z * sinA,
                  morphedPos.y,
                  morphedPos.x * sinA + morphedPos.z * cosA
                );

                // Tree morph (galaxy → tree, staggered per particle)
                float treeStagger = smoothstep(aRandom * 0.3, aRandom * 0.3 + 0.5, uTreeMorph);
                vec3 finalPos = mix(rotatedPos, aTreePos, treeStagger);
                vTreeBlend = treeStagger;

                // Blend colors: galaxy → tree
                vColor = mix(color, aTreeCol, treeStagger);

                vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
                float sizeMorph = mix(0.3, 1.0, particleMorph);
                // Particles get slightly smaller in tree form for sharper edges
                float treeSizeFactor = mix(1.0, 0.6, treeStagger);
                gl_PointSize = max(aSize * uSize * sizeMorph * treeSizeFactor * (1.0 / -mvPosition.z), 0.5);
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              varying vec3 vColor;
              varying float vAlpha;
              varying float vTreeBlend;
              uniform float uOpacity;
              void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float strength = 1.0 - dist * 2.0;
                strength = pow(strength, 1.5);
                // Galaxy: brighter emission. Tree: more natural
                float emission = mix(1.8, 1.2, vTreeBlend);
                vec3 finalColor = min(vColor * emission, vec3(2.2));
                float alpha = strength * vAlpha * uOpacity;
                gl_FragColor = vec4(finalColor, alpha);
              }
            `}
          />
        </points>

        {/* ─── Galactic Core / Bulge ─── */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[coreData.pos, 3]} />
            <bufferAttribute attach="attributes-color" args={[coreData.col, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[coreData.siz, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={coreMaterialRef}
            depthWrite={false}
            transparent
            blending={THREE.AdditiveBlending}
            vertexColors
            uniforms={{
              uTime: { value: 0 },
              uOpacity: { value: 0 },
              uSize: { value: 80.0 * dpr },
              uMorphProgress: { value: 0 },
              uCoreBoost: { value: 1.0 },
            }}
            vertexShader={`
              uniform float uSize;
              uniform float uTime;
              uniform float uMorphProgress;
              attribute float aSize;
              varying vec3 vColor;
              void main() {
                vColor = color;
                float radius = length(position.xz);
                float maxRadius = 10.0;
                float normalizedR = clamp(radius / maxRadius, 0.0, 1.0);
                float staggerStart = normalizedR * 0.3;
                float staggerEnd = staggerStart + 0.3;
                float particleMorph = smoothstep(staggerStart, staggerEnd, uMorphProgress);
                vec3 morphedPos = position * particleMorph;

                float morphedRadius = length(morphedPos.xz);
                float angularSpeed = 0.35 / (morphedRadius + 0.5);
                float angle = -uTime * angularSpeed;
                float cosA = cos(angle);
                float sinA = sin(angle);
                vec3 rotatedPos = vec3(
                  morphedPos.x * cosA - morphedPos.z * sinA,
                  morphedPos.y,
                  morphedPos.x * sinA + morphedPos.z * cosA
                );

                vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
                float pulse = 1.0 + 0.05 * sin(uTime * 0.5);
                float sizeMorph = mix(0.5, 1.0, particleMorph);
                gl_PointSize = max(aSize * uSize * pulse * sizeMorph * (1.0 / -mvPosition.z), 0.5);
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              varying vec3 vColor;
              uniform float uOpacity;
              uniform float uCoreBoost;
              void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float strength = 1.0 - dist * 2.0;
                strength = pow(strength, 1.4);
                vec3 finalColor = min(vColor * 0.125 * uCoreBoost, vec3(0.6));
                float alpha = strength * uOpacity;
                gl_FragColor = vec4(finalColor, alpha);
              }
            `}
          />
        </points>

        {/* ─── Dust Lanes ─── */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[dustData.pos, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[dustData.siz, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={dustMaterialRef}
            depthWrite={false}
            transparent
            blending={THREE.NormalBlending}
            uniforms={{
              uTime: { value: 0 },
              uOpacity: { value: 0 },
              uSize: { value: 100.0 * dpr },
              uMorphProgress: { value: 0 },
            }}
            vertexShader={`
              uniform float uSize;
              uniform float uTime;
              uniform float uMorphProgress;
              attribute float aSize;
              void main() {
                float radius = length(position.xz);
                float maxRadius = 31.5;
                float normalizedR = clamp(radius / maxRadius, 0.0, 1.0);
                float staggerStart = normalizedR * 0.6;
                float staggerEnd = staggerStart + 0.4;
                float particleMorph = smoothstep(staggerStart, staggerEnd, uMorphProgress);
                vec3 morphedPos = position * particleMorph;

                float morphedRadius = length(morphedPos.xz);
                float angularSpeed = 0.4 / (morphedRadius + 0.5);
                float angle = -uTime * angularSpeed;
                float cosA = cos(angle);
                float sinA = sin(angle);
                vec3 rotatedPos = vec3(
                  morphedPos.x * cosA - morphedPos.z * sinA,
                  morphedPos.y,
                  morphedPos.x * sinA + morphedPos.z * cosA
                );

                vec4 mvPosition = modelViewMatrix * vec4(rotatedPos, 1.0);
                gl_PointSize = max(aSize * uSize * particleMorph * (1.0 / -mvPosition.z), 0.5);
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              uniform float uOpacity;
              void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float strength = 1.0 - dist * 2.0;
                strength = pow(strength, 3.0);
                float alpha = strength * 0.15 * uOpacity;
                gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
              }
            `}
          />
        </points>

        {/* ─── Background Stars ─── */}
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[starsData.pos, 3]} />
            <bufferAttribute attach="attributes-color" args={[starsData.col, 3]} />
            <bufferAttribute attach="attributes-aSize" args={[starsData.siz, 1]} />
            <bufferAttribute attach="attributes-aRandom" args={[starsData.rnd, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={starsMaterialRef}
            depthWrite={false}
            transparent
            blending={THREE.AdditiveBlending}
            vertexColors
            uniforms={{
              uTime: { value: 0 },
              uOpacity: { value: 0 },
              uSize: { value: 80.0 * dpr },
            }}
            vertexShader={`
              uniform float uTime;
              uniform float uSize;
              attribute float aSize;
              attribute float aRandom;
              varying vec3 vColor;
              varying float vAlpha;
              void main() {
                vColor = color;
                float twinkle = 0.8 + 0.2 * sin(uTime * (0.3 + aRandom * 0.7) + aRandom * 200.0);
                vAlpha = twinkle;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = max(aSize * uSize * (1.0 / -mvPosition.z), 0.5);
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              varying vec3 vColor;
              varying float vAlpha;
              uniform float uOpacity;
              void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                float strength = 1.0 - dist * 2.0;
                float core = pow(strength, 3.0);
                float halo = pow(strength, 1.2) * 0.3;
                float alpha = (core + halo) * vAlpha * uOpacity;
                gl_FragColor = vec4(vColor, alpha);
              }
            `}
          />
        </points>
      </group>
    </group>
  );
}
