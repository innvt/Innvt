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
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center px-6"
    >
      <div className="hero-content text-center max-w-5xl mx-auto">
        {/* Logo/Brand Name */}
        <div className="mb-12">
          <h1 className="text-8xl md:text-9xl font-bold tracking-tight">
            <span className="gradient-text">Innvt</span>
          </h1>
        </div>

        {/* Tagline */}
        <div className="mb-10">
          <h2 className="text-hero font-bold mb-8">Build Beyond.</h2>
          <p className="text-xl md:text-2xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed">
            Build Beyond is more than our tagline; it is our operational mandate.
          </p>
        </div>
      </div>
    </section>
  );
}

