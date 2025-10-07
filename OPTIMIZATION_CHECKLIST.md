# Optimization Checklist - Priority Order for Option A

**Purpose**: Day-by-day optimization guide to ensure maximum performance from the start

---

## 🔴 CRITICAL - Day 1 Optimizations (Must Implement)

### ✅ 1. GPU Instancing
**Priority**: Critical  
**Impact**: 99% reduction in draw calls  
**When**: Before rendering any particles

**Implementation**:
```javascript
// ❌ DON'T DO THIS (100,000 draw calls)
particles.forEach(pos => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(pos);
  scene.add(mesh);
});

// ✅ DO THIS (1 draw call)
const instancedMesh = new THREE.InstancedMesh(geometry, material, 100000);
const matrix = new THREE.Matrix4();

for (let i = 0; i < 100000; i++) {
  matrix.setPosition(positions[i]);
  instancedMesh.setMatrixAt(i, matrix);
}
instancedMesh.instanceMatrix.needsUpdate = true;
scene.add(instancedMesh);
```

**Validation**: Check draw calls in Chrome DevTools Performance tab (should be 1-10, not 1000+)

---

### ✅ 2. Device Detection & Quality Tiers
**Priority**: Critical  
**Impact**: 70-80% performance improvement on low-end devices  
**When**: On app initialization

**Implementation**:
```javascript
import { getGPUTier } from 'detect-gpu';

// Detect GPU tier on load
const gpuTier = await getGPUTier();

// Set quality based on tier
const QUALITY_SETTINGS = {
  0: { // Tier 0: Fallback (no WebGL or very low-end)
    particles: 0,
    useWebGL: false,
    use2DFallback: true,
  },
  1: { // Tier 1: Low-end (15-30 FPS)
    particles: 5000,
    postProcessing: false,
    shadowQuality: 'none',
    particleSize: 'small',
  },
  2: { // Tier 2: Mid-range (30-60 FPS)
    particles: 30000,
    postProcessing: false,
    shadowQuality: 'low',
    particleSize: 'medium',
  },
  3: { // Tier 3: High-end (60+ FPS)
    particles: 100000,
    postProcessing: true,
    shadowQuality: 'high',
    particleSize: 'large',
  },
};

const settings = QUALITY_SETTINGS[gpuTier.tier];
```

**Validation**: Test on multiple devices, verify correct tier assignment

---

### ✅ 3. Frustum Culling Setup
**Priority**: Critical  
**Impact**: 30-50% performance improvement  
**When**: When creating geometries

**Implementation**:
```javascript
// Ensure all objects have proper bounding boxes
geometry.computeBoundingBox();
geometry.computeBoundingSphere();

// Three.js will automatically cull objects outside camera frustum
// Just make sure frustumCulled is enabled (default)
mesh.frustumCulled = true; // This is default, but be explicit
```

**Validation**: Move camera around, verify objects outside view aren't rendered

---

### ✅ 4. Texture Atlases
**Priority**: High  
**Impact**: 50-70% reduction in texture swaps  
**When**: Before loading textures

**Implementation**:
```javascript
// ❌ DON'T: Multiple separate textures
const texture1 = textureLoader.load('particle1.png');
const texture2 = textureLoader.load('particle2.png');
const texture3 = textureLoader.load('particle3.png');

// ✅ DO: Single texture atlas
const atlas = textureLoader.load('particle-atlas.png');

// Use UV offsets to access different parts of atlas
material.map = atlas;
material.map.offset.set(0, 0); // First particle
material.map.repeat.set(0.33, 1); // If 3 particles in atlas
```

**Validation**: Check network tab, should load 1 texture not 10+

---

## 🟠 HIGH PRIORITY - Week 1 Optimizations

### ✅ 5. Shader Optimization
**Priority**: High  
**Impact**: 40-60% fragment shader performance improvement  
**When**: When writing custom shaders

**Best Practices**:
```glsl
// ❌ DON'T: Expensive operations in fragment shader
void main() {
  float dist = distance(vPosition, vec3(0.0));
  float noise = sin(dist * 10.0) * cos(dist * 5.0); // Expensive!
  gl_FragColor = vec4(vec3(noise), 1.0);
}

// ✅ DO: Move to vertex shader or use lookup textures
// Vertex shader:
varying float vNoise;
void main() {
  float dist = distance(position, vec3(0.0));
  vNoise = sin(dist * 10.0) * cos(dist * 5.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment shader:
varying float vNoise;
void main() {
  gl_FragColor = vec4(vec3(vNoise), 1.0); // Just use pre-calculated value
}
```

**Rules**:
- Move calculations from fragment to vertex shader when possible
- Avoid `sin`, `cos`, `pow`, `sqrt` in fragment shader
- Use lookup textures for complex functions
- Minimize `if` statements in shaders

**Validation**: Use Chrome DevTools GPU profiler

---

