'use client';

import { useRef, useMemo, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneProps } from './types';
import { SOLAR_SYSTEM_CONFIG, PlanetConfig } from '@/lib/scene-constants';

interface OrbitalHarmonyProps extends SceneProps {
  solarSystemNodes?: THREE.Vector3[];
  nextTransitionProgress?: number;
  nextTargets?: THREE.Vector3[];
  transitionProgressRef?: MutableRefObject<number>;
  nextTransitionProgressRef?: MutableRefObject<number>;
}

// ─── Moon Configuration ─────────────────────────────────────────────────────
interface MoonConfig {
  name: string;
  radius: number;
  distance: number;
  speed: number;
  color: string;
  tilt: number;
}

const MOON_CONFIG: Record<string, MoonConfig[]> = {
  Earth: [
    { name: 'Moon', radius: 0.18, distance: 1.8, speed: 1.2, color: '#C8C8C8', tilt: 0.09 },
  ],
  Mars: [
    { name: 'Phobos', radius: 0.06, distance: 1.0, speed: 3.0, color: '#8B7D6B', tilt: 0.02 },
    { name: 'Deimos', radius: 0.04, distance: 1.5, speed: 1.8, color: '#9B8B7B', tilt: 0.03 },
  ],
  Jupiter: [
    { name: 'Io', radius: 0.15, distance: 3.8, speed: 2.0, color: '#E8C54A', tilt: 0.05 },
    { name: 'Europa', radius: 0.13, distance: 4.6, speed: 1.5, color: '#C8BFA0', tilt: 0.08 },
    { name: 'Ganymede', radius: 0.2, distance: 5.6, speed: 1.0, color: '#A09080', tilt: 0.03 },
    { name: 'Callisto', radius: 0.18, distance: 6.8, speed: 0.7, color: '#6B6050', tilt: 0.06 },
  ],
  Saturn: [
    { name: 'Titan', radius: 0.2, distance: 5.5, speed: 0.8, color: '#D4A852', tilt: 0.05 },
    { name: 'Rhea', radius: 0.08, distance: 4.2, speed: 1.3, color: '#C0C0C0', tilt: 0.03 },
  ],
  Uranus: [
    { name: 'Titania', radius: 0.1, distance: 3.2, speed: 1.0, color: '#B8B0A0', tilt: 0.04 },
    { name: 'Oberon', radius: 0.09, distance: 3.8, speed: 0.8, color: '#A09890', tilt: 0.06 },
  ],
  Neptune: [
    { name: 'Triton', radius: 0.12, distance: 3.0, speed: -1.2, color: '#B0C8D0', tilt: 0.25 },
  ],
  Pluto: [
    { name: 'Charon', radius: 0.12, distance: 0.8, speed: 0.5, color: '#9B8B7B', tilt: 0.0 },
  ],
};

// ─── GLSL Noise Library (Simplex + Worley + Blackbody) ──────────────────────
const NOISE_GLSL = /* glsl */ `
// --- Simplex 3D Noise ---
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod(i,289.0);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=1.0/7.0;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

float fbm(vec3 p, int octaves){
  float val=0.0;float amp=0.5;float freq=1.0;
  for(int i=0;i<5;i++){
    if(i>=octaves) break;
    val+=amp*snoise(p*freq);
    freq*=2.0;amp*=0.5;
  }
  return val;
}

// --- 3D Hash for Worley noise ---
vec3 hash33(vec3 p){
  p=vec3(dot(p,vec3(127.1,311.7,74.7)),
         dot(p,vec3(269.5,183.3,246.1)),
         dot(p,vec3(113.5,271.9,124.6)));
  return fract(sin(p)*43758.5453123);
}

// --- 3D Worley Noise (returns F1, F2 distances) ---
vec2 worley3D(vec3 p){
  vec3 id=floor(p);
  vec3 fd=fract(p);
  float d1=1.0,d2=1.0;
  for(int x=-1;x<=1;x++)
    for(int y=-1;y<=1;y++)
      for(int z=-1;z<=1;z++){
        vec3 offset=vec3(float(x),float(y),float(z));
        vec3 h=hash33(id+offset);
        vec3 r=offset+h-fd;
        float d=dot(r,r);
        if(d<d1){d2=d1;d1=d;}
        else if(d<d2){d2=d;}
      }
  return vec2(sqrt(d1),sqrt(d2));
}

// --- Blackbody Temperature to RGB (BeRo, valid 1000-40000K) ---
vec3 blackbody(float temp){
  mat3 m=(temp<=6500.0)?
    mat3(vec3(0.0,-2902.2,-8257.8),vec3(0.0,1669.6,2575.3),vec3(1.0,1.33,1.90)):
    mat3(vec3(1745.0,1216.6,-8257.8),vec3(-2666.3,-2173.1,2575.3),vec3(0.56,0.70,1.90));
  return clamp(vec3(m[0]/(vec3(clamp(temp,1000.0,40000.0))+m[1])+m[2]),0.0,1.0);
}
`;

