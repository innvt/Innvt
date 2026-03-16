import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Horizon — Innvt',
  description: 'Building beyond our known frontier. Transcending our own systems to explore the infinite.',
};

export default function HorizonPage() {
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
              Phase 4
            </p>
            <h1 className="text-hero font-bold mb-6 gradient-gold">Horizon</h1>
            <p className="text-xl text-foreground-secondary leading-relaxed">
              Building beyond our known frontier.
            </p>
          </div>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-foreground-tertiary leading-relaxed">
              Looking up from the forest to the stars; the limit of what we can see, and the drive
              to go beyond it; the next, endless frontier. Human potential has no final horizon.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
