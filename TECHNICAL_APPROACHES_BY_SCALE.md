# Technical Approaches by Scale - Code Examples & Implementation Guide

**Purpose**: Specific implementation details and code examples for each of the 6 scale levels

---

## Scale 1: Quantum Field (Subatomic)

### Concept
Abstract particle field representing the quantum realm with uncertainty and energy fluctuations

### Technical Approach
**Method**: FBO (Frame Buffer Object) with curl noise for organic particle motion

**Particle Count**:
- Desktop (Tier 3): 50,000 particles
- Desktop (Tier 2): 30,000 particles
- Mobile (Tier 1): 10,000 particles
- Mobile (Tier 0): 2D fallback

### Implementation

**File**: `components/scenes/QuantumField.tsx`

```typescript
import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFBO } from '@react-three/drei';

// Vertex shader for FBO simulation
const simulationVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader for FBO simulation (curl noise)
const simulationFragmentShader = `
  uniform sampler2D uPositions;
  uniform float uTime;
  uniform float uDelta;
  
  varying vec2 vUv;
  
  // Simplex noise function (include full implementation)
  vec3 curl(vec3 p) {
    // Curl noise implementation
    // Returns organic, swirling motion
  }
  
  void main() {
    vec3 position = texture2D(uPositions, vUv).xyz;
    
    // Apply curl noise for organic motion
    vec3 velocity = curl(position * 0.1 + uTime * 0.05);
    position += velocity * uDelta * 0.5;
    
    // Keep particles in bounds
    position = mod(position + 5.0, 10.0) - 5.0;
    
    gl_FragColor = vec4(position, 1.0);
  }
