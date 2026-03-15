'use client';

import { useRef, useMemo, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneProps } from './types';

interface CosmicWebProps extends SceneProps {
  cosmicNodes?: THREE.Vector3[];
  transitionProgressRef?: MutableRefObject<number>;
}

// Simple seeded RNG for deterministic generation
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export default function CosmicWeb({
  particleCount: _particleCount,
  isActive: _isActive,
  transitionProgress = 0,
  transitionProgressRef,
  cosmicNodes: _cosmicNodes = [],
}: CosmicWebProps) {
  const groupRef = useRef<THREE.Group>(null);
  const filamentMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const nodeMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const ambientMaterialRef = useRef<THREE.ShaderMaterial>(null);

  const webData = useMemo(() => {
    const rand = mulberry32(42); // deterministic seed
    const nodeCount = 400;
    const connectionDistance = 25.0;
    const universeRadius = 70.0;

    // Generate nodes using sphere packing with void regions
    // Cosmic web has clusters, filaments, walls, and voids
    const nodes: THREE.Vector3[] = [];
    const nColors: number[] = [];
    const nSizes: number[] = [];

    // Create void centers (regions with fewer nodes)
    const voidCount = 5;
    const voids: THREE.Vector3[] = [];
    for (let v = 0; v < voidCount; v++) {
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = 8 + rand() * 15;
      voids.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ));
    }

    for (let i = 0; i < nodeCount; i++) {
      // Spherical distribution — flatter power for more even spread
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      const r = Math.pow(rand(), 0.35) * universeRadius;

      let x = r * Math.sin(phi) * Math.cos(theta);
      let y = r * Math.sin(phi) * Math.sin(theta);
      let z = r * Math.cos(phi);

      // Push away from voids (creates filamentary structure)
      for (const v of voids) {
        const dx = x - v.x, dy = y - v.y, dz = z - v.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const voidRadius = 12;
        if (dist < voidRadius) {
          const push = (voidRadius - dist) / voidRadius * 6;
          const norm = 1 / Math.max(dist, 0.1);
          x += dx * norm * push;
          y += dy * norm * push;
          z += dz * norm * push;
        }
      }

      nodes.push(new THREE.Vector3(x, y, z));

      // Brighter near center, dimmer at edges
      const distFromCenter = Math.sqrt(x * x + y * y + z * z) / universeRadius;
      if (distFromCenter < 0.25) {
        nColors.push(1.0, 0.92, 0.65);    // Warm gold (dense cluster)
        nSizes.push(3.0 + rand() * 4.0);
      } else if (distFromCenter < 0.55) {
        nColors.push(0.75, 0.85, 1.0);    // Blue-white
        nSizes.push(2.0 + rand() * 3.0);
      } else {
        nColors.push(0.5, 0.55, 0.85);    // Blue-purple
        nSizes.push(1.0 + rand() * 2.0);
      }
    }

    // Build filament connections
    const filPosArray: number[] = [];
    const filColArray: number[] = [];

    for (let i = 0; i < nodes.length; i++) {
      let connectionCount = 0;
      for (let j = i + 1; j < nodes.length; j++) {
        if (connectionCount > 5) break; // limit connections per node
        const dist = nodes[i].distanceTo(nodes[j]);
        if (dist < connectionDistance) {
          const probability = Math.pow(1 - dist / connectionDistance, 2);
          if (rand() < probability * 0.8) {
            connectionCount++;

            // More segments for smoother filaments
            const segments = 3;
            for (let s = 0; s < segments; s++) {
              const t1 = s / segments;
              const t2 = (s + 1) / segments;

              const p1 = nodes[i].clone().lerp(nodes[j], t1);
              const p2 = nodes[i].clone().lerp(nodes[j], t2);

              filPosArray.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);

              // Color: brighter near nodes, with subtle blue-purple tone
              const midness = Math.sin(((t1 + t2) / 2) * Math.PI);
              const brightness = 0.4 + midness * 0.4;
              filColArray.push(
                brightness * 0.65, brightness * 0.72, brightness * 1.0,
                brightness * 0.65, brightness * 0.72, brightness * 1.0
              );
            }
          }
        }
      }
    }

    // Build node positions array
    const nPos = new Float32Array(nodes.length * 3);
    nodes.forEach((n, i) => {
      nPos[i * 3] = n.x;
      nPos[i * 3 + 1] = n.y;
      nPos[i * 3 + 2] = n.z;
    });

    // Ambient background particles (distant galaxies)
    const ambientCount = 5000;
    const ambPos = new Float32Array(ambientCount * 3);
    const ambCol = new Float32Array(ambientCount * 3);
    const ambSiz = new Float32Array(ambientCount);

    for (let i = 0; i < ambientCount; i++) {
      const aR = 20 + rand() * 60;
      const aTheta = rand() * Math.PI * 2;
      const aPhi = Math.acos(2 * rand() - 1);

      ambPos[i * 3] = aR * Math.sin(aPhi) * Math.cos(aTheta);
      ambPos[i * 3 + 1] = aR * Math.sin(aPhi) * Math.sin(aTheta);
      ambPos[i * 3 + 2] = aR * Math.cos(aPhi);

      const c = rand();
      ambCol[i * 3] = 0.4 + c * 0.3;
      ambCol[i * 3 + 1] = 0.45 + c * 0.25;
      ambCol[i * 3 + 2] = 0.6 + c * 0.25;

      ambSiz[i] = 0.3 + rand() * 0.8;
    }

    return {
      filamentPositions: new Float32Array(filPosArray),
      filamentColors: new Float32Array(filColArray),
      nodePositions: nPos,
      nodeColors: new Float32Array(nColors),
      nodeSizes: new Float32Array(nSizes),
      ambientPos: ambPos,
      ambientCol: ambCol,
      ambientSiz: ambSiz,
    };
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const tp = transitionProgressRef ? transitionProgressRef.current : transitionProgress;
    if (tp === 0) return;

    const time = state.clock.elapsedTime;
    // Slow rotation for cosmic grandeur
    groupRef.current.rotation.y = time * 0.006;

    // Morph progress — nodes and filaments spread from center
    const morphProgress = tp;

    if (filamentMaterialRef.current) {
      filamentMaterialRef.current.uniforms.uTime.value = time;
      filamentMaterialRef.current.uniforms.uOpacity.value = tp;
      filamentMaterialRef.current.uniforms.uMorphProgress.value = morphProgress;
    }
    if (nodeMaterialRef.current) {
      nodeMaterialRef.current.uniforms.uTime.value = time;
      nodeMaterialRef.current.uniforms.uOpacity.value = tp;
      nodeMaterialRef.current.uniforms.uMorphProgress.value = morphProgress;
    }
    if (ambientMaterialRef.current) {
      // Ambient particles fade in after main structure has mostly formed
      const ambientOpacity = Math.max((tp - 0.4) / 0.6, 0);
      ambientMaterialRef.current.uniforms.uOpacity.value = ambientOpacity;
      ambientMaterialRef.current.uniforms.uMorphProgress.value = morphProgress;
    }
  });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 2;

  return (
    <group ref={groupRef}>
      {/* ═══ Filaments ═══ */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[webData.filamentPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[webData.filamentColors, 3]} />
        </bufferGeometry>
        <shaderMaterial
          ref={filamentMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
          uniforms={{
            uTime: { value: 0 },
            uOpacity: { value: 0 },
            uMorphProgress: { value: 0 },
          }}
          vertexShader={`
            uniform float uMorphProgress;
            varying vec3 vColor;
            varying float vMorph;
            void main() {
              vColor = color;

              // MORPH: filaments grow from center outward
              float radius = length(position);
              float maxRadius = 70.0;
              float normalizedR = clamp(radius / maxRadius, 0.0, 1.0);

              // Stagger: inner filaments appear first
              float staggerStart = normalizedR * 0.5;
              float staggerEnd = staggerStart + 0.5;
              float particleMorph = smoothstep(staggerStart, staggerEnd, uMorphProgress);
              vMorph = particleMorph;

              vec3 morphedPos = position * particleMorph;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(morphedPos, 1.0);
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vMorph;
            uniform float uOpacity;
            void main() {
              // Filaments fade in as they morph — subtle connecting lines
              float alpha = 0.4 * uOpacity * vMorph;
              gl_FragColor = vec4(vColor * 0.9, alpha);
            }
          `}
        />
      </lineSegments>

      {/* ═══ Galaxy Cluster Nodes ═══ */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[webData.nodePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[webData.nodeColors, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[webData.nodeSizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={nodeMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
          uniforms={{
            uTime: { value: 0 },
            uOpacity: { value: 0 },
            uSize: { value: 100.0 * dpr },
            uMorphProgress: { value: 0 },
          }}
          vertexShader={`
            attribute float aSize;
            uniform float uSize;
            uniform float uTime;
            uniform float uMorphProgress;
            varying vec3 vColor;
            varying float vMorph;
            void main() {
              vColor = color;

              // MORPH: nodes spread from center outward
              float radius = length(position);
              float maxRadius = 70.0;
              float normalizedR = clamp(radius / maxRadius, 0.0, 1.0);

              // Core nodes appear early, outer nodes appear later
              float staggerStart = normalizedR * 0.5;
              float staggerEnd = staggerStart + 0.4;
              float particleMorph = smoothstep(staggerStart, staggerEnd, uMorphProgress);
              vMorph = particleMorph;

              vec3 morphedPos = position * particleMorph;

              vec4 mvPosition = modelViewMatrix * vec4(morphedPos, 1.0);
              float pulse = 1.0 + 0.1 * sin(uTime * 0.5 + position.x * 0.3 + position.z * 0.2);
              // Nodes grow from small to full size during morph
              float sizeMorph = mix(0.3, 1.0, particleMorph);
              gl_PointSize = max(aSize * uSize * pulse * sizeMorph * (1.0 / -mvPosition.z), 1.0);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vMorph;
            uniform float uOpacity;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float strength = 1.0 - dist * 2.0;
              // Soft glow — subtle, not overpowering
              float core = pow(strength, 3.0) * 1.2;
              float halo = pow(strength, 1.2) * 0.35;
              float combined = core + halo;
              vec3 finalColor = min(vColor * combined, vec3(1.2));
              float alpha = combined * uOpacity * vMorph;
              gl_FragColor = vec4(finalColor, alpha);
            }
          `}
        />
      </points>

      {/* ═══ Ambient Background ═══ */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[webData.ambientPos, 3]} />
          <bufferAttribute attach="attributes-color" args={[webData.ambientCol, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[webData.ambientSiz, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={ambientMaterialRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          vertexColors
          uniforms={{
            uOpacity: { value: 0 },
            uSize: { value: 30.0 * dpr },
            uMorphProgress: { value: 0 },
          }}
          vertexShader={`
            attribute float aSize;
            uniform float uSize;
            uniform float uMorphProgress;
            varying vec3 vColor;
            varying float vMorph;
            void main() {
              vColor = color;

              // MORPH: ambient particles also spread from center
              float radius = length(position);
              float maxRadius = 80.0;
              float normalizedR = clamp(radius / maxRadius, 0.0, 1.0);
              float staggerStart = normalizedR * 0.4;
              float staggerEnd = staggerStart + 0.6;
              float particleMorph = smoothstep(staggerStart, staggerEnd, uMorphProgress);
              vMorph = particleMorph;

              vec3 morphedPos = position * particleMorph;

              vec4 mvPosition = modelViewMatrix * vec4(morphedPos, 1.0);
              float sizeMorph = mix(0.2, 1.0, particleMorph);
              gl_PointSize = max(aSize * uSize * sizeMorph * (1.0 / -mvPosition.z), 0.5);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            varying vec3 vColor;
            varying float vMorph;
            uniform float uOpacity;
            void main() {
              float dist = length(gl_PointCoord - vec2(0.5));
              if (dist > 0.5) discard;
              float strength = 1.0 - dist * 2.0;
              strength = pow(strength, 1.8);
              float alpha = strength * 0.3 * uOpacity * vMorph;
              gl_FragColor = vec4(vColor * 0.6, alpha);
            }
          `}
        />
      </points>
    </group>
  );
}
