'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '@/components/dom/Hero';
import PhaseSection from '@/components/dom/PhaseSection';
import Scene from '@/components/canvas/Scene';

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize GSAP animations
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

    return () => ctx.revert();
  }, []);

  const phases = [
    {
      id: 'genesis',
      title: 'Genesis',
      subtitle: 'Phase 1',
      description:
        'Architecting the tools for a new reality. The Origin; the creation of the first spark; planting the seeds in the desert from which everything else will grow.',
      href: '/genesis',
    },
    {
      id: 'cultivation',
      title: 'Cultivation',
      subtitle: 'Phase 2',
      description:
        'Creating the space for potential to build. Nurturing the seeds into a sapling; the process of growth, learning, and empowerment; tending to the new life.',
      href: '/cultivation',
    },
    {
      id: 'symbiosis',
      title: 'Symbiosis',
      subtitle: 'Phase 3',
      description:
        'Engineering the system for a thriving world. The seeds are now a forest, creating a self-sustaining ecosystem; a state of perfect balance and mutual benefit.',
      href: '/symbiosis',
    },
    {
      id: 'horizon',
      title: 'Horizon',
      subtitle: 'Phase 4',
      description:
        'Building beyond our known frontier. Looking up from the forest to the stars; the limit of what we can see, and the drive to go beyond it; the next, endless frontier.',
      href: '/horizon',
    },
  ];

  return (
    <main ref={mainRef} className="relative">
      {/* 3D Background Scene */}
      <div className="canvas-container">
        <Scene />
      </div>

      {/* Content */}
      <div className="content-wrapper">
        <Hero />

        {/* Phases Section */}
        <section className="relative py-32">
          <div className="container mx-auto px-6">
            <div className="mb-20 text-center">
              <h2 className="text-section font-bold mb-6">Our Evolution</h2>
              <p className="text-xl max-w-3xl mx-auto gradient-gold">
                A journey through four transformative phases, each building upon the last to
                create a sustainable future for all.
              </p>
            </div>

            <div className="space-y-32">
              {phases.map((phase, index) => (
                <PhaseSection key={phase.id} phase={phase} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* Belief Section */}
        <section className="relative py-32 border-t border-border">
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

