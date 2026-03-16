'use client';

import { useRef, useMemo, useEffect, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NOISE_GLSL } from '@/lib/shaders/noise.glsl';

// Re-export for consumers that import from this module
export { NOISE_GLSL };

// ─── Orbit Configuration ────────────────────────────────────────────────────
export interface OrbitConfig {
  a: number;
  b: number;
  tiltX: number;
  tiltY: number;
  tiltZ: number;
  speed: number;
  trail: number;
}

// ─── Custom Ellipse Curve for TubeGeometry ──────────────────────────────────
class EllipseCurve3D extends THREE.Curve<THREE.Vector3> {
  a: number;
  b: number;
  euler: THREE.Euler;

  constructor(a: number, b: number, tiltX: number, tiltY: number, tiltZ: number) {
    super();
    this.a = a;
    this.b = b;
    this.euler = new THREE.Euler(tiltX, tiltY, tiltZ);
  }

  getPoint(t: number, optionalTarget?: THREE.Vector3): THREE.Vector3 {
    const point = optionalTarget || new THREE.Vector3();
    const angle = t * Math.PI * 2;
    point.set(
      this.a * Math.cos(angle),
      this.b * Math.sin(angle),
      0
    );
    point.applyEuler(this.euler);
    return point;
  }
}

// ─── Helper: Create elliptical tube geometry with angle attribute ───────────
function createEllipticalTube(
  config: OrbitConfig,
  tubeRadius: number,
  segments: number,
  radialSegments: number
): { geometry: THREE.TubeGeometry; angleAttr: Float32Array } {
  const curve = new EllipseCurve3D(config.a, config.b, config.tiltX, config.tiltY, config.tiltZ);
  const geometry = new THREE.TubeGeometry(curve, segments, tubeRadius, radialSegments, true);

  const positions = geometry.attributes.position;
  const angleAttr = new Float32Array(positions.count);
  const euler = new THREE.Euler(config.tiltX, config.tiltY, config.tiltZ);
  const rotMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
  const inverseMatrix = rotMatrix.clone().invert();

  for (let i = 0; i < positions.count; i++) {
    const v = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    );
    v.applyMatrix4(inverseMatrix);
    const angle = Math.atan2(v.y / config.b, v.x / config.a);
    angleAttr[i] = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }

  geometry.setAttribute('aAngle', new THREE.BufferAttribute(angleAttr, 1));
  return { geometry, angleAttr };
}

// ─── Helper: Get position on ellipse at given angle ─────────────────────────
// Reuse objects to avoid per-frame garbage collection pressure
const _electronPos = new THREE.Vector3();
const _electronEuler = new THREE.Euler();

function getElectronPosition(config: OrbitConfig, angle: number): THREE.Vector3 {
  _electronPos.set(
    config.a * Math.cos(angle),
    config.b * Math.sin(angle),
    0
  );
  _electronEuler.set(config.tiltX, config.tiltY, config.tiltZ);
  _electronPos.applyEuler(_electronEuler);
  return _electronPos;
}

