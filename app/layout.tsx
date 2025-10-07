import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import SmoothScroll from '@/components/shared/SmoothScroll';
import { GPUDetectionProvider } from '@/components/shared/GPUDetectionProvider';

export const metadata: Metadata = {
  title: 'Innvt - Build Beyond',
  description:
    'Build Beyond is more than our tagline; it is our operational mandate. We architect the foundational tools and systems that empower humanity to solve its greatest challenges.',
  keywords: [
    'innovation',
    'technology',
    'future',
    'build beyond',
    'transformation',
    'sustainability',
  ],
  authors: [{ name: 'Innvt' }],
  openGraph: {
    title: 'Innvt - Build Beyond',
    description:
      'To create a thriving, sustainable world where every being feels at home - on Earth and beyond.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Innvt - Build Beyond',
    description:
      'To create a thriving, sustainable world where every being feels at home - on Earth and beyond.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased">
        <GPUDetectionProvider>
          <SmoothScroll>{children}</SmoothScroll>
          <div className="noise-overlay" aria-hidden="true" />
        </GPUDetectionProvider>
      </body>
    </html>
  );
}

