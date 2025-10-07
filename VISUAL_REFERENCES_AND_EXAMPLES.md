# Visual References & Code Examples - Quantum to Cosmic Animation

## 🎨 Curated Visual References

### Category 1: Scale Journey Inspirations

#### 1. Powers of Ten (1977) - Charles & Ray Eames
**URL**: https://www.youtube.com/watch?v=0fKBhvDjuy0
**Why It's Relevant**:
- The original and most iconic scale journey
- Demonstrates the power of continuous zoom
- Shows how to maintain visual interest across 40 orders of magnitude
- Proves the concept works for storytelling

**Key Takeaways**:
- Smooth, continuous motion is essential
- Each scale needs a "moment" to be appreciated
- Narration helps but visuals should stand alone
- Black background works perfectly for space scales

---

#### 2. Scale of the Universe - Huang Twins
**URL**: https://scaleofuniverse.com
**Why It's Relevant**:
- Interactive web-based implementation
- Covers quantum to cosmic scale
- Proven to be engaging (millions of users)
- Shows what's possible with web technology

**Key Takeaways**:
- Slider interaction is intuitive
- 2D can be as effective as 3D
- Educational content enhances experience
- Performance is achievable with optimization

**Technical Notes**:
- Built with Pixi.js (2D WebGL)
- Uses pre-rendered images
- Smooth zoom interpolation
- Minimal particle effects

---

#### 3. Cosmic Zoom (1968) - Eva Szasz
**URL**: https://www.youtube.com/watch?v=VgfwCrKe_Fk
**Why It's Relevant**:
- Pioneering animation predating Powers of Ten
- Hand-drawn, showing artistic interpretation works
- Demonstrates narrative pacing

**Key Takeaways**:
- Artistic license is acceptable
- Pacing matters more than accuracy
- Visual metaphors communicate effectively

---

### Category 2: WebGL Scroll Experiences

#### 4. Bruno Simon Portfolio
**URL**: https://bruno-simon.com
**Why It's Relevant**:
- Award-winning 3D scroll experience
- Excellent performance optimization
- Creative use of Three.js
- Proves complex 3D can work on web

**Key Takeaways**:
- Playful interaction increases engagement
- Physics simulation adds life
- Loading screen manages expectations
- Mobile version is simplified

**Technical Stack**:
- Three.js
- Cannon.js (physics)
- Custom scroll controls
- Optimized 3D models

---

#### 5. Active Theory - Case Studies
**URL**: https://activetheory.net
**Why It's Relevant**:
- Professional-grade WebGL work
- Scroll-based 3D transitions
- Multiple award-winning projects
- Shows what's possible with budget

**Key Takeaways**:
- Smooth transitions are their signature
- Each project has unique 3D approach
- Performance is never compromised
- Mobile experiences are thoughtfully adapted

**Notable Projects**:
- Xbox Halo 5 Visualizer (particle systems)
- Prometheus (scroll-based 3D)
- Various immersive experiences

---

#### 6. Lusion.co
**URL**: https://lusion.co
**Why It's Relevant**:
- Your reference #1
- Creative WebGL approach
- Innovative visual design
- Balances art and performance

**Key Takeaways**:
- Custom shaders create unique look
- Subtle animations are powerful
- Black background enhances 3D
- Loading states are designed

---

#### 7. iLabsolutions.it
**URL**: https://www.ilabsolutions.it
**Why It's Relevant**:
- Your top favorite
- Excellent overall look and feel
- Smooth scroll animations
- Professional execution

**Key Takeaways**:
- Consistency in design language
- Smooth transitions throughout
- 3D elements enhance, don't dominate
- Performance is excellent

---

### Category 3: Scientific Visualizations

#### 8. NASA Scientific Visualization Studio
**URL**: https://svs.gsfc.nasa.gov
**Why It's Relevant**:
- Scientifically accurate space visualizations
- High-quality renders and animations
- Free to use (public domain)
- Shows realistic solar system, galaxy, universe

**Key Resources**:
- Milky Way structure visualizations
- Solar system animations
- Cosmic web simulations
- Texture maps for planets

