# Innvt - Build Beyond

A futuristic, visually stunning brand experience website built with Next.js 15, React Three Fiber, GSAP, and Lenis smooth scrolling. The site features a **Quantum to Cosmic** scale journey — a scientifically grounded, artistic visualization of the universe across 6 scales of magnitude, all driven by scroll-based particle morphing.

## Tech Stack

### Core Framework
- **Next.js 15** — React framework with App Router
- **React 19** — UI library
- **TypeScript** — Type safety and better DX

### 3D Graphics & WebGL
- **Three.js** — 3D graphics library
- **React Three Fiber** — React renderer for Three.js
- **@react-three/drei** — Useful helpers for R3F
- **Custom GLSL Shaders** — Vertex/fragment shaders for particle systems, orbital mechanics, and morphing transitions

### Animation
- **GSAP 3** — Professional-grade animation library
- **ScrollTrigger** — Scroll-driven transitions between scales

### Smooth Scrolling
- **Lenis** — Smooth scroll library with scroll position persistence

### Styling
- **Tailwind CSS** — Utility-first CSS framework
- **Geist Font** — Modern font family

## Project Structure

```
innvt-website/
├── app/                              # Next.js App Router
│   ├── layout.tsx                   # Root layout with metadata
│   ├── page.tsx                     # Homepage — Scale Journey
│   ├── globals.css                  # Global styles
│   ├── genesis/                     # Phase 1 page
│   ├── cultivation/                 # Phase 2 page
│   ├── symbiosis/                   # Phase 3 page
│   └── horizon/                     # Phase 4 page
├── components/
│   ├── canvas/
│   │   └── Scene.tsx               # Main 3D scene container
│   ├── dom/
│   │   ├── Hero.tsx                # Hero section with tagline
│   │   └── PhaseSection.tsx        # Phase card component
│   ├── scenes/                      # Scale journey scenes
│   │   ├── ScaleJourneyManager.tsx  # Orchestrates all transitions via ScrollTrigger
│   │   ├── QuantumField.tsx         # Scale 1: Quantum fluctuations (Hero)
│   │   ├── CinematicAtom.tsx        # Scale 2: Single Bohr atom (transition)
│   │   ├── MolecularNetwork.tsx     # Scale 3: Molecular bonds (Phase 2)
│   │   ├── OrbitalHarmony.tsx       # Scale 4: Solar system (Phase 3)
│   │   ├── GalacticExpanse.tsx      # Scale 5: Spiral galaxy → tree morph (Phase 4)
│   │   └── types.ts                 # Shared TypeScript types
│   └── shared/
│       ├── SmoothScroll.tsx         # Lenis wrapper with scroll restoration
│       ├── GPUDetectionProvider.tsx  # GPU capability detection
│       └── WebGLErrorBoundary.tsx   # WebGL error handling
├── lib/
│   ├── scene-constants.ts           # Shared constants across scenes
│   ├── particle-morphing.ts         # Particle position/morph utilities
│   ├── atomic-elements.ts           # Atomic element data and geometry
│   ├── orbital-components.tsx       # Solar system planet/ring components
│   ├── gpu-detection.ts             # GPU tier detection logic
│   ├── performance-monitor.ts       # Runtime performance monitoring
│   └── shaders/
│       └── noise.glsl.ts            # Shared noise functions for shaders
└── public/                           # Static assets
```

## Quantum to Cosmic Journey

The homepage features a continuous scroll-driven journey through 6 scales of the universe. Each scale is a GPU-accelerated particle system (50k–100k+ particles) that morphs seamlessly into the next via custom GLSL shaders.

| Scale | Scene | Description |
|-------|-------|-------------|
| **1. Quantum Field** | `QuantumField.tsx` | Planck-scale fluctuations — particles fade out on scroll transition |
| **2. Atomic Dance** | `CinematicAtom.tsx` | Bohr model atom with orbiting electrons |
| **3. Molecular Network** | `MolecularNetwork.tsx` | Atoms bonding into complex molecular structures |
| **4. Solar System** | `OrbitalHarmony.tsx` | Planetary orbits with rings, moons, and sun corona (30° viewing angle) |
| **5. Galactic Expanse** | `GalacticExpanse.tsx` | Spiral galaxy that morphs into a rounded deciduous tree |

### Key Technical Features
- **Particle morphing**: Staggered `smoothstep` per particle using seeded random offsets for organic transitions
- **Scroll-driven animation**: GSAP ScrollTrigger controls all transition progress via refs (no React state)
- **Scroll restoration**: Browser back button returns to exact scroll position using `sessionStorage`
- **ScrollTrigger lifecycle**: Custom `lenis-ready` event ensures ScrollTriggers re-initialize after navigation
- **GPU adaptation**: Automatic quality scaling based on detected GPU capabilities

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint

> **Note**: Inline GLSL shader string changes do not hot-reload — a full dev server restart is required after modifying shaders.

## Design System

### Colors
- **Background**: `#000000` (Pure black)
- **Foreground**: `#ffffff` (White)
- **Accent**: `#e18638` (Orange gradient)
- **Border**: `#262626` (Dark gray)

### Typography
- **Hero**: Clamp(3rem, 8vw, 7rem)
- **Section**: Clamp(2rem, 5vw, 4rem)
- **Subsection**: Clamp(1.5rem, 3vw, 2.5rem)

## Brand Information

### Tagline
**Build Beyond**

### Vision
To create a thriving, sustainable world where every being feels at home — on Earth and beyond.

### Mission
To architect the foundational tools and systems that empower humanity to solve its greatest challenges and consciously shape its future.

### Four Phases

1. **Genesis** — Architecting the tools for a new reality
2. **Cultivation** — Creating the space for potential to build
3. **Symbiosis** — Engineering the system for a thriving world
4. **Horizon** — Building beyond our known frontier

## Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Other Platforms
The project can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Cloudflare Pages
- Railway

## Development Guidelines

- Use TypeScript for type safety
- Keep components small and focused
- Separate 3D (canvas) and 2D (dom) components
- Use GSAP for scroll-driven animations
- Always clean up animations and event listeners in useEffect
- Use refs (not React state) for high-frequency animation values

## License

Copyright © 2025–2026 Innvt. All rights reserved.

---

**Built with passion by Innvt**
