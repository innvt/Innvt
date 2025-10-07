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

## 🌟 Features

### Implemented
- ✅ Smooth scrolling with Lenis
- ✅ 3D particle field background
- ✅ GSAP scroll animations
- ✅ Responsive design
- ✅ Dark theme
- ✅ Four phase pages
- ✅ Interactive hover effects
- ✅ Mouse-based camera movement

### Planned
- 🔲 Custom cursor
- 🔲 Page transitions
- 🔲 Advanced 3D scenes per phase
- 🔲 Shader effects
- 🔲 Sound design
- 🔲 Loading animations
- 🔲 Mobile optimizations

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

