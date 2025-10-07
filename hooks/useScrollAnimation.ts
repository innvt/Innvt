'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollAnimationOptions {
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
}

/**
 * Custom hook for scroll-based animations
 */
export const useScrollAnimation = (
  animation: (element: HTMLElement) => gsap.core.Tween | gsap.core.Timeline,
  options?: ScrollAnimationOptions
) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const tween = animation(element);

    ScrollTrigger.create({
      trigger: element,
      start: options?.start || 'top 80%',
      end: options?.end || 'top 50%',
      scrub: options?.scrub !== undefined ? options.scrub : false,
      markers: options?.markers || false,
      onEnter: options?.onEnter,
      onLeave: options?.onLeave,
      onEnterBack: options?.onEnterBack,
      onLeaveBack: options?.onLeaveBack,
      animation: tween,
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === element) {
          trigger.kill();
        }
      });
    };
  }, [animation, options]);

  return elementRef;
};

