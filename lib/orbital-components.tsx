'use client';

import { useRef, useMemo, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── GLSL Noise (Simplex + FBM + Worley) ────────────────────────────────────
export const NOISE_GLSL = /* glsl */ `
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

vec3 hash33(vec3 p){
  p=vec3(dot(p,vec3(127.1,311.7,74.7)),
         dot(p,vec3(269.5,183.3,246.1)),
         dot(p,vec3(113.5,271.9,124.6)));
  return fract(sin(p)*43758.5453123);
}

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
`;

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
export class EllipseCurve3D extends THREE.Curve<THREE.Vector3> {
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
export function createEllipticalTube(
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
export function getElectronPosition(config: OrbitConfig, angle: number): THREE.Vector3 {
  const pos = new THREE.Vector3(
    config.a * Math.cos(angle),
    config.b * Math.sin(angle),
    0
  );
  pos.applyEuler(new THREE.Euler(config.tiltX, config.tiltY, config.tiltZ));
  return pos;
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

  useFrame(() => {
    if (lineObj.material instanceof THREE.LineBasicMaterial) {
      lineObj.material.opacity = opacityRef.current * 0.07;
    }
  });

  return <primitive object={lineObj} />;
}