// ─── Shared planet vertex shader with oblateness ─────────────────────────────
const planetVertexShader = (oblateness: number = 0) => `
  ${NOISE_GLSL}
  uniform float uTime;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec3 vWorldNormal;
  void main() {
    vPosition = position;
    vec3 pos = position;
    ${oblateness > 0 ? `pos.y *= ${(1 - oblateness).toFixed(4)};` : ''}
    vNormal = normalize(normalMatrix * normal);
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

// ─── Animated Sun Corona (billboard plane with shader-based wisps) ───────────
function SunCorona({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
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
      <planeGeometry args={[28, 28]} />
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
            float sunEdge = 0.614;

            float glow = 0.12 * exp(-dist * 1.2)
                       + 0.08 * exp(-dist * 0.5)
                       + 0.04 * exp(-dist * 0.2);

            float d = max(dist - sunEdge, 0.0);
            vec3 noiseCoord = vec3(center * 4.0, uTime * 0.06);
            float wisps = pow(fbm(noiseCoord, 3) * 0.5 + 0.5, 2.0);
            glow += 0.03 * wisps * exp(-dist * 0.6);

            float angle = atan(center.y, center.x);
            float streaks = sin(angle * 12.0 + uTime * 0.15) * 0.5 + 0.5;
            streaks *= sin(angle * 7.0 - uTime * 0.1) * 0.5 + 0.5;
            glow += 0.015 * pow(streaks, 3.0) * exp(-dist * 0.4);

            vec3 color = mix(vec3(1.0, 0.6, 0.15), vec3(0.4, 0.1, 0.005), smoothstep(sunEdge * 0.5, sunEdge * 2.0, dist));

            float alpha = glow * uOpacity;
            alpha *= smoothstep(1.0, 0.35, dist);

            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

// ─── Sun Component (Realistic: Worley granulation, limb darkening, sunspots) ─
function Sun({ opacityRef }: { opacityRef: MutableRefObject<number> }) {
  const sunRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);

  const sunUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uIntensity: { value: 1.0 },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
    if (sunRef.current) {
      sunRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
    if (pointLightRef.current) {
      pointLightRef.current.intensity = opacityRef.current * 8.0;
    }
  });

  return (
    <group>
      <SunCorona opacityRef={opacityRef} />

      <mesh ref={sunRef}>
        <icosahedronGeometry args={[4.3, 48]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          depthWrite={false}
          toneMapped={false}
          uniforms={sunUniforms}
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
              float disp1 = fbm(position * 1.5 + uTime * 0.06, 3) * 0.08;
              float disp2 = fbm(position * 3.0 - uTime * 0.04, 2) * 0.03;
              float displacement = disp1 + disp2;
              vec3 newPosition = position + normal * displacement;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
            }
          `}
          fragmentShader={`
            ${NOISE_GLSL}
            uniform float uTime;
            uniform float uOpacity;
            uniform float uIntensity;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vViewDir;

            void main() {
              float mu = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
              vec2 w = worley3D(vPosition * 5.0 + uTime * 0.015);
              float granulation = smoothstep(0.0, 0.4, w.y - w.x);
              vec3 st = vPosition * 2.0;
              vec3 q;
              q.x = fbm(st + vec3(0.0, 0.0, uTime * 0.04), 3);
              q.y = fbm(st + vec3(5.2, 1.3, uTime * 0.04), 3);
              q.z = fbm(st + vec3(1.7, 9.2, uTime * 0.04), 3);
              float turbulence = fbm(st + q * 1.5, 3) * 0.5 + 0.5;
              float surface = mix(granulation, turbulence, 0.4);
              surface = mix(0.15, 1.0, smoothstep(0.1, 0.9, surface));
              float spotNoise = fbm(vPosition * 0.8 + uTime * 0.008, 3) * 0.5 + 0.5;
              float spotDarkening = smoothstep(0.15, 0.25, spotNoise);
              surface *= mix(0.15, 1.0, spotDarkening);
              vec3 centerColor = vec3(6.0, 3.0, 1.0);
              vec3 edgeColor = vec3(1.5, 0.5, 0.08);
              vec3 color = mix(edgeColor, centerColor, pow(mu, 0.35));
              color *= surface;
              color *= pow(mu, 0.15);
              gl_FragColor = vec4(color, uOpacity);
            }
          `}
        />
      </mesh>

      <pointLight
        ref={pointLightRef}
        color="#FFF0DD"
        intensity={0}
        distance={150}
        decay={2}
      />
    </group>
  );
}