`;

// Vertex shader for rendering particles
const particleVertexShader = `
  uniform sampler2D uPositions;
  uniform float uSize;
  
  varying vec3 vPosition;
  
  void main() {
    vPosition = texture2D(uPositions, position.xy).xyz;
    
    vec4 mvPosition = modelViewMatrix * vec4(vPosition, 1.0);
    gl_PointSize = uSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Fragment shader for rendering particles
const particleFragmentShader = `
  varying vec3 vPosition;
  
  void main() {
    // Circular particle shape
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Glow effect
    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
    
    // Quantum-inspired color (blue-purple gradient)
    vec3 color = mix(
      vec3(0.2, 0.4, 1.0),  // Blue
      vec3(0.8, 0.2, 1.0),  // Purple
      vPosition.z * 0.1 + 0.5
    );
    
    gl_FragColor = vec4(color, alpha * 0.6);
  }
`;

export function QuantumField({ particleCount = 50000 }) {
  const { gl } = useThree();
  
  // Create FBO for position simulation
  const size = Math.sqrt(particleCount);
  const positionFBO = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });
  
  // Initialize particle positions
  const initialPositions = useMemo(() => {
    const data = new Float32Array(size * size * 4);
    for (let i = 0; i < size * size; i++) {
      const i4 = i * 4;
      data[i4 + 0] = (Math.random() - 0.5) * 10; // x
      data[i4 + 1] = (Math.random() - 0.5) * 10; // y
      data[i4 + 2] = (Math.random() - 0.5) * 10; // z
      data[i4 + 3] = 1.0; // w
    }
    return data;
  }, [size]);
  
  // Simulation material
  const simulationMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: simulationFragmentShader,
      uniforms: {
        uPositions: { value: null },
        uTime: { value: 0 },
        uDelta: { value: 0 },
      },
    });
  }, []);
  
  // Particle rendering material
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uPositions: { value: positionFBO.texture },
        uSize: { value: 3.0 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [positionFBO]);
  
  // Particle geometry (UV coordinates for FBO lookup)
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 2);
    
    for (let i = 0; i < particleCount; i++) {
      const i2 = i * 2;
      positions[i2 + 0] = (i % size) / size; // u
      positions[i2 + 1] = Math.floor(i / size) / size; // v
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 2));
    return geometry;
  }, [particleCount, size]);
  
  // Animation loop
  useFrame((state, delta) => {
    // Update simulation
    simulationMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    simulationMaterial.uniforms.uDelta.value = delta;
    simulationMaterial.uniforms.uPositions.value = positionFBO.texture;
    
    // Render to FBO
    gl.setRenderTarget(positionFBO);
    // Render simulation quad here
    gl.setRenderTarget(null);
    
    // Update particle material
    particleMaterial.uniforms.uPositions.value = positionFBO.texture;
  });
  
  return (
    <points geometry={particleGeometry} material={particleMaterial} />
  );
}
```

### Key Techniques
1. **FBO (Frame Buffer Object)**: GPU-based particle simulation
2. **Curl Noise**: Organic, swirling motion
3. **Additive Blending**: Glow effect
4. **Shader-based**: All calculations on GPU

### Performance Notes
- FBO allows 100K+ particles with minimal CPU overhead
- All calculations happen on GPU
- Scales well with particle count

### References
- Maxime Heckel: "The Magical World of Particles" (FBO tutorial)
- nicoptere: "FBO Particles" (curl noise implementation)

### Development Time
**Estimated**: 3-4 days

---

## Scale 2: Atomic Dance (Electron Orbitals)

### Concept
Simplified Bohr model with electrons orbiting nucleus, representing atomic structure

### Technical Approach
**Method**: Orbital paths with GSAP animation, optional probability cloud

**Particle Count**:
- Nucleus: 1 sphere
- Electrons: 5-10 particles
- Probability cloud (optional): 5,000-10,000 particles

### Implementation

**File**: `components/scenes/AtomicDance.tsx`

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

export function AtomicDance() {
  const electronRefs = useRef<THREE.Mesh[]>([]);
  
  // Orbital configuration (s, p, d orbitals)
  const orbitals = useMemo(() => [
    { radius: 2, speed: 1.0, inclination: 0, color: '#4488ff' },
    { radius: 3, speed: 0.8, inclination: Math.PI / 4, color: '#88ff44' },
    { radius: 4, speed: 0.6, inclination: Math.PI / 2, color: '#ff8844' },
  ], []);
  
  // Generate orbital path points
  const getOrbitalPath = (radius: number, inclination: number) => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * Math.cos(inclination);
      const z = Math.sin(angle) * radius * Math.sin(inclination);
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  };
  
  // Animate electrons along orbital paths
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    electronRefs.current.forEach((electron, index) => {
      if (!electron) return;
      
      const orbital = orbitals[index];
      const angle = time * orbital.speed;
      
      electron.position.x = Math.cos(angle) * orbital.radius;
      electron.position.y = Math.sin(angle) * orbital.radius * Math.cos(orbital.inclination);
      electron.position.z = Math.sin(angle) * orbital.radius * Math.sin(orbital.inclination);
    });
  });
  
  return (
    <group>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#ff4444"
          emissive="#ff4444"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Orbital paths */}
      {orbitals.map((orbital, index) => (
        <Line
          key={`path-${index}`}
          points={getOrbitalPath(orbital.radius, orbital.inclination)}
          color={orbital.color}
          lineWidth={1}
          opacity={0.3}
          transparent
        />
      ))}
      
      {/* Electrons */}
      {orbitals.map((orbital, index) => (
        <mesh
          key={`electron-${index}`}
          ref={(el) => {
            if (el) electronRefs.current[index] = el;
          }}
        >
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={orbital.color}
            emissive={orbital.color}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
```

### Alternative: Probability Cloud

```typescript
// For more scientifically accurate representation
export function ProbabilityCloud() {
  const particleCount = 10000;
  
  // Generate positions based on hydrogen orbital probability distribution
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Simplified 1s orbital (spherical)
      const r = Math.pow(Math.random(), 2) * 3; // Probability distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
    }
    
    return pos;
  }, []);
  
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#4488ff"
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```

