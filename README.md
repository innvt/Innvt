# Innvt - Build Beyond

A futuristic, visually stunning brand experience website built with Next.js 15, React Three Fiber, GSAP, and Lenis smooth scrolling.

## 🚀 Tech Stack

### Core Framework
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety and better DX

### 3D Graphics & WebGL
- **Three.js** - 3D graphics library
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F
- **@react-three/postprocessing** - Post-processing effects

### Animation
- **GSAP 3** - Professional-grade animation library
- **@gsap/react** - React wrapper for GSAP
- **ScrollTrigger** - Scroll-based animations
- **Framer Motion** - React animation library

### Smooth Scrolling
- **Lenis** - Smooth scroll library

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Geist Font** - Modern font family

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 📁 Project Structure

```
innvt-website/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Homepage
│   ├── globals.css              # Global styles
│   ├── genesis/                 # Phase 1 page
│   ├── cultivation/             # Phase 2 page
│   ├── symbiosis/               # Phase 3 page
│   └── horizon/                 # Phase 4 page
├── components/
│   ├── canvas/                  # React Three Fiber components
│   │   ├── Scene.tsx           # Main 3D scene
│   │   ├── ParticleField.tsx   # Particle system
│   │   └── CameraController.tsx # Camera controls
│   ├── dom/                     # Regular React components
│   │   ├── Hero.tsx            # Hero section
│   │   └── PhaseSection.tsx    # Phase card component
│   └── shared/                  # Shared components
│       └── SmoothScroll.tsx    # Lenis smooth scroll wrapper
├── hooks/                       # Custom React hooks
│   ├── useScrollAnimation.ts   # Scroll animation hook
│   └── useMousePosition.ts     # Mouse tracking hook
├── lib/                         # Utility functions
│   ├── animations.ts           # GSAP animation utilities
│   └── three-utils.ts          # Three.js helper functions
└── public/                      # Static assets
```

## 🛠️ Getting Started

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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🎨 Design System

### Colors
- **Background**: `#000000` (Pure black)
- **Foreground**: `#ffffff` (White)
- **Accent**: `#e18638` (Orange gradient)
- **Border**: `#262626` (Dark gray)

### Typography
- **Hero**: Clamp(3rem, 8vw, 7rem)
- **Section**: Clamp(2rem, 5vw, 4rem)
- **Subsection**: Clamp(1.5rem, 3vw, 2.5rem)

### Animations
- Smooth scroll with Lenis
- GSAP-powered transitions
- Parallax effects
- Particle field background

## 🌌 Quantum to Cosmic Journey

A scientifically grounded, artistic visualization of the universe across 6 scales of magnitude.

### Current Status: Week 2 Complete (Scale 2: Atomic Dance) ✅

We are currently building the "Quantum to Cosmic" journey. The first two scales are implemented and fully functional.

| Scale | Status | Description |
|-------|--------|-------------|
| **1. Quantum Field** | ✅ Complete | Planck scale fluctuations, quarks, and gluons. (Hero Section) |
| **2. Atomic Dance** | ✅ Complete | Bohr model atoms with orbiting electrons. (Phase 1) |
| **3. Molecular Network** | 🚧 Next | Atoms bonding to form complex molecules. (Phase 2) |
| **4. Solar System** | ⏳ Planned | Planetary orbits and gravitational harmony. (Phase 3) |
| **5. Galactic Expanse** | ⏳ Planned | Spiral galaxies and cosmic dust. (Phase 4) |
| **6. Cosmic Web** | ⏳ Planned | The large-scale structure of the universe. (Belief Section) |

### Documentation
- **[Start Here](START_HERE.md)**: Guide to the research and validation behind this project.
- **[Roadmap](IMPLEMENTATION_ROADMAP.md)**: Detailed implementation plan and timeline.
- **Archive**: Historical status reports and research notes can be found in `docs/archive/`.

## 🌟 Features

### Implemented
- ✅ **Scale Transition System**: Smooth, scroll-based morphing between scales.
- ✅ **Performance Optimized**: GPU-based particle systems (100k+ particles).
- ✅ **Device Adaptation**: Automatic quality adjustment for mobile/desktop.
- ✅ **Visuals**: Custom shaders for glowing particles and orbital mechanics.
- ✅ **Smooth Scrolling**: Lenis integration for fluid navigation.

### Planned
- 🔲 **Molecular Interactions**: Dynamic bond formation.
- 🔲 **Cosmic Scale**: Procedural galaxy generation.
- 🔲 **Audio**: Ambient soundscapes for each scale.


## 📖 Brand Information

### Tagline
**Build Beyond.**

### Vision
To create a thriving, sustainable world where every being feels at home - on Earth and beyond.

### Mission
To architect the foundational tools and systems that empower humanity to solve its greatest challenges and consciously shape its future.

### Four Phases

1. **Genesis** - Architecting the tools for a new reality
2. **Cultivation** - Creating the space for potential to build
3. **Symbiosis** - Engineering the system for a thriving world
4. **Horizon** - Building beyond our known frontier

## 🚀 Deployment

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

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Format code with Prettier
- Use meaningful variable names
- Comment complex logic

### Component Guidelines
- Keep components small and focused
- Use custom hooks for reusable logic
- Separate 3D (canvas) and 2D (dom) components
- Use proper TypeScript types

### Animation Guidelines
- Use GSAP for complex animations
- Use Framer Motion for simple UI animations
- Always clean up animations in useEffect
- Use ScrollTrigger for scroll-based animations

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run linting and formatting
4. Test thoroughly
5. Submit a pull request

## 📄 License

Copyright © 2025 Innvt. All rights reserved.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Poimandres for React Three Fiber
- GreenSock for GSAP
- Studio Freight for Lenis

---

**Built with ❤️ by Innvt**