// ─── Planet Atmosphere (parameterized) ───────────────────────────────────────
function Atmosphere({
  radius,
  color,
  opacityRef,
  thickness = 1.12,
  power = 3.0,
  density = 0.6,
}: {
  radius: number;
  color: string;
  opacityRef: MutableRefObject<number>;
  thickness?: number;
  power?: number;
  density?: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[radius * thickness, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: 0 },
          uPower: { value: power },
          uDensity: { value: density },
        }}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewDir = normalize(-mvPos.xyz);
            gl_Position = projectionMatrix * mvPos;
          }
        `}
        fragmentShader={`
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uPower;
          uniform float uDensity;
          varying vec3 vNormal;
          varying vec3 vViewDir;
          void main() {
            float fresnel = pow(1.0 - dot(vNormal, vViewDir), uPower);
            gl_FragColor = vec4(uColor, fresnel * uOpacity * uDensity);
          }
        `}
      />
    </mesh>
  );
}

// ─── Ring Component (reusable for Saturn, Uranus) ───────────────────────────
function PlanetRing({
  innerRadius,
  outerRadius,
  opacityRef,
  color = '#B0A080',
  tilt = -1.2,
  ringOpacity = 0.6,
}: {
  innerRadius: number;
  outerRadius: number;
  opacityRef: MutableRefObject<number>;
  color?: string;
  tilt?: number;
  ringOpacity?: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => ({
    uOpacity: { value: 0 },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(color) },
    uRingOpacity: { value: ringOpacity },
  }), [color, ringOpacity]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      materialRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
    // Slow ring rotation around its own axis
    if (meshRef.current) {
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[tilt, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 64]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uOpacity;
          uniform float uTime;
          uniform vec3 uColor;
          uniform float uRingOpacity;
          varying vec2 vUv;
          void main() {
            float t = vUv.y;
            vec3 color = uColor * mix(0.8, 1.2, t);
            float band = smoothstep(0.0, 0.02, abs(sin(t * 40.0)))
                       * smoothstep(0.0, 0.03, abs(sin(t * 25.0 + 1.5)));
            float cassini = smoothstep(0.56, 0.58, t) * (1.0 - smoothstep(0.62, 0.64, t));
            float alpha = band * (1.0 - cassini * 0.8);
            alpha *= smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.9, t);
            alpha *= 0.95 + 0.05 * sin(t * 80.0 + uTime * 0.5);
            gl_FragColor = vec4(color, alpha * uOpacity * uRingOpacity);
          }
        `}
      />
    </mesh>
  );
}

