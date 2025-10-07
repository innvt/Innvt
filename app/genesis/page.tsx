'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function GenesisPage() {
  return (
    <main className="relative min-h-screen">
      <div className="container mx-auto px-6 py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-accent hover:text-accent-light transition-colors mb-12"
        >
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        <div className="max-w-4xl">
          <div className="mb-8">
            <p className="text-accent font-semibold mb-4">Phase 1</p>
            <h1 className="text-hero font-bold mb-6 gradient-text">Genesis</h1>
            <p className="text-xl text-foreground-secondary leading-relaxed">
              Architecting the tools for a new reality.
            </p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-foreground-tertiary leading-relaxed">
              The Origin; the creation of the first spark; planting the seeds in the desert from
              which everything else will grow. This is where innovation begins, where we lay the
              foundational tools and systems that will empower transformation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