### Key Techniques
1. **Orbital Paths**: THREE.Line for visualization
2. **GSAP Animation**: Smooth electron movement
3. **Probability Distribution**: Scientifically-inspired particle placement

### References
- 3Dmol.js: Orbital visualization
- PhET Interactive Simulations: "Models of the Hydrogen Atom"

### Development Time
**Estimated**: 4-5 days

---

## Scale 3: Molecular Network (H₂ Bonds)

### Concept
Ball-and-stick model showing molecular bonds and vibrations

### Technical Approach
**Method**: InstancedMesh for atoms and bonds, shader-based vibration

**Particle Count**:
- Molecules: 100-500
- Atoms per molecule: 2 (H₂)
- Bonds per molecule: 1

### Implementation

**File**: `components/scenes/MolecularNetwork.tsx`

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function MolecularNetwork({ moleculeCount = 200 }) {
  const atomsRef = useRef<THREE.InstancedMesh>(null);
  const bondsRef = useRef<THREE.InstancedMesh>(null);
  
  // Generate molecule positions
  const molecules = useMemo(() => {
    const mols = [];
    for (let i = 0; i < moleculeCount; i++) {
      mols.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        ),
      });
    }
    return mols;
  }, [moleculeCount]);
  
  // Set up instanced meshes
  useMemo(() => {
    if (!atomsRef.current || !bondsRef.current) return;
    
    const atomMatrix = new THREE.Matrix4();
    const bondMatrix = new THREE.Matrix4();
    const bondLength = 0.74; // H-H bond length (Angstroms, scaled)
    
    molecules.forEach((mol, i) => {
      // Atom 1
      atomMatrix.setPosition(
        mol.position.x - bondLength / 2,
        mol.position.y,
        mol.position.z
      );
      atomsRef.current!.setMatrixAt(i * 2, atomMatrix);
      
      // Atom 2
      atomMatrix.setPosition(
        mol.position.x + bondLength / 2,
        mol.position.y,
        mol.position.z
      );
      atomsRef.current!.setMatrixAt(i * 2 + 1, atomMatrix);
      
      // Bond (cylinder between atoms)
      bondMatrix.makeRotationZ(Math.PI / 2);
      bondMatrix.setPosition(mol.position.x, mol.position.y, mol.position.z);
      bondsRef.current!.setMatrixAt(i, bondMatrix);
    });
    
    atomsRef.current.instanceMatrix.needsUpdate = true;
    bondsRef.current.instanceMatrix.needsUpdate = true;
  }, [molecules]);
  
  // Animate vibration
  useFrame((state) => {
    if (!atomsRef.current || !bondsRef.current) return;
    
    const time = state.clock.elapsedTime;
    const matrix = new THREE.Matrix4();
    const bondLength = 0.74;
    
    molecules.forEach((mol, i) => {
      // Vibration (bond stretching)
      const vibration = Math.sin(time * 5 + i) * 0.05;
      const currentLength = bondLength + vibration;
      
      // Update atom positions
      matrix.setPosition(
        mol.position.x - currentLength / 2,
        mol.position.y,
        mol.position.z
      );
      atomsRef.current!.setMatrixAt(i * 2, matrix);
      
      matrix.setPosition(
        mol.position.x + currentLength / 2,
        mol.position.y,
        mol.position.z
      );
      atomsRef.current!.setMatrixAt(i * 2 + 1, matrix);
    });
    
    atomsRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <group>
      {/* Atoms (hydrogen) */}
      <instancedMesh
        ref={atomsRef}
        args={[undefined, undefined, moleculeCount * 2]}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#88ccff"
          emissiveIntensity={0.3}
        />
      </instancedMesh>
      
      {/* Bonds */}
      <instancedMesh
        ref={bondsRef}
        args={[undefined, undefined, moleculeCount]}
      >
        <cylinderGeometry args={[0.1, 0.1, 0.74, 8]} />
        <meshStandardMaterial
          color="#cccccc"
          metalness={0.5}
          roughness={0.5}
        />
      </instancedMesh>
    </group>
  );
}
```

### Key Techniques
1. **InstancedMesh**: Efficient rendering of repeated geometry
2. **Vibration Animation**: Realistic molecular motion
3. **Ball-and-Stick Model**: Standard molecular visualization

### References
- 3Dmol.js: Ball-and-stick models
- MolView: Molecular viewer

### Development Time
**Estimated**: 3-4 days

---

## Scale 4: Orbital Harmony (Solar System)

### Concept
Simplified solar system with elliptical orbits following Kepler's laws

### Technical Approach
**Method**: Elliptical orbit calculation, GSAP for smooth animation

**Objects**:
- Sun: 1
- Planets: 8
- Moons: 3-5 (optional)
- Asteroid belt: 1,000-5,000 particles (optional)

### Implementation

**File**: `components/scenes/OrbitalHarmony.tsx`

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Planet {
  name: string;
  semiMajorAxis: number; // a
  eccentricity: number; // e
  orbitalPeriod: number; // T (in Earth years)
  radius: number;
  color: string;
}

export function OrbitalHarmony() {
  const planetRefs = useRef<THREE.Mesh[]>([]);
  
  // Simplified solar system data (scaled for visualization)
  const planets: Planet[] = useMemo(() => [
    { name: 'Mercury', semiMajorAxis: 4, eccentricity: 0.206, orbitalPeriod: 0.24, radius: 0.2, color: '#8c7853' },
    { name: 'Venus', semiMajorAxis: 7, eccentricity: 0.007, orbitalPeriod: 0.62, radius: 0.4, color: '#ffc649' },
    { name: 'Earth', semiMajorAxis: 10, eccentricity: 0.017, orbitalPeriod: 1.0, radius: 0.4, color: '#4488ff' },
    { name: 'Mars', semiMajorAxis: 15, eccentricity: 0.093, orbitalPeriod: 1.88, radius: 0.3, color: '#ff6347' },
  ], []);
  
  // Calculate position on elliptical orbit
  const getOrbitalPosition = (planet: Planet, time: number) => {
    // Mean anomaly
    const M = (2 * Math.PI * time) / planet.orbitalPeriod;
    
    // Solve Kepler's equation (simplified)
    let E = M;
    for (let i = 0; i < 5; i++) {
      E = M + planet.eccentricity * Math.sin(E);
    }
    
    // True anomaly
    const v = 2 * Math.atan(
      Math.sqrt((1 + planet.eccentricity) / (1 - planet.eccentricity)) *
      Math.tan(E / 2)
    );
    
    // Distance from sun
    const r = planet.semiMajorAxis * (1 - planet.eccentricity * Math.cos(E));
    
    // Position
    return new THREE.Vector3(
      r * Math.cos(v),
      0,
      r * Math.sin(v)
    );
  };
  
  // Animate planets
  useFrame((state) => {
    const time = state.clock.elapsedTime * 0.1; // Slow down for visibility
    
    planetRefs.current.forEach((planet, index) => {
      if (!planet) return;
      
      const pos = getOrbitalPosition(planets[index], time);
      planet.position.copy(pos);
    });
  });
  
  return (
    <group>
      {/* Sun */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#ffaa00"
          emissive="#ffaa00"
          emissiveIntensity={1}
        />
      </mesh>
      
      {/* Planets */}
      {planets.map((planet, index) => (
        <mesh
          key={planet.name}
          ref={(el) => {
            if (el) planetRefs.current[index] = el;
          }}
        >
          <sphereGeometry args={[planet.radius, 32, 32]} />
          <meshStandardMaterial
            color={planet.color}
            emissive={planet.color}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
```