### ✅ 6. BufferGeometry (Not Geometry)
**Priority**: High  
**Impact**: 50% memory reduction  
**When**: Creating all geometries

**Implementation**:
```javascript
// ❌ DON'T: Use deprecated Geometry
const geometry = new THREE.Geometry();

// ✅ DO: Use BufferGeometry
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
// Fill positions array...
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
```

**Validation**: Check memory usage in DevTools

---

### ✅ 7. Dispose Unused Resources
**Priority**: High  
**Impact**: Prevents memory leaks  
**When**: When removing objects from scene

**Implementation**:
```javascript
// Proper cleanup
function removeObject(object) {
  // Dispose geometry
  if (object.geometry) {
    object.geometry.dispose();
  }
  
  // Dispose material(s)
  if (object.material) {
    if (Array.isArray(object.material)) {
      object.material.forEach(material => material.dispose());
    } else {
      object.material.dispose();
    }
  }
  
  // Dispose textures
  if (object.material?.map) object.material.map.dispose();
  
  // Remove from scene
  scene.remove(object);
}
```

**Validation**: Monitor memory usage over time, should not increase indefinitely

---

### ✅ 8. LOD (Level of Detail)
**Priority**: Medium-High  
**Impact**: 30-40% performance improvement  
**When**: For objects at varying distances

**Implementation**:
```javascript
const lod = new THREE.LOD();

// High detail (close)
const highDetail = new THREE.InstancedMesh(
  new THREE.SphereGeometry(1, 32, 32),
  material,
  1000
);
lod.addLevel(highDetail, 0);

// Medium detail
const mediumDetail = new THREE.InstancedMesh(
  new THREE.SphereGeometry(1, 16, 16),
  material,
  1000
);
lod.addLevel(mediumDetail, 50);

// Low detail (far)
const lowDetail = new THREE.InstancedMesh(
  new THREE.SphereGeometry(1, 8, 8),
  material,
  1000
);
lod.addLevel(lowDetail, 100);

scene.add(lod);
```

**Validation**: Move camera, verify geometry complexity changes

---

## 🟡 MEDIUM PRIORITY - Week 2 Optimizations

### ✅ 9. Adaptive Quality System
**Priority**: Medium  
**Impact**: Maintains target FPS  
**When**: After initial implementation

**Implementation**:
```javascript
let currentQuality = settings.particles;
let fpsHistory = [];

function monitorPerformance() {
  const fps = 1 / deltaTime;
  fpsHistory.push(fps);
  
  if (fpsHistory.length > 60) { // Check every 60 frames
    const avgFPS = fpsHistory.reduce((a, b) => a + b) / fpsHistory.length;
    
    if (avgFPS < 30 && currentQuality > 5000) {
      // Reduce quality
      currentQuality *= 0.8;
      updateParticleCount(currentQuality);
    }
    
    fpsHistory = [];
  }
}

// Call in render loop
useFrame((state, delta) => {
  monitorPerformance(delta);
});
```

**Validation**: Artificially stress system, verify quality reduces

---

### ✅ 10. Code Splitting & Lazy Loading
**Priority**: Medium  
**Impact**: Faster initial load  
**When**: When implementing multiple scenes

**Implementation**:
```javascript
// Lazy load scenes
const QuantumScene = lazy(() => import('./scenes/QuantumScene'));
const AtomicScene = lazy(() => import('./scenes/AtomicScene'));
const MolecularScene = lazy(() => import('./scenes/MolecularScene'));

// Preload next scene while current is visible
function preloadNextScene(currentIndex) {
  const nextScene = scenes[currentIndex + 1];
  if (nextScene) {
    import(`./scenes/${nextScene}.jsx`);
  }
}
```

**Validation**: Check network tab, verify scenes load on demand

---

### ✅ 11. Geometry Merging
**Priority**: Medium  
**Impact**: Reduces draw calls for static objects  
**When**: For static, non-moving objects

**Implementation**:
```javascript
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils';

const geometries = [];
staticObjects.forEach(obj => {
  const geo = obj.geometry.clone();
  geo.applyMatrix4(obj.matrix);
  geometries.push(geo);
});

const mergedGeometry = mergeBufferGeometries(geometries);
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
scene.add(mergedMesh);
```

**Validation**: Check draw calls, should reduce significantly

---

### ✅ 12. Post-Processing Optimization
**Priority**: Medium  
**Impact**: 40-50% performance improvement  
**When**: When adding post-processing effects

**Best Practices**:
```javascript
// Disable on mobile
if (gpuTier.tier < 2) {
  // No post-processing
} else {
  // Use lower resolution render target
  const composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType, // Instead of FloatType
  });
  
  // Limit to essential effects only
  composer.addPass(renderPass);
  composer.addPass(bloomPass); // Only bloom, skip others
}
```

**Validation**: Toggle post-processing, measure FPS difference

---

## 🟢 LOW PRIORITY - Week 3+ Optimizations

