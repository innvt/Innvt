# Innvt Website - Development Guide

## 🎯 Development Best Practices

### Code Organization

#### Component Structure
```typescript
// 1. Imports
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
  description?: string;
}

// 3. Component
export default function MyComponent({ title, description }: MyComponentProps) {
  // 4. Refs
  const elementRef = useRef<HTMLDivElement>(null);
  
  // 5. Effects
  useEffect(() => {
    // Animation logic
  }, []);
  
  // 6. Render
  return (
    <div ref={elementRef}>
      {/* JSX */}
    </div>
  );
}
```

### Animation Guidelines

#### GSAP Best Practices
```typescript
// ✅ Good - Clean up animations
useEffect(() => {
  const ctx = gsap.context(() => {
    gsap.from('.element', { opacity: 0, y: 50 });
  }, elementRef);
  
  return () => ctx.revert(); // Cleanup
}, []);

// ❌ Bad - No cleanup
useEffect(() => {
  gsap.from('.element', { opacity: 0, y: 50 });
}, []);
```

#### ScrollTrigger Best Practices
```typescript
// ✅ Good - Kill triggers on unmount
useEffect(() => {
  const trigger = ScrollTrigger.create({
    trigger: '.element',
    start: 'top 80%',
    onEnter: () => console.log('entered'),
  });
  
  return () => trigger.kill();
}, []);
```

### Three.js / R3F Best Practices

#### Performance Optimization
```typescript
// ✅ Good - Memoize expensive calculations
const positions = useMemo(() => {
  const positions = new Float32Array(count * 3);
  // ... calculations
  return positions;
}, [count]);

// ❌ Bad - Recalculates every render
const positions = new Float32Array(count * 3);
```

#### Proper Cleanup
```typescript
// ✅ Good - Dispose of geometries and materials
useEffect(() => {
  return () => {
    geometry.dispose();
    material.dispose();
  };
}, []);
```

### TypeScript Best Practices

```typescript
// ✅ Good - Explicit types
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

// ❌ Bad - Using 'any'
interface ButtonProps {
  onClick: any;
  children: any;
}
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Usage

```tsx
// ✅ Good - Use Tailwind utilities
<div className="flex items-center justify-between p-6 bg-background-secondary">

// ✅ Good - Custom classes for complex styles
<div className="hero-gradient">

// ❌ Bad - Inline styles (unless dynamic)
<div style={{ padding: '24px', background: '#000' }}>
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="text-base md:text-lg lg:text-xl">
  Responsive text
</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

---

## 🔧 Common Patterns

### Scroll Animation Pattern
```typescript
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function AnimatedSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.animate-in', {
        opacity: 0,
        y: 80,
        stagger: 0.2,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1,
        },
      });
    }, sectionRef);
    
    return () => ctx.revert();
  }, []);
  
  return (
    <section ref={sectionRef}>
      <div className="animate-in">Content 1</div>
      <div className="animate-in">Content 2</div>
    </section>
  );
}
```

### 3D Component Pattern
```typescript
'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AnimatedMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e18638" />
    </mesh>
  );
}
```

### Custom Hook Pattern
```typescript
import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    function handleResize() {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return size;
}
```

---

## 🚀 Performance Optimization

### Image Optimization
```tsx
import Image from 'next/image';

// ✅ Good - Use Next.js Image component
<Image
  src="/hero-image.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority
/>

// ❌ Bad - Regular img tag
<img src="/hero-image.jpg" alt="Hero" />
```

### Code Splitting
```tsx
import dynamic from 'next/dynamic';

// ✅ Good - Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});
```

### Three.js Performance
```typescript
// ✅ Good - Use instancing for repeated objects
import { Instances, Instance } from '@react-three/drei';

<Instances>
  {Array.from({ length: 100 }).map((_, i) => (
    <Instance key={i} position={[i, 0, 0]} />
  ))}
</Instances>

// ❌ Bad - Individual meshes
{Array.from({ length: 100 }).map((_, i) => (
  <mesh key={i} position={[i, 0, 0]}>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>
))}
```

---

## 🐛 Debugging Tips

### GSAP Debugging
```typescript
// Enable ScrollTrigger markers
ScrollTrigger.create({
  trigger: '.element',
  start: 'top 80%',
  markers: true, // Shows visual markers
});

// Log animation progress
gsap.to('.element', {
  x: 100,
  onUpdate: function() {
    console.log('Progress:', this.progress());
  },
});
```

### Three.js Debugging
```typescript
// Add helpers
import { OrbitControls, Stats } from '@react-three/drei';

<Canvas>
  <OrbitControls /> {/* Camera controls */}
  <Stats /> {/* FPS counter */}
  <axesHelper args={[5]} /> {/* Axis helper */}
</Canvas>
```

### React DevTools
```bash
# Install React DevTools browser extension
# Then inspect component tree and props
```

---

## 📦 Adding New Features

### Adding a New Page
1. Create page file: `app/new-page/page.tsx`
2. Add metadata
3. Implement component
4. Add navigation link
5. Test routing

### Adding a New 3D Component
1. Create file: `components/canvas/NewComponent.tsx`
2. Import in Scene.tsx
3. Add to canvas
4. Test performance

### Adding a New Animation
1. Create animation in `lib/animations.ts`
2. Import in component
3. Apply with useEffect
4. Test on different screen sizes

---

## 🧪 Testing Checklist

### Before Committing
- [ ] Run `npm run lint`
- [ ] Run `npm run format`
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile devices
- [ ] Check console for errors
- [ ] Verify animations are smooth
- [ ] Check performance (Lighthouse)

### Performance Targets
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.8s
- Cumulative Layout Shift: < 0.1

---

## 🎓 Learning Path

### Week 1: Fundamentals
- [ ] Next.js App Router
- [ ] React Server Components
- [ ] TypeScript basics
- [ ] Tailwind CSS

### Week 2: Animations
- [ ] GSAP basics
- [ ] ScrollTrigger
- [ ] Timeline animations
- [ ] Easing functions

### Week 3: 3D Graphics
- [ ] Three.js fundamentals
- [ ] React Three Fiber
- [ ] Geometries and materials
- [ ] Lighting and cameras

### Week 4: Advanced
- [ ] Custom shaders
- [ ] Post-processing
- [ ] Performance optimization
- [ ] Advanced animations

---

## 📚 Recommended Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [GSAP Docs](https://gsap.com/docs/v3)
- [R3F Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Docs](https://threejs.org/docs)

### Tutorials
- [Three.js Journey](https://threejs-journey.com)
- [GSAP Learning](https://gsap.com/resources/get-started)
- [Next.js Learn](https://nextjs.org/learn)

### Inspiration
- [Awwwards](https://www.awwwards.com)
- [Codrops](https://tympanus.net/codrops)
- [Three.js Examples](https://threejs.org/examples)

---

**Happy Coding! Build Beyond! 🚀**