### Key Techniques
1. **Kepler's Laws**: Elliptical orbits with accurate physics
2. **Mean Anomaly**: Time-based orbital position
3. **Eccentricity**: Realistic orbital shapes

### References
- jsOrrery: JavaScript solar system simulation
- NASA JPL Orbit Viewer

### Development Time
**Estimated**: 5-6 days

---

## Transition System

### Concept
Smooth morphing between scales using particle position interpolation

### Implementation

**File**: `components/transitions/ScaleTransition.tsx`

```typescript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

export function useScaleTransition(
  fromPositions: Float32Array,
  toPositions: Float32Array,
  duration: number = 2
) {
  const progressRef = useRef({ value: 0 });
  const currentPositions = useRef(new Float32Array(fromPositions.length));
  
  useEffect(() => {
    // Animate transition
    gsap.to(progressRef.current, {
      value: 1,
      duration,
      ease: 'power2.inOut',
    });
  }, [fromPositions, toPositions, duration]);
  
  useFrame(() => {
    const progress = progressRef.current.value;
    
    // Interpolate positions
    for (let i = 0; i < fromPositions.length; i++) {
      currentPositions.current[i] = THREE.MathUtils.lerp(
        fromPositions[i],
        toPositions[i],
        progress
      );
    }
  });
  
  return currentPositions.current;
}
```

