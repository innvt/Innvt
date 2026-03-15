'use client';

/**
 * Atomic Dance - Scale 2 (Multi-Atom Version)
 *
 * Multiple atoms with different elements distributed in 3D space.
 * Each atom moves slowly and organically through space.
 *
 * FEATURES:
 * - 50-1,000 atoms (tier-based)
 * - 9 different chemical elements with unique colors
 * - Dynamic atom movement (slow, organic, no collisions)
 * - Nucleus mesh + orbital rings per atom
 * - Morphing support to molecular positions
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneProps } from './types';
import {
  generateAtomPositions,
  calculateOrbitalRadii,
  getAtomCountForTier,
  type ElementConfig,
} from '@/lib/atomic-elements';

interface AtomicDanceMultiProps extends SceneProps {
  gpuTier: number;
  nextTransitionProgress?: number; // 0->1 transition to next scale
  molecularNodes?: THREE.Vector3[]; // Target positions for next scale
}

/**
 * Single Atom Component
 * Renders a nucleus sphere + orbital rings for electron shells
 */
function Atom({
  initialPosition,
  velocityX,
  velocityY,
  velocityZ,
  element,
  rotationOffset,
  targetPosition,
  nextTransitionProgress = 0,
}: {
  initialPosition: { x: number; y: number; z: number };
  velocityX: number;
  velocityY: number;
  velocityZ: number;
  element: ElementConfig;
  rotationOffset: number;
  targetPosition?: THREE.Vector3;
  nextTransitionProgress?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // Calculate orbital radii for visual rings
  const orbitalRadii = useMemo(
    () => calculateOrbitalRadii(element.shellConfiguration),
    [element.shellConfiguration]
  );

  useFrame(() => {
    if (!groupRef.current) return;

    const currentPos = groupRef.current.position;

    // Apply wandering velocity
    currentPos.x += velocityX;
    currentPos.y += velocityY;
    currentPos.z += velocityZ;

    // Wrap around boundaries (only if not morphing)
    if (nextTransitionProgress < 0.1) {
      const boundary = 50;
      if (Math.abs(currentPos.x) > boundary) currentPos.x = -currentPos.x;
      if (Math.abs(currentPos.y) > boundary) currentPos.y = -currentPos.y;
      if (Math.abs(currentPos.z) > boundary) currentPos.z = -currentPos.z;
    }

    // Magnetic pull towards target when morphing
    if (targetPosition && nextTransitionProgress > 0) {
      const pullStrength = nextTransitionProgress * 0.1;
      currentPos.lerp(targetPosition, pullStrength);
      if (nextTransitionProgress > 0.95) {
        currentPos.lerp(targetPosition, 0.5);
      }
    }

    // Scale down during exit transition
    const exitScale = 1 - nextTransitionProgress * 0.8;
    groupRef.current.scale.setScalar(Math.max(exitScale, 0.01));

    // Slow rotation for visual interest
    groupRef.current.rotation.y += 0.002;
  });

  const exitOpacity = Math.max(1 - nextTransitionProgress * 1.5, 0);

  return (
    <group ref={groupRef} position={[initialPosition.x, initialPosition.y, initialPosition.z]}>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial
          color={element.nucleusColor}
          toneMapped={false}
          transparent
          opacity={exitOpacity}
        />
      </mesh>

      {/* Nucleus glow */}
      <mesh>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial
          color={element.glowColor}
          transparent
          opacity={0.3 * exitOpacity}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital rings */}
      {orbitalRadii.map((radius, shellIndex) => (
        <mesh
          key={shellIndex}
          rotation={[
            Math.PI / 2 + shellIndex * 0.5 + rotationOffset,
            shellIndex * 0.3,
            0,
          ]}
        >
          <ringGeometry args={[radius - 0.015, radius + 0.015, 32]} />
          <meshBasicMaterial
            color={element.electronColor}
            transparent
            opacity={0.25 * exitOpacity}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Main AtomicDanceMulti Component
 */
export default function AtomicDanceMulti({
  particleCount: _particleCount,
  isActive: _isActive,
  transitionProgress = 1,
  gpuTier,
  nextTransitionProgress = 0,
  molecularNodes,
}: AtomicDanceMultiProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate atom positions
  const atomPositions = useMemo(() => {
    const atomCount = getAtomCountForTier(gpuTier);
    return generateAtomPositions(atomCount, 30);
  }, [gpuTier]);

  return (
    <group ref={groupRef} visible={transitionProgress > 0}>
      {atomPositions.map((atomData, index) => {
        const targetNode = molecularNodes
          ? molecularNodes[index % molecularNodes.length]
          : undefined;

        return (
          <Atom
            key={index}
            initialPosition={{ x: atomData.x, y: atomData.y, z: atomData.z }}
            velocityX={atomData.velocityX}
            velocityY={atomData.velocityY}
            velocityZ={atomData.velocityZ}
            element={atomData.element}
            rotationOffset={atomData.rotationOffset}
            targetPosition={targetNode}
            nextTransitionProgress={nextTransitionProgress}
          />
        );
      })}
    </group>
  );
}