**Usage**:
- Download textures for planets
- Reference for accurate colors
- Study camera movements
- Understand scale relationships

---

#### 9. MIT - Visualizing the Proton
**URL**: https://science.mit.edu/visualizing-the-proton-through-animation-and-film/
**Why It's Relevant**:
- Artistic interpretation of quantum physics
- Shows how to visualize the invisible
- Balances accuracy with aesthetics

**Key Takeaways**:
- Color coding helps distinguish particles
- Motion conveys energy and uncertainty
- Abstract representation is acceptable
- Collaboration with physicists ensures credibility

---

#### 10. 3Dmol.js - Molecular Visualization
**URL**: https://3dmol.csb.pitt.edu
**Why It's Relevant**:
- Open-source WebGL molecular viewer
- Shows how to render atoms/molecules
- Performant and well-documented
- Can be adapted for your needs

**Technical Features**:
- Ball-and-stick models
- Space-filling models
- Cartoon representations
- Custom styling options

**Code Example**:
```javascript
let viewer = $3Dmol.createViewer("container");
viewer.addModel(pdb, "pdb");
viewer.setStyle({}, {stick: {}, sphere: {scale: 0.3}});
viewer.zoomTo();
viewer.render();
```

---

### Category 4: Particle System Examples

#### 11. Three.js Examples - Points Dynamic
**URL**: https://threejs.org/examples/#webgl_points_dynamic
**Why It's Relevant**:
- Official Three.js particle example
- Shows morphing between shapes
- Performant implementation
- Source code available

**Key Techniques**:
- BufferGeometry for particles
- Morphing positions over time
- Efficient rendering
- Color transitions

---

#### 12. Maxime Heckel - Magical World of Particles
**URL**: https://blog.maximeheckel.com/posts/the-magical-world-of-particles-with-react-three-fiber-and-shaders/
**Why It's Relevant**:
- React Three Fiber tutorial
- Custom shaders for particles
- Performance optimization tips
- Well-explained code

**Key Techniques**:
- GPGPU for particle simulation
- Custom vertex shaders
- Instanced rendering
- React integration

---

#### 13. Codrops - Particle Effects
**URL**: https://tympanus.net/codrops (search "particle")
**Why It's Relevant**:
- Multiple particle effect tutorials
- Creative implementations
- Source code available
- Various techniques demonstrated

**Notable Tutorials**:
- Particle morphing
- Image to particles
- Interactive particle systems
- Scroll-based particle animations

---

### Category 5: Galaxy & Space Visualizations

#### 14. jsOrrery - Solar System Simulation
**URL**: https://github.com/mgvez/jsorrery
**Why It's Relevant**:
- Open-source solar system in WebGL
- Accurate orbital mechanics
- Shows how to implement planetary motion
- Three.js based

**Technical Features**:
- Kepler orbital calculations
- Time acceleration
- Camera controls
- Realistic scales (with compression)

---

#### 15. Galaxy Shaders on ShaderToy
**URL**: https://www.shadertoy.com (search "galaxy")
**Why It's Relevant**:
- Procedural galaxy generation
- Shader-based (very performant)
- Beautiful visual results
- Can be adapted to Three.js

**Key Techniques**:
- Noise functions for spiral arms
- Particle distribution
- Glow and bloom effects
- Color gradients

**Example Shaders**:
- "Galaxy" by Duke
- "Spiral Galaxy" by Kali
- "Milky Way" by various artists

---

## 💻 Code Examples & Snippets

### Example 1: Basic Particle System with Morphing