// ─── Moon Component ─────────────────────────────────────────────────────────
function PlanetMoon({ moon, opacityRef }: { moon: MoonConfig; opacityRef: MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const angle = time * moon.speed;
    groupRef.current.position.x = Math.cos(angle) * moon.distance;
    groupRef.current.position.z = Math.sin(angle) * moon.distance;
    groupRef.current.position.y = Math.sin(angle * 0.7) * moon.tilt;
    if (matRef.current) {
      matRef.current.opacity = opacityRef.current;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[moon.radius, 16, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color={moon.color}
          roughness={0.8}
          metalness={0.1}
          emissive={moon.color}
          emissiveIntensity={0.03}
          transparent
          depthWrite
          opacity={0}
        />
      </mesh>
    </group>
  );
}

// ─── Soft edge fade snippet (added to all planet fragment shaders) ──────────
// Fades planet edges to prevent hard border against dark background
const EDGE_FADE_GLSL = `
  // Soft edge fade — prevents hard circle border
  float edgeFade = smoothstep(0.0, 0.15, mu);
`;

// ─── Mercury — Cratered Grey World ──────────────────────────────────────────
function MercuryPlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader()}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(vViewDir);
            float mu = max(dot(N, V), 0.0);
            ${EDGE_FADE_GLSL}

            vec2 w1 = worley3D(vPosition * 8.0);
            vec2 w2 = worley3D(vPosition * 25.0);
            float craters = smoothstep(0.0, 0.3, w1.x) * 0.7 + smoothstep(0.0, 0.2, w2.x) * 0.3;

            float terrain = fbm(vPosition * 4.0, 3) * 0.5 + 0.5;
            vec3 darkGrey = vec3(0.31, 0.30, 0.32);
            vec3 lightGrey = vec3(0.91, 0.91, 0.93);
            vec3 color = mix(darkGrey, lightGrey, terrain * 0.6);
            color *= mix(0.5, 1.0, craters);

            float NdL = max(dot(N, uSunDir), 0.0);
            color *= NdL * 0.85 + 0.15;

            gl_FragColor = vec4(color, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Venus — Glowing Cloud Sphere ───────────────────────────────────────────
function VenusPlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader()}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            float mu = max(dot(N, normalize(vViewDir)), 0.0);
            ${EDGE_FADE_GLSL}

            vec3 st = vPosition * 3.0;
            vec3 q;
            q.x = fbm(st + vec3(0.0, 0.0, uTime * 0.01), 4);
            q.y = fbm(st + vec3(5.2, 1.3, uTime * 0.01), 4);
            q.z = fbm(st + vec3(1.7, 9.2, uTime * 0.01), 4);
            float clouds = fbm(st + q * 2.0, 4) * 0.5 + 0.5;

            vec3 color1 = vec3(0.87, 0.85, 0.83);
            vec3 color2 = vec3(0.97, 0.89, 0.69);
            vec3 color = mix(color1, color2, clouds);

            float NdL = max(dot(N, uSunDir), 0.0);
            color *= NdL * 0.4 + 0.6;

            gl_FragColor = vec4(color, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Earth — The Showcase ───────────────────────────────────────────────────
function EarthPlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader()}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            vec3 V = normalize(vViewDir);
            float mu = max(dot(N, V), 0.0);
            ${EDGE_FADE_GLSL}
            vec3 pos = normalize(vPosition);

            float continent = fbm(vPosition * 3.0, 4) * 0.5 + 0.5;
            float landMask = smoothstep(0.45, 0.55, continent);

            vec3 deepOcean = vec3(0.067, 0.125, 0.357);
            vec3 shallowOcean = vec3(0.42, 0.58, 0.84);
            float oceanDepth = fbm(vPosition * 6.0, 2) * 0.5 + 0.5;
            vec3 ocean = mix(deepOcean, shallowOcean, oceanDepth * 0.4);

            vec3 green = vec3(0.29, 0.48, 0.24);
            vec3 brown = vec3(0.55, 0.42, 0.24);
            vec3 desert = vec3(0.82, 0.72, 0.50);
            float biome = fbm(vPosition * 5.0 + 10.0, 3) * 0.5 + 0.5;
            vec3 land = mix(green, brown, biome);
            land = mix(land, desert, smoothstep(0.7, 0.9, biome));

            float polar = smoothstep(0.65, 0.85, abs(pos.y));
            float iceNoise = fbm(vPosition * 8.0, 2) * 0.5 + 0.5;
            polar *= smoothstep(0.3, 0.6, iceNoise);

            vec3 surface = mix(ocean, land, landMask);
            surface = mix(surface, vec3(0.95, 0.97, 1.0), polar);

            float cloudNoise = fbm(vPosition * 4.0 + uTime * 0.02, 4) * 0.5 + 0.5;
            float clouds = smoothstep(0.45, 0.7, cloudNoise);
            surface = mix(surface, vec3(1.0), clouds * 0.35);

            float NdL = max(dot(N, uSunDir), 0.0);
            surface *= NdL * 0.8 + 0.2;

            vec3 R = reflect(-uSunDir, N);
            float spec = pow(max(dot(V, R), 0.0), 32.0) * (1.0 - landMask) * (1.0 - clouds);
            surface += vec3(0.3, 0.4, 0.5) * spec * NdL;

            gl_FragColor = vec4(surface, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Mars — Red Desert ──────────────────────────────────────────────────────
function MarsPlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader()}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            float mu = max(dot(N, normalize(vViewDir)), 0.0);
            ${EDGE_FADE_GLSL}
            vec3 pos = normalize(vPosition);

            float terrain = fbm(vPosition * 4.0, 4) * 0.5 + 0.5;

            vec3 rust = vec3(0.76, 0.27, 0.055);
            vec3 orange = vec3(0.91, 0.49, 0.067);
            vec3 darkRock = vec3(0.4, 0.22, 0.15);
            vec3 color = mix(darkRock, rust, smoothstep(0.2, 0.5, terrain));
            color = mix(color, orange, smoothstep(0.5, 0.8, terrain));

            float polar = smoothstep(0.75, 0.95, abs(pos.y));
            float iceNoise = fbm(vPosition * 10.0, 2) * 0.5 + 0.5;
            polar *= smoothstep(0.3, 0.5, iceNoise);
            color = mix(color, vec3(0.92, 0.95, 0.98), polar);

            float NdL = max(dot(N, uSunDir), 0.0);
            color *= NdL * 0.85 + 0.15;

            gl_FragColor = vec4(color, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Jupiter — The Showpiece ────────────────────────────────────────────────
function JupiterPlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader(config.oblateness || 0)}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            float mu = max(dot(N, normalize(vViewDir)), 0.0);
            ${EDGE_FADE_GLSL}
            vec3 pos = normalize(vPosition);
            float lat = pos.y;

            float bandBase = sin(lat * 28.0);
            float bandPerturb = fbm(vec3(lat * 10.0, vPosition.x * 3.0, uTime * 0.02), 3) * 0.15;
            float band = smoothstep(-0.1, 0.1, bandBase + bandPerturb);

            vec3 cream = vec3(0.87, 0.86, 0.82);
            vec3 brownBelt = vec3(0.78, 0.55, 0.23);
            vec3 darkBelt = vec3(0.56, 0.38, 0.30);
            vec3 color = mix(brownBelt, cream, band);

            float swirl = fbm(vPosition * 6.0 + vec3(uTime * 0.015, 0.0, 0.0), 3) * 0.5 + 0.5;
            color = mix(color, darkBelt, swirl * 0.15);

            float spotLat = -0.37;
            vec2 spotCenter = vec2(0.5, spotLat);
            vec2 spotPos = vec2(atan(pos.x, pos.z) / 6.2832 + 0.5, lat);
            float spotDist = length((spotPos - spotCenter) * vec2(1.0, 2.5));
            float spotMask = 1.0 - smoothstep(0.06, 0.12, spotDist);
            float spotSwirl = fbm(vec3(spotPos * 30.0, uTime * 0.03), 3) * 0.5 + 0.5;
            vec3 spotColor = mix(vec3(0.71, 0.36, 0.24), vec3(0.85, 0.50, 0.30), spotSwirl);
            color = mix(color, spotColor, spotMask);

            float NdL = max(dot(N, uSunDir), 0.0);
            color *= NdL * 0.75 + 0.25;

            gl_FragColor = vec4(color, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Saturn — Elegant Gas Giant ─────────────────────────────────────────────
function SaturnPlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader(config.oblateness || 0)}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            float mu = max(dot(N, normalize(vViewDir)), 0.0);
            ${EDGE_FADE_GLSL}
            vec3 pos = normalize(vPosition);
            float lat = pos.y;

            float bandBase = sin(lat * 16.0);
            float bandPerturb = fbm(vec3(lat * 8.0, vPosition.x * 2.0, uTime * 0.015), 3) * 0.1;
            float band = smoothstep(-0.15, 0.15, bandBase + bandPerturb);

            vec3 gold1 = vec3(0.89, 0.77, 0.54);
            vec3 gold2 = vec3(0.93, 0.86, 0.68);
            vec3 gold3 = vec3(0.77, 0.67, 0.43);
            vec3 color = mix(gold1, gold2, band);

            float turb = fbm(vPosition * 5.0 + uTime * 0.01, 3) * 0.5 + 0.5;
            color = mix(color, gold3, turb * 0.1);

            float NdL = max(dot(N, uSunDir), 0.0);
            color *= NdL * 0.75 + 0.25;

            gl_FragColor = vec4(color, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Uranus — The Tilted Ice Giant ──────────────────────────────────────────
function UranusPlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader(config.oblateness || 0)}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            float mu = max(dot(N, normalize(vViewDir)), 0.0);
            ${EDGE_FADE_GLSL}
            vec3 pos = normalize(vPosition);

            vec3 baseColor = vec3(0.69, 0.86, 0.96);

            float lat = pos.y;
            float band = sin(lat * 14.0) * 0.02;
            float noise = fbm(vPosition * 4.0, 2) * 0.02;
            baseColor += vec3(band + noise);

            float polarBright = smoothstep(0.6, 0.9, pos.y);
            baseColor += vec3(0.08, 0.06, 0.04) * polarBright;

            float NdL = max(dot(N, uSunDir), 0.0);
            baseColor *= NdL * 0.7 + 0.3;

            gl_FragColor = vec4(baseColor, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Neptune — The Windy Blue Giant ─────────────────────────────────────────
function NeptunePlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader(config.oblateness || 0)}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            float mu = max(dot(N, normalize(vViewDir)), 0.0);
            ${EDGE_FADE_GLSL}
            vec3 pos = normalize(vPosition);
            float lat = pos.y;

            vec3 blue1 = vec3(0.24, 0.40, 0.98);
            vec3 blue2 = vec3(0.13, 0.27, 0.67);

            float bandBase = sin(lat * 20.0);
            float band = smoothstep(-0.2, 0.2, bandBase);
            vec3 color = mix(blue2, blue1, band * 0.5 + 0.5);

            float cloudLat = smoothstep(-0.5, -0.2, lat) * smoothstep(0.5, 0.2, lat);
            float cloudNoise = fbm(vec3(vPosition.x * 8.0 + uTime * 0.1, lat * 15.0, vPosition.z * 8.0), 3) * 0.5 + 0.5;
            float clouds = smoothstep(0.6, 0.8, cloudNoise) * cloudLat;
            color = mix(color, vec3(0.9, 0.95, 1.0), clouds * 0.25);

            float spotLat = -0.34;
            vec2 spotCenter = vec2(0.3, spotLat);
            vec2 spotPos = vec2(atan(pos.x, pos.z) / 6.2832 + 0.5, lat);
            float spotDist = length((spotPos - spotCenter) * vec2(1.0, 2.0));
            float spotMask = 1.0 - smoothstep(0.04, 0.09, spotDist);
            vec3 darkSpot = vec3(0.10, 0.13, 0.40);
            color = mix(color, darkSpot, spotMask * 0.7);
            float border = smoothstep(0.09, 0.12, spotDist) * (1.0 - smoothstep(0.12, 0.16, spotDist));
            color = mix(color, vec3(0.6, 0.7, 1.0), border * 0.3);

            float NdL = max(dot(N, uSunDir), 0.0);
            color *= NdL * 0.75 + 0.25;

            gl_FragColor = vec4(color, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Pluto — The Heart World ────────────────────────────────────────────────
function PlutoPlanet({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
    uSunDir: { value: new THREE.Vector3(1, 0.3, 0.5).normalize() },
  }), []);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 48, 48]} />
      <shaderMaterial
        ref={matRef}
        transparent
        depthWrite
        uniforms={uniforms}
        vertexShader={planetVertexShader()}
        fragmentShader={`
          ${NOISE_GLSL}
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uSunDir;
          varying vec3 vPosition;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vec3 N = normalize(vNormal);
            float mu = max(dot(N, normalize(vViewDir)), 0.0);
            ${EDGE_FADE_GLSL}
            vec3 pos = normalize(vPosition);

            vec3 baseBrown = vec3(0.33, 0.26, 0.22);
            vec3 baseTan = vec3(0.55, 0.45, 0.35);
            float terrain = fbm(vPosition * 6.0, 3) * 0.5 + 0.5;
            vec3 color = mix(baseBrown, baseTan, terrain);

            float h1 = 1.0 - length(pos.xz - vec2(0.10, 0.55)) / 0.28;
            float h2 = 1.0 - length(pos.xz - vec2(-0.10, 0.55)) / 0.28;
            float heartMask = max(h1, h2);
            heartMask = smoothstep(0.0, 0.4, heartMask);
            vec3 ice = vec3(1.0, 0.95, 0.83);
            color = mix(color, ice, heartMask * 0.85);

            float eqBand = smoothstep(0.3, 0.1, abs(pos.y));
            float darkNoise = fbm(vPosition * 5.0 + 20.0, 3) * 0.5 + 0.5;
            float cthulhu = eqBand * smoothstep(0.3, 0.6, darkNoise);
            float oppositeSide = smoothstep(0.0, -0.3, pos.z);
            cthulhu *= oppositeSide;
            vec3 darkRegion = vec3(0.15, 0.01, 0.05);
            color = mix(color, darkRegion, cthulhu * 0.5);

            float NdL = max(dot(N, uSunDir), 0.0);
            color *= NdL * 0.6 + 0.3;

            gl_FragColor = vec4(color, uOpacity * edgeFade);
          }
        `}
      />
    </mesh>
  );
}