// ─── Orbit Trail (fading "light painting" effect) ───────────────────────────
export function OrbitTrail({ config, index, opacityRef, color = '#cc1100' }: {
  config: OrbitConfig;
  index: number;
  opacityRef: MutableRefObject<number>;
  color?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const { geometry, material } = useMemo(() => {
    const { geometry } = createEllipticalTube(config, 0.04, 128, 8);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      uniforms: {
        uElectronAngle: { value: 0 },
        uTrailLength: { value: config.trail },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 1 },
      },
      vertexShader: `
        attribute float aAngle;
        uniform float uElectronAngle;
        uniform float uTrailLength;
        varying float vTrailAlpha;

        void main() {
          float angleDiff = mod(uElectronAngle - aAngle + 6.28318, 6.28318);
          float trailArc = uTrailLength * 6.28318;
          vTrailAlpha = 1.0 - smoothstep(0.0, trailArc, angleDiff);
          vTrailAlpha = pow(vTrailAlpha, 2.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vTrailAlpha;

        void main() {
          if (vTrailAlpha < 0.01) discard;
          vec3 brightColor = vec3(1.0, 0.3, 0.1);
          vec3 color = mix(uColor, brightColor, vTrailAlpha * vTrailAlpha);
          float intensity = 1.0 + vTrailAlpha * 2.0;
          gl_FragColor = vec4(color * intensity, vTrailAlpha * uOpacity);
        }
      `,
    });
    return { geometry, material };
  }, [config, color]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const angle = ((time * config.speed + index * 1.2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    material.uniforms.uElectronAngle.value = angle;
    material.uniforms.uOpacity.value = opacityRef.current;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

// ─── Procedural Electron (mini-sun with corona glow) ────────────────────────
export function ProceduralElectron({ config, index, opacityRef }: {
  config: OrbitConfig;
  index: number;
  opacityRef: MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const sphereMatRef = useRef<THREE.ShaderMaterial>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const coronaMatRef = useRef<THREE.ShaderMaterial>(null);

  const sphereUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
  }), []);

  const coronaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const angle = ((time * config.speed + index * 1.2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const pos = getElectronPosition(config, angle);
    groupRef.current.position.copy(pos);

    if (sphereMatRef.current) {
      sphereMatRef.current.uniforms.uTime.value = time;
      sphereMatRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
    if (coronaRef.current) {
      coronaRef.current.quaternion.copy(state.camera.quaternion);
    }
    if (coronaMatRef.current) {
      coronaMatRef.current.uniforms.uTime.value = time;
      coronaMatRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[0.1, 16]} />
        <shaderMaterial
          ref={sphereMatRef}
          transparent
          depthWrite={false}
          toneMapped={false}
          uniforms={sphereUniforms}
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
              float disp = fbm(position * 5.0 + uTime * 0.15, 2) * 0.01;
              vec3 newPos = position + normal * disp;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
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
              vec2 w = worley3D(vPosition * 12.0 + uTime * 0.03);
              float granulation = smoothstep(0.0, 0.4, w.y - w.x);
              float turbulence = fbm(vPosition * 6.0 + uTime * 0.08, 2) * 0.5 + 0.5;
              float surface = mix(granulation, turbulence, 0.5);
              surface = mix(0.3, 1.0, surface);
              vec3 centerColor = vec3(5.0, 1.5, 0.4);
              vec3 edgeColor = vec3(2.0, 0.3, 0.05);
              vec3 color = mix(edgeColor, centerColor, pow(mu, 0.4));
              color *= surface;
              color *= pow(mu, 0.2);
              gl_FragColor = vec4(color, uOpacity);
            }
          `}
        />
      </mesh>

      <mesh ref={coronaRef}>
        <planeGeometry args={[0.6, 0.6]} />
        <shaderMaterial
          ref={coronaMatRef}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          uniforms={coronaUniforms}
          vertexShader={`
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uOpacity;
            varying vec2 vUv;

            void main() {
              vec2 center = vUv - 0.5;
              float dist = length(center) * 2.0;
              float glow = 0.5 * exp(-dist * 4.0)
                         + 0.3 * exp(-dist * 1.5)
                         + 0.1 * exp(-dist * 0.6);
              glow *= 1.0 + 0.08 * sin(uTime * 3.0);
              vec3 color = mix(vec3(2.0, 0.8, 0.3), vec3(1.5, 0.2, 0.03), dist);
              float alpha = glow * uOpacity;
              alpha *= smoothstep(1.0, 0.0, dist);
              gl_FragColor = vec4(color * glow, alpha);
            }
          `}
        />
      </mesh>
    </group>
  );
}

// ─── Orbit Path (subtle full ring) ──────────────────────────────────────────
export function OrbitPath({ config, opacityRef, color = '#cc1100' }: {
  config: OrbitConfig;
  opacityRef: MutableRefObject<number>;
  color?: string;
}) {
  const points = useMemo(() => {
    const curve = new EllipseCurve3D(config.a, config.b, config.tiltX, config.tiltY, config.tiltZ);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      pts.push(curve.getPoint(i / 128));
    }
    return pts;
  }, [config]);

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    return geom;
  }, [points]);

  const lineObj = useMemo(() => {
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Line(lineGeometry, mat);
  }, [lineGeometry, color]);

  useEffect(() => {
    return () => {
      lineGeometry.dispose();
      if (lineObj.material instanceof THREE.LineBasicMaterial) {
        lineObj.material.dispose();
      }
    };
  }, [lineGeometry, lineObj]);

  useFrame(() => {
    if (lineObj.material instanceof THREE.LineBasicMaterial) {
      lineObj.material.opacity = opacityRef.current * 0.07;
    }
  });

  return <primitive object={lineObj} />;
}