```javascript
// components/canvas/MorphingParticles.tsx
'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MorphingParticlesProps {
  count: number;
  fromShape: 'sphere' | 'atom' | 'galaxy';
  toShape: 'sphere' | 'atom' | 'galaxy';
  progress: number; // 0 to 1
}

export default function MorphingParticles({ 
  count, 
  fromShape, 
  toShape, 
  progress 
}: MorphingParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate positions for different shapes
  const positions = useMemo(() => {
    const from = new Float32Array(count * 3);
    const to = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // From shape positions
      if (fromShape === 'sphere') {
        const radius = 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        from[i3] = radius * Math.sin(phi) * Math.cos(theta);
        from[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        from[i3 + 2] = radius * Math.cos(phi);
      }
      
      // To shape positions
      if (toShape === 'galaxy') {
        const radius = Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        const spiral = angle + radius * 2;
        to[i3] = radius * Math.cos(spiral);
        to[i3 + 1] = (Math.random() - 0.5) * 0.5;
        to[i3 + 2] = radius * Math.sin(spiral);
      }
    }
    
    return { from, to };
  }, [count, fromShape, toShape]);
  
  // Animate morphing
  useFrame(() => {
    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      const positionAttribute = geometry.attributes.position;
      
      for (let i = 0; i < count * 3; i++) {
        const fromVal = positions.from[i];
        const toVal = positions.to[i];
        positionAttribute.array[i] = THREE.MathUtils.lerp(fromVal, toVal, progress);
      }
      
      positionAttribute.needsUpdate = true;
    }
  });
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.from}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#e18638"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
```

### Example 2: Scroll-Based Camera Animation

```javascript
// hooks/useScrollCamera.ts
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollCamera(sectionRef: React.RefObject<HTMLElement>) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (!sectionRef.current) return;
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    });
    
    // Zoom from close to far
    tl.to(camera.position, {
      z: 50, // Zoom out
      duration: 1,
    });
    
    return () => {
      tl.kill();
    };
  }, [camera, sectionRef]);
}
```

### Example 3: Adaptive Quality Based on Device

```javascript
// utils/deviceDetection.ts
export function getDeviceCapability() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isTablet = /(iPad|Android(?!.*Mobile))/i.test(navigator.userAgent);
  
  // Check GPU tier (simplified)
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  if (!gl) return 'low';
  
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
  
  // Simplified GPU detection
  const isHighEnd = /NVIDIA|AMD|Apple M[12]|Mali-G/.test(renderer);
  
  if (isMobile && !isHighEnd) return 'low';
  if (isTablet || (isMobile && isHighEnd)) return 'medium';
  return 'high';
}

export function getQualitySettings(capability: 'low' | 'medium' | 'high') {
  const settings = {
    low: {
      particleCount: 2000,
      textureSize: 512,
      enablePostProcessing: false,
      shadowQuality: 'off',
    },
    medium: {
      particleCount: 10000,
      textureSize: 1024,
      enablePostProcessing: true,
      shadowQuality: 'low',
    },
    high: {
      particleCount: 50000,
      textureSize: 2048,
      enablePostProcessing: true,
      shadowQuality: 'high',
    },
  };
  
  return settings[capability];
}
```

---

## 🎓 Learning Resources

### Courses
1. **Three.js Journey** - Bruno Simon ($95)
   - Most comprehensive Three.js course
   - Covers particles, shaders, performance
   - React Three Fiber section included

2. **Discover Three.js** - Free online book
   - Great for fundamentals
   - Performance tips section
   - Well-structured learning path

3. **WebGL Fundamentals** - Free tutorials
   - Low-level WebGL understanding
   - Helps with shader programming
   - Essential for optimization

### Books
1. **"Learning Three.js"** - Jos Dirksen
2. **"WebGL Programming Guide"** - Kouichi Matsuda
3. **"The Book of Shaders"** - Patricio Gonzalez Vivo (free online)

### Communities
1. **Three.js Discourse** - Official forum
2. **React Three Fiber Discord** - Active community
3. **Codrops** - Tutorials and inspiration
4. **Awwwards** - Award-winning examples

---

## 🔗 Quick Reference Links

### Documentation
- Three.js Docs: https://threejs.org/docs
- React Three Fiber: https://r3f.docs.pmnd.rs
- Drei Helpers: https://drei.docs.pmnd.rs
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger

### Tools
- ShaderToy: https://www.shadertoy.com
- GLSL Sandbox: http://glslsandbox.com
- Three.js Editor: https://threejs.org/editor

### Assets
- NASA 3D Resources: https://nasa3d.arc.nasa.gov
- Free Textures: https://polyhaven.com
- HDRI Haven: https://hdri-haven.com

---

**This document provides curated references to support your decision-making and implementation. All resources are open-source or freely available.**