### Development Time (All Transitions)
**Estimated**: 7-10 days

---

## Scale 5: Galactic Expanse (Spiral Galaxy)

### Concept
Procedurally generated spiral galaxy with logarithmic spiral arms and star distribution

### Technical Approach
**Method**: Logarithmic spiral formula + Simplex noise for star distribution

**Particle Count**:
- Desktop (Tier 3): 100,000 stars
- Desktop (Tier 2): 50,000 stars
- Mobile (Tier 1): 20,000 stars

### Implementation

**File**: `components/scenes/GalacticExpanse.tsx`

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

export function GalacticExpanse({ starCount = 100000 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const noise3D = useMemo(() => createNoise3D(), []);

  // Generate galaxy structure
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(starCount * 3);
    const col = new Float32Array(starCount * 3);
    const size = new Float32Array(starCount);

    const armCount = 2; // Spiral arms
    const armSeparation = (2 * Math.PI) / armCount;

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;

      // Which arm?
      const arm = i % armCount;

      // Distance from center (0 to 1)
      const t = Math.pow(Math.random(), 0.5); // More stars toward center

      // Logarithmic spiral formula
      const angle = arm * armSeparation + t * Math.PI * 4;
      const radius = t * 15; // Galaxy radius

      // Add noise for organic structure
      const noiseValue = noise3D(
        Math.cos(angle) * radius * 0.1,
        Math.sin(angle) * radius * 0.1,
        t
      );

      // Spiral arm offset
      const armOffset = noiseValue * 2;

      // Position
      const x = Math.cos(angle) * (radius + armOffset);
      const z = Math.sin(angle) * (radius + armOffset);
      const y = (Math.random() - 0.5) * 0.5 * (1 - t); // Thinner at edges

      pos[i3 + 0] = x;
      pos[i3 + 1] = y;
      pos[i3 + 2] = z;

      // Color (blue-white gradient, warmer toward center)
      const centerDistance = t;
      const colorMix = centerDistance;

      col[i3 + 0] = THREE.MathUtils.lerp(1.0, 0.6, colorMix); // R
      col[i3 + 1] = THREE.MathUtils.lerp(0.9, 0.7, colorMix); // G
      col[i3 + 2] = THREE.MathUtils.lerp(0.7, 1.0, colorMix); // B

      // Size (larger stars toward center)
      size[i] = THREE.MathUtils.lerp(3.0, 1.0, centerDistance);
    }

    return { positions: pos, colors: col, sizes: size };
  }, [starCount, noise3D]);

  // Rotate galaxy
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={starCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={starCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={starCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
```

### Advanced: Custom Shader for Better Performance

```glsl
// Vertex Shader
attribute float size;
attribute vec3 color;

varying vec3 vColor;

void main() {
  vColor = color;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}

// Fragment Shader
varying vec3 vColor;

void main() {
  // Circular star shape
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);

  if (dist > 0.5) discard;

  // Soft glow
  float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
  alpha = pow(alpha, 2.0);

  gl_FragColor = vec4(vColor, alpha);
}
```

### Key Techniques
1. **Logarithmic Spiral**: Realistic galaxy arm structure
2. **Simplex Noise**: Organic star distribution
3. **Density Variation**: More stars toward center
4. **Color Gradient**: Temperature-based coloring

### References
- pickles976/GalaxyThreeJS: Procedural galaxy tutorial
- Simplex-noise library: Organic noise generation

### Development Time
**Estimated**: 4-5 days

---

## Scale 6: Cosmic Web (Universe Structure)

### Concept
Large-scale structure of the universe showing filaments and galaxy clusters

### Technical Approach
**Method**: Procedural filament generation using Perlin noise and particle systems

**Particle Count**:
- Desktop (Tier 3): 50,000 particles
- Desktop (Tier 2): 30,000 particles
- Mobile (Tier 1): 10,000 particles

### Implementation

**File**: `components/scenes/CosmicWeb.tsx`

```typescript
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';

export function CosmicWeb({ particleCount = 50000 }) {
  const pointsRef = useRef<THREE.Points>(null);
  const noise3D = useMemo(() => createNoise3D(), []);

  // Generate cosmic web structure
  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const size = new Float32Array(particleCount);

    const filamentCount = 20;
    const particlesPerFilament = Math.floor(particleCount / filamentCount);

    let index = 0;

    for (let f = 0; f < filamentCount; f++) {
      // Random filament start and end points
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );

      const end = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );

      // Create particles along filament
      for (let p = 0; p < particlesPerFilament; p++) {
        if (index >= particleCount) break;

        const i3 = index * 3;
        const t = p / particlesPerFilament;

        // Interpolate between start and end
        const basePos = new THREE.Vector3().lerpVectors(start, end, t);

        // Add noise for organic structure
        const noiseScale = 0.1;
        const noiseValue = noise3D(
          basePos.x * noiseScale,
          basePos.y * noiseScale,
          basePos.z * noiseScale
        );

        // Offset perpendicular to filament direction
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const perpendicular = new THREE.Vector3(
          -direction.y,
          direction.x,
          0
        ).normalize();

        const offset = perpendicular.multiplyScalar(noiseValue * 3);
        basePos.add(offset);

        pos[i3 + 0] = basePos.x;
        pos[i3 + 1] = basePos.y;
        pos[i3 + 2] = basePos.z;

        // Color (purple-blue cosmic web)
        const density = Math.abs(noiseValue);
        col[i3 + 0] = THREE.MathUtils.lerp(0.3, 0.8, density); // R
        col[i3 + 1] = THREE.MathUtils.lerp(0.2, 0.5, density); // G
        col[i3 + 2] = THREE.MathUtils.lerp(0.8, 1.0, density); // B

        // Size (galaxy clusters are larger)
        size[index] = density > 0.7 ? 4.0 : 2.0;

        index++;
      }
    }

    return { positions: pos, colors: col, sizes: size };
  }, [particleCount, noise3D]);

  // Subtle rotation
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.05) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
```

### Advanced: Filament Lines

```typescript
// Optional: Add lines connecting particles for filament visualization
export function CosmicWebLines({ filaments }: { filaments: THREE.Vector3[][] }) {
  return (
    <>
      {filaments.map((filament, index) => (
        <Line
          key={index}
          points={filament}
          color="#6644ff"
          lineWidth={1}
          opacity={0.2}
          transparent
        />
      ))}
    </>
  );
}
```

### Key Techniques
1. **Filament Generation**: Procedural paths between random points
2. **Perlin Noise**: Organic filament structure
3. **Galaxy Clusters**: Larger particles at high-density regions
4. **Subtle Animation**: Slow rotation for depth perception

### References
- Academic papers on cosmic web visualization
- Procedural generation techniques from galaxy examples

### Development Time
**Estimated**: 5-6 days

---

## Complete Scene Manager

### Concept
Manage all 6 scales with scroll-based transitions

### Implementation

**File**: `components/SceneManager.tsx`

```typescript
import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { QuantumField } from './scenes/QuantumField';
import { AtomicDance } from './scenes/AtomicDance';
import { MolecularNetwork } from './scenes/MolecularNetwork';
import { OrbitalHarmony } from './scenes/OrbitalHarmony';
import { GalacticExpanse } from './scenes/GalacticExpanse';
import { CosmicWeb } from './scenes/CosmicWeb';

