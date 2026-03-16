import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Genesis — Innvt',
  description: 'Architecting the tools for a new reality. The Origin; the creation of the first spark; igniting the core in the void.',
};

export default function GenesisPage() {
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
              Phase 1
            </p>
            <h1 className="text-hero font-bold mb-6 gradient-gold">Genesis</h1>
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