// ─── Starfield with varying brightness and occasional shooting stars ────────
function Starfield({ opacityRef, count = 3000 }: { opacityRef: MutableRefObject<number>; count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const shootingRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const shootingMatRef = useRef<THREE.ShaderMaterial>(null);

  const starData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const brightness = new Float32Array(count);
    const twinkleSpeed = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 120 + Math.random() * 130;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const sizeRand = Math.random();
      if (sizeRand < 0.7) {
        sizes[i] = 0.4 + Math.random() * 0.6;
        brightness[i] = 0.4 + Math.random() * 0.3;
      } else if (sizeRand < 0.92) {
        sizes[i] = 1.0 + Math.random() * 1.2;
        brightness[i] = 0.6 + Math.random() * 0.3;
      } else {
        sizes[i] = 1.8 + Math.random() * 2.0;
        brightness[i] = 0.85 + Math.random() * 0.15;
      }
      twinkleSpeed[i] = 0.5 + Math.random() * 3.0;
    }
    return { positions, sizes, brightness, twinkleSpeed };
  }, [count]);

  // Shooting stars: 5 pre-allocated trails
  const shootingData = useMemo(() => {
    const positions = new Float32Array(5 * 3);
    const velocities = new Float32Array(5 * 3);
    const lifetimes = new Float32Array(5);
    const sizes = new Float32Array(5);

    for (let i = 0; i < 5; i++) {
      lifetimes[i] = -Math.random() * 20;
      sizes[i] = 2.0 + Math.random() * 2.0;
    }
    return { positions, velocities, lifetimes, sizes };
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
  }), []);

  const shootingUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uOpacity: { value: 1 },
  }), []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = time;
      matRef.current.uniforms.uOpacity.value = opacityRef.current;
    }

    if (shootingRef.current && shootingMatRef.current) {
      shootingMatRef.current.uniforms.uTime.value = time;
      shootingMatRef.current.uniforms.uOpacity.value = opacityRef.current;
      const geo = shootingRef.current.geometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      const dt = state.clock.getDelta() || 0.016;

      for (let i = 0; i < 5; i++) {
        shootingData.lifetimes[i] += dt;

        if (shootingData.lifetimes[i] > 2.0) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 100 + Math.random() * 50;
          pos.setXYZ(i,
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
          );
          const speed = 30 + Math.random() * 40;
          shootingData.velocities[i * 3] = (Math.random() - 0.5) * speed;
          shootingData.velocities[i * 3 + 1] = (Math.random() - 0.5) * speed;
          shootingData.velocities[i * 3 + 2] = (Math.random() - 0.5) * speed;
          shootingData.lifetimes[i] = -5 - Math.random() * 15;
        } else if (shootingData.lifetimes[i] > 0) {
          pos.setXYZ(i,
            pos.getX(i) + shootingData.velocities[i * 3] * dt,
            pos.getY(i) + shootingData.velocities[i * 3 + 1] * dt,
            pos.getZ(i) + shootingData.velocities[i * 3 + 2] * dt
          );
        }
      }
      pos.needsUpdate = true;
    }
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starData.positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[starData.sizes, 1]} />
          <bufferAttribute attach="attributes-aBrightness" args={[starData.brightness, 1]} />
          <bufferAttribute attach="attributes-aTwinkleSpeed" args={[starData.twinkleSpeed, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={`
            attribute float aSize;
            attribute float aBrightness;
            attribute float aTwinkleSpeed;
            varying float vBrightness;
            varying float vTwinkleSpeed;
            uniform float uTime;
            void main() {
              vBrightness = aBrightness;
              vTwinkleSpeed = aTwinkleSpeed;
              vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = aSize * (250.0 / -mvPos.z);
              gl_Position = projectionMatrix * mvPos;
            }
          `}
          fragmentShader={`
            uniform float uTime;
            uniform float uOpacity;
            varying float vBrightness;
            varying float vTwinkleSpeed;
            void main() {
              float d = length(gl_PointCoord - 0.5) * 2.0;
              if (d > 1.0) discard;
              float alpha = 1.0 - d * d;

              float twinkle = 0.6 + 0.4 * sin(uTime * vTwinkleSpeed + vBrightness * 100.0);

              vec3 color = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.93, 0.8), vBrightness);

              gl_FragColor = vec4(color * 1.3, alpha * vBrightness * twinkle * uOpacity);
            }
          `}
        />
      </points>

      <points ref={shootingRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[shootingData.positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[shootingData.sizes, 1]} />
          <bufferAttribute attach="attributes-aLifetime" args={[shootingData.lifetimes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={shootingMatRef}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={shootingUniforms}
          vertexShader={`
            attribute float aSize;
            attribute float aLifetime;
            varying float vLife;
            void main() {
              vLife = aLifetime;
              vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
              float visible = step(0.0, aLifetime) * step(aLifetime, 2.0);
              gl_PointSize = aSize * visible * (300.0 / -mvPos.z);
              gl_Position = projectionMatrix * mvPos;
            }
          `}
          fragmentShader={`
            uniform float uOpacity;
            varying float vLife;
            void main() {
              float d = length(gl_PointCoord - 0.5) * 2.0;
              if (d > 1.0) discard;

              float fade = smoothstep(0.0, 0.1, vLife) * smoothstep(2.0, 0.5, vLife);
              float alpha = (1.0 - d) * fade;

              vec3 color = vec3(1.0, 0.98, 0.9);
              gl_FragColor = vec4(color, alpha * uOpacity);
            }
          `}
        />
      </points>
    </group>
  );
}

// ─── Planet Dispatcher ──────────────────────────────────────────────────────
function PlanetBody({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  switch (config.name) {
    case 'Mercury': return <MercuryPlanet config={config} opacityRef={opacityRef} />;
    case 'Venus': return <VenusPlanet config={config} opacityRef={opacityRef} />;
    case 'Earth': return <EarthPlanet config={config} opacityRef={opacityRef} />;
    case 'Mars': return <MarsPlanet config={config} opacityRef={opacityRef} />;
    case 'Jupiter': return <JupiterPlanet config={config} opacityRef={opacityRef} />;
    case 'Saturn': return <SaturnPlanet config={config} opacityRef={opacityRef} />;
    case 'Uranus': return <UranusPlanet config={config} opacityRef={opacityRef} />;
    case 'Neptune': return <NeptunePlanet config={config} opacityRef={opacityRef} />;
    case 'Pluto': return <PlutoPlanet config={config} opacityRef={opacityRef} />;
    default: return <PlanetBodyDefault config={config} opacityRef={opacityRef} />;
  }
}

function PlanetBodyDefault({ config, opacityRef }: { config: PlanetConfig; opacityRef: MutableRefObject<number> }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.opacity = opacityRef.current;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[config.radius, 32, 32]} />
      <meshStandardMaterial ref={matRef} color={config.color} transparent depthWrite opacity={0} />
    </mesh>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function OrbitalHarmony({
  particleCount: _particleCount,
  isActive: _isActive,
  transitionProgress = 0,
  solarSystemNodes: _solarSystemNodes = [],
  nextTransitionProgress = 0,
  nextTargets: _nextTargets = [],
  transitionProgressRef,
  nextTransitionProgressRef,
}: OrbitalHarmonyProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const planetsRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);

  const planets = SOLAR_SYSTEM_CONFIG;

  useFrame((state) => {
    if (!groupRef.current) return;

    const tp = transitionProgressRef ? transitionProgressRef.current : transitionProgress;
    const ntp = nextTransitionProgressRef ? nextTransitionProgressRef.current : nextTransitionProgress;

    // Fade out quickly on exit so galaxy morph is visible (matches atom/molecule pattern)
    opacityRef.current = tp * Math.max(1 - ntp * 2.5, 0);

    if (tp === 0 && ntp === 0) return;

    const time = state.clock.elapsedTime;

    if (sunGroupRef.current) {
      const scale = 1 + Math.sin(time * 1.5) * 0.02;
      sunGroupRef.current.scale.setScalar(scale);
    }

    if (planetsRef.current) {
      planetsRef.current.children.forEach((child, index) => {
        const planet = planets[index];
        if (!planet) return;
        const angle = time * planet.speed * 0.3 + index * 1.2;
        const ecc = planet.eccentricity;
        const r = planet.distance * (1 - ecc * ecc) / (1 + ecc * Math.cos(angle));
        child.position.x = Math.cos(angle) * r;
        child.position.z = Math.sin(angle) * r;
        // Spin the planet mesh (first child of the group)
        const planetMesh = child.children[0];
        if (planetMesh) {
          const rotSpeed = planet.rotationSpeed ?? 0.5;
          planetMesh.rotation.y = time * rotSpeed;
        }
      });
    }

    // Animate position from molecule's y=3.5 to solar's y=8 during entry
    const posProgress = Math.min(tp * 2, 1);
    const easedPos = posProgress * posProgress * (3 - 2 * posProgress);
    groupRef.current.position.y = THREE.MathUtils.lerp(3.5, 8, easedPos);

    // No shrink on exit — stay in place so galaxy can morph from solar system
    const entryScale = THREE.MathUtils.lerp(0.1, 1, tp);
    groupRef.current.scale.setScalar(entryScale);
  });

  return (
    <group ref={groupRef} position={[0, 3.5, 0]} rotation={[0.524, 0.1, 0.02]} scale={0.75}>
      {/* Background starfield */}
      <Starfield opacityRef={opacityRef} />

      {/* Sun with fiery shader + corona + point light */}
      <group ref={sunGroupRef}>
        <Sun opacityRef={opacityRef} />
      </group>

      {/* Planets with procedural shaders */}
      <group ref={planetsRef}>
        {planets.map((planet, i) => (
          <group
            key={i}
            position={[planet.distance, 0, 0]}
            rotation={[0, 0, planet.axialTilt ?? 0]}
          >
            <PlanetBody config={planet} opacityRef={opacityRef} />
            {planet.hasAtmosphere && planet.atmosphereColor && (
              <Atmosphere
                radius={planet.radius}
                color={planet.atmosphereColor}
                opacityRef={opacityRef}
                thickness={planet.atmosphereThickness}
                power={planet.atmospherePower}
                density={planet.atmosphereDensity}
              />
            )}
            {planet.hasRing && (
              <PlanetRing
                innerRadius={planet.radius * (planet.name === 'Uranus' ? 1.6 : 1.4)}
                outerRadius={planet.radius * (planet.name === 'Uranus' ? 2.0 : 2.4)}
                opacityRef={opacityRef}
                color={planet.ringColor ?? '#B0A080'}
                ringOpacity={planet.name === 'Uranus' ? 0.3 : 0.6}
              />
            )}
            {/* Moons */}
            {MOON_CONFIG[planet.name]?.map((moon, j) => (
              <PlanetMoon key={j} moon={moon} opacityRef={opacityRef} />
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