gsap.registerPlugin(ScrollTrigger);

export function SceneManager() {
  const { camera } = useThree();
  const sceneRefs = useRef<THREE.Group[]>([]);

  useEffect(() => {
    // Scene 1: Quantum Field (Hero)
    gsap.timeline({
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
    .to(camera.position, { z: 5, duration: 1 })
    .to(sceneRefs.current[0]?.scale || {}, { x: 0, y: 0, z: 0, duration: 0.5 }, 0.5);

    // Scene 2: Atomic Dance (Phase 1)
    gsap.timeline({
      scrollTrigger: {
        trigger: '#phase-1',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })
    .fromTo(sceneRefs.current[1]?.scale || {},
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 1, z: 1, duration: 0.5 }
    )
    .to(camera.position, { z: 10, duration: 1 })
    .to(sceneRefs.current[1]?.scale || {}, { x: 0, y: 0, z: 0, duration: 0.5 }, 1.5);

    // Continue for all 6 scenes...

  }, [camera]);

  return (
    <>
      <group ref={(el) => { if (el) sceneRefs.current[0] = el; }}>
        <QuantumField particleCount={50000} />
      </group>

      <group ref={(el) => { if (el) sceneRefs.current[1] = el; }} scale={0}>
        <AtomicDance />
      </group>

      <group ref={(el) => { if (el) sceneRefs.current[2] = el; }} scale={0}>
        <MolecularNetwork moleculeCount={200} />
      </group>

      <group ref={(el) => { if (el) sceneRefs.current[3] = el; }} scale={0}>
        <OrbitalHarmony />
      </group>

      <group ref={(el) => { if (el) sceneRefs.current[4] = el; }} scale={0}>
        <GalacticExpanse starCount={100000} />
      </group>

      <group ref={(el) => { if (el) sceneRefs.current[5] = el; }} scale={0}>
        <CosmicWeb particleCount={50000} />
      </group>
    </>
  );
}
```

### Development Time (Scene Manager + Integration)
**Estimated**: 7-10 days

---

## Summary: Development Timeline

| Scale | Description | Days | Cumulative |
|-------|-------------|------|------------|
| Scale 1 | Quantum Field | 3-4 | 3-4 |
| Scale 2 | Atomic Dance | 4-5 | 7-9 |
| Scale 3 | Molecular Network | 3-4 | 10-13 |
| Scale 4 | Orbital Harmony | 5-6 | 15-19 |
| Scale 5 | Galactic Expanse | 4-5 | 19-24 |
| Scale 6 | Cosmic Web | 5-6 | 24-30 |
| Integration | Scene Manager + Transitions | 7-10 | 31-40 |
| Optimization | Performance tuning | 10-14 | 41-54 |
| Testing | Cross-device testing | 7-10 | 48-64 |

**Total Core Development Time**: 48-64 days (10-13 weeks)

**With 2-week buffer**: 62-78 days (12-16 weeks)

---

## Key Takeaways

1. **All scales are technically feasible** with proven techniques
2. **FBO and GPU instancing are critical** for performance
3. **Mobile optimization is non-negotiable** (70-80% particle reduction)
4. **Artistic interpretation is required** for subatomic scale
5. **Modular architecture allows flexibility** (can ship with 4-5 scales)

---

**Ready to build? Start with Scale 1 and test thoroughly before proceeding.**

