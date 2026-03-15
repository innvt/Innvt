'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SCROLL_STORAGE_KEY = 'innvt-scroll-pos:';

interface SmoothScrollProps {
  children: ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 0.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 2,
      infinite: false,
    });

    // Expose globally so other components can stop/start during snaps
    (window as any).__lenis = lenis;

    // Connect Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // --- Scroll position save (debounced) ---
    let saveTimeout: ReturnType<typeof setTimeout>;
    lenis.on('scroll', ({ scroll }: { scroll: number }) => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        try {
          sessionStorage.setItem(SCROLL_STORAGE_KEY + pathname, String(scroll));
        } catch { /* storage full or unavailable */ }
      }, 150);
    });

    // --- Scroll position restore on mount ---
    const saved = sessionStorage.getItem(SCROLL_STORAGE_KEY + pathname);
    if (saved) {
      const pos = parseFloat(saved);
      if (pos > 0) {
        // Restore after Lenis initializes and layout settles
        requestAnimationFrame(() => {
          lenis.scrollTo(pos, { immediate: true });
          ScrollTrigger.refresh();
        });
      }
    }

    // Store reference so we can remove it on cleanup
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);

    gsap.ticker.lagSmoothing(0);

    // Cleanup
    return () => {
      clearTimeout(saveTimeout);
      (window as any).__lenis = null;
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
    };
  }, [pathname]);

  return <>{children}</>;
}
