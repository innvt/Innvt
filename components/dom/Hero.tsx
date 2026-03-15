'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax effect on scroll
      gsap.to('.hero-content', {
        y: 100,
        opacity: 0.3,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center px-6"
    >
      <div className="hero-content text-center max-w-5xl mx-auto">
        {/* Logo/Brand Name - Pure White */}
        <div className="mb-12">
          <h1 className="text-8xl md:text-9xl font-bold tracking-tight text-white">
            Innvt
          </h1>
        </div>

        {/* Tagline - Gradient Gold */}
        <div className="mb-10">
          <h2 className="text-hero font-bold mb-8 gradient-gold">
            Build Beyond
          </h2>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed gradient-gold">
            Build Beyond is more than just a tagline; it&apos;s our operational mandate.
          </p>
        </div>
      </div>
    </section>
  );
}

