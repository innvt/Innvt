import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Symbiosis — Innvt',
  description: 'Engineering the system for a thriving world. A self-sustaining ecosystem of perfect balance and mutual benefit.',
};

export default function SymbiosisPage() {
  return (
    <main className="relative min-h-screen">
      <div className="container mx-auto px-6 py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-12 gradient-gold"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <div className="max-w-4xl">
          <div className="mb-8">
            <p className="font-semibold mb-4 gradient-gold">
              Phase 3
            </p>
            <h1 className="text-hero font-bold mb-6 gradient-gold">Symbiosis</h1>
            <p className="text-xl text-foreground-secondary leading-relaxed">
              Engineering the system for a thriving world.
            </p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-foreground-tertiary leading-relaxed">
              The seeds are now a forest, creating a self-sustaining ecosystem; a state of perfect
              balance and mutual benefit between humanity, technology and the planet. This is where
              harmony meets innovation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
