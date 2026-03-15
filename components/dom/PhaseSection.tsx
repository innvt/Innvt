'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface PhaseSectionProps {
  id: string;
  phaseNumber: number;
  phaseName: string;
  title: string;
  description: string;
  href: string;
}

export default function PhaseSection({
  id,
  phaseNumber,
  phaseName,
  title,
  description,
  href,
}: PhaseSectionProps) {
  return (
    <section
      id={id}
      className="relative min-h-screen flex items-end justify-center px-6 pb-16"
    >
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <p className="text-sm md:text-base font-semibold mb-3 gradient-gold uppercase tracking-wider text-glow">
            Phase {phaseNumber} &middot; {phaseName}
          </p>
          <h3 className="text-5xl md:text-7xl font-bold mb-6 gradient-gold text-glow">
            {title}
          </h3>
          <p className="text-xl md:text-2xl text-foreground-secondary leading-relaxed max-w-3xl mx-auto text-glow-soft">
            {description}
          </p>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-2 text-lg font-semibold gradient-gold text-glow group/link hover:opacity-80 transition-opacity"
        >
          <span>Explore {title}</span>
          <ArrowRight
            size={24}
            className="group-hover/link:translate-x-1 transition-transform"
          />
        </Link>
      </div>
    </section>
  );
}
