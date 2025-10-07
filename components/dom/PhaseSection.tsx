'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

interface Phase {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
}

interface PhaseSectionProps {
  phase: Phase;
  index: number;
}

export default function PhaseSection({ phase, index }: PhaseSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Simple fade in and slide up animation - no scrub for consistent behavior
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 60,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="phase-section">
      <div
        ref={cardRef}
        className={`group relative bg-background-secondary border border-border rounded-2xl p-8 md:p-12 hover:border-accent transition-all duration-500 ${
          index % 2 === 0 ? 'md:mr-20' : 'md:ml-20'
        }`}
      >
        {/* Phase Number */}
        <div className="absolute -top-6 -left-6 w-16 h-16 bg-accent rounded-full flex items-center justify-center text-2xl font-bold text-background">
          {index + 1}
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-accent font-semibold mb-2">{phase.subtitle}</p>
          <h3 className="text-4xl md:text-5xl font-bold mb-4 group-hover:text-accent transition-colors">
            {phase.title}
          </h3>
          <p className="text-lg text-foreground-tertiary leading-relaxed">{phase.description}</p>
        </div>

        {/* Link */}
        <Link
          href={phase.href}
          className="inline-flex items-center gap-2 text-accent hover:text-accent-light transition-colors group/link"
        >
          <span className="font-semibold">Explore {phase.title}</span>
          <ArrowRight
            size={20}
            className="group-hover/link:translate-x-1 transition-transform"
          />
        </Link>

        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </div>
  );
}

