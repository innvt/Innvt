'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CultivationPage() {
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
              Phase 2
            </p>
            <h1 className="text-hero font-bold mb-6 gradient-gold">Cultivation</h1>
            <p className="text-xl text-foreground-secondary leading-relaxed">
              Creating the space for potential to build.
            </p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-foreground-tertiary leading-relaxed">
              Nurturing the seeds into a sapling; the process of growth, learning, and empowerment;
              tending to the new life. We create environments where ideas flourish and potential
              becomes reality.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

