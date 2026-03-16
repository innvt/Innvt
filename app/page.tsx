'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '@/components/dom/Hero';
import PhaseSection from '@/components/dom/PhaseSection';
import Scene from '@/components/canvas/Scene';

gsap.registerPlugin(ScrollTrigger);

const phases = [
  {
    id: 'phase-1',
    phaseNumber: 1,
    phaseName: 'Genesis',
    title: 'Genesis',
    description:
      'Architecting the tools for a new reality. The is the Origin; the creation of the first spark; igniting the core in the void that will pull an entire system into orbit.',
    href: '/genesis',
  },
  {
    id: 'phase-2',
    phaseNumber: 2,
    phaseName: 'Cultivation',
    title: 'Cultivation',
    description:
      'Creating the environment for potential. Forging the connections that empower others to build their own tools - A journey of growth, learning, and empowerment.',
    href: '/cultivation',
  },
  {
    id: 'phase-3',
    phaseNumber: 3,
    phaseName: 'Symbiosis',
    title: 'Symbiosis',
    description:
      'Engineering the system for a thriving world. The individual elements now orbit together as a vast self-sustaining ecosystem; a state of perfect balance and mutual benefit.',
    href: '/symbiosis',
  },
  {
    id: 'phase-4',
    phaseNumber: 4,
    phaseName: 'Horizon',
    title: 'Horizon',
    description:
      'Building beyond our known frontier. Transcending our own systems to explore the infinite; reaching the limit of what is possible today, and finding the relentless drive to build beyond.',
    href: '/horizon',
  },
];

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in animation on load
      gsap.from('.hero-content', {
        opacity: 0,
        y: 50,
        duration: 1.2,
        ease: 'power3.out',
        delay: 0.3,
      });
    }, mainRef);

    // Section snapping via RAF polling of Lenis velocity
    const sectionIds = ['hero', 'evolution', 'phase-1', 'phase-2', 'phase-3', 'phase-4', 'belief-section'];
    let isSnapping = false;
    let wasScrolling = false;
    let rafId: number;

    const snapToNearest = () => {
      const lenis = window.__lenis;
      if (!lenis || isSnapping) return;

      const scrollY = lenis.scroll;
      const vh = window.innerHeight;
      const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];

      let closestSection: HTMLElement | null = null;
      let closestDist = Infinity;

      sections.forEach((section) => {
        const dist = Math.abs(scrollY - section.offsetTop);
        if (dist < closestDist) {
          closestDist = dist;
          closestSection = section;
        }
      });

      if (closestSection && closestDist > 5 && closestDist < vh * 0.45) {
        isSnapping = true;
        lenis.scrollTo(closestSection, {
          duration: 0.5,
          onComplete: () => {
            isSnapping = false;
          },
        });
      }
    };

    // Poll Lenis velocity — when scrolling stops, snap
    const tick = () => {
      const lenis = window.__lenis;
      if (lenis) {
        const scrolling = Math.abs(lenis.velocity) > 0.1;
        if (wasScrolling && !scrolling && !isSnapping) {
          snapToNearest();
        }
        wasScrolling = scrolling;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      ctx.revert();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main ref={mainRef} className="relative">
      {/* 3D Background Scene */}
      <div className="canvas-container">
        <Scene />
      </div>

      {/* Content */}
      <div className="content-wrapper">
        <Hero />

        {/* Evolution Intro Section */}
        <section
          id="evolution"
          className="relative min-h-screen flex items-end justify-center px-6 pb-16"
        >
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-section font-bold mb-6 text-glow">Our Evolution</h2>
            <p className="text-xl max-w-3xl mx-auto gradient-gold text-glow-soft">
              A journey through four transformative phases, each building upon the last
              to create a sustainable future for all.
            </p>
          </div>
        </section>

        {/* Phase Sections */}
        {phases.map((phase) => (
          <PhaseSection key={phase.id} {...phase} />
        ))}

        {/* Belief Section */}
        <section
          id="belief-section"
          className="relative border-t border-border flex items-end pb-16"
          style={{ minHeight: '100vh' }}
        >
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-subsection font-bold mb-8">Our Belief</h2>
              <blockquote className="text-2xl md:text-3xl font-light italic leading-relaxed gradient-gold">
                &ldquo;When we plant a tree, plant it in a desert, not in a forest, then there is
                a meaning for the word &lsquo;shade&rsquo;.&rdquo;
              </blockquote>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