### ✅ 13. Object Pooling
**Priority**: Low  
**Impact**: Reduces garbage collection  
**When**: For frequently created/destroyed objects

**Implementation**:
```javascript
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 100) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }
  
  acquire() {
    return this.pool.pop() || this.createFn();
  }
  
  release(obj) {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

// Usage
const particlePool = new ObjectPool(
  () => new THREE.Mesh(geometry, material),
  (mesh) => mesh.position.set(0, 0, 0)
);
```

---

### ✅ 14. Web Workers for Heavy Calculations
**Priority**: Low  
**Impact**: Offloads CPU work  
**When**: For complex calculations

**Implementation**:
```javascript
// worker.js
self.onmessage = function(e) {
  const { positions, count } = e.data;
  
  // Heavy calculation
  const newPositions = calculateNewPositions(positions, count);
  
  self.postMessage({ positions: newPositions });
};

// Main thread
const worker = new Worker('worker.js');
worker.postMessage({ positions, count });
worker.onmessage = (e) => {
  updateParticles(e.data.positions);
};
```

---

### ✅ 15. Render on Demand (Not Continuous)
**Priority**: Low  
**Impact**: Saves battery on static scenes  
**When**: For non-animated scenes

**Implementation**:
```javascript
let needsRender = true;

function render() {
  if (needsRender) {
    renderer.render(scene, camera);
    needsRender = false;
  }
}

// Only render when something changes
controls.addEventListener('change', () => {
  needsRender = true;
});
```

---

## 📊 Optimization Impact Summary

| Optimization | Priority | Impact | Difficulty | When |
|--------------|----------|--------|------------|------|
| GPU Instancing | 🔴 Critical | 99% | Easy | Day 1 |
| Device Detection | 🔴 Critical | 80% | Easy | Day 1 |
| Frustum Culling | 🔴 Critical | 40% | Easy | Day 1 |
| Texture Atlases | 🔴 Critical | 60% | Medium | Day 1 |
| Shader Optimization | 🟠 High | 50% | Hard | Week 1 |
| BufferGeometry | 🟠 High | 50% | Easy | Week 1 |
| Resource Disposal | 🟠 High | Varies | Easy | Week 1 |
| LOD System | 🟠 High | 35% | Medium | Week 1 |
| Adaptive Quality | 🟡 Medium | 30% | Medium | Week 2 |
| Code Splitting | 🟡 Medium | 25% | Easy | Week 2 |
| Geometry Merging | 🟡 Medium | 40% | Medium | Week 2 |
| Post-Processing | 🟡 Medium | 45% | Easy | Week 2 |
| Object Pooling | 🟢 Low | 15% | Medium | Week 3+ |
| Web Workers | 🟢 Low | 20% | Hard | Week 3+ |
| Render on Demand | 🟢 Low | 10% | Easy | Week 3+ |

---

## ✅ Daily Checklist

### Day 1
- [ ] Install detect-gpu: `npm install detect-gpu`
- [ ] Implement GPU tier detection
- [ ] Set up quality settings object
- [ ] Use InstancedMesh for all particles
- [ ] Verify frustum culling is enabled
- [ ] Create texture atlas

### Week 1
- [ ] Review all shaders, move calculations to vertex shader
- [ ] Convert all Geometry to BufferGeometry
- [ ] Implement proper resource disposal
- [ ] Add LOD for distant objects
- [ ] Test on 3+ different devices

### Week 2
- [ ] Implement adaptive quality monitoring
- [ ] Set up code splitting for scenes
- [ ] Merge static geometries
- [ ] Optimize post-processing
- [ ] Test on mobile devices

### Week 3+
- [ ] Add object pooling if needed
- [ ] Consider web workers for heavy calculations
- [ ] Implement render-on-demand for static scenes
- [ ] Final performance audit

---

## 🎯 Performance Targets

### Desktop (Tier 2+)
- **Target**: 60 FPS
- **Minimum**: 30 FPS
- **Particles**: 30,000-100,000

### Mobile (Tier 1+)
- **Target**: 30 FPS
- **Minimum**: 15 FPS
- **Particles**: 5,000-15,000

### Fallback (Tier 0)
- **Target**: N/A (2D fallback)
- **Minimum**: N/A
- **Particles**: 0

---

## 🔍 Performance Monitoring Tools

1. **Chrome DevTools Performance Tab**
   - Monitor FPS
   - Check draw calls
   - Identify bottlenecks

2. **Three.js Stats**
   ```javascript
   import Stats from 'three/examples/jsm/libs/stats.module';
   const stats = Stats();
   document.body.appendChild(stats.dom);
   ```

3. **React Three Fiber Perf**
   ```javascript
   import { Perf } from 'r3f-perf';
   <Perf position="top-left" />
   ```

4. **detect-gpu**
   ```javascript
   console.log(gpuTier); // Check tier, fps, gpu name
   ```

---

**Remember**: Optimize early, optimize often. Don't wait until the end!

