import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Fade in animation
 */
export const fadeIn = (
  element: gsap.DOMTarget,
  options?: {
    duration?: number;
    delay?: number;
    y?: number;
    ease?: string;
  }
) => {
  return gsap.from(element, {
    opacity: 0,
    y: options?.y || 30,
    duration: options?.duration || 1,
    delay: options?.delay || 0,
    ease: options?.ease || 'power3.out',
  });
};

/**
 * Fade in with scroll trigger
 */
export const fadeInScroll = (
  element: gsap.DOMTarget,
  options?: {
    trigger?: gsap.DOMTarget;
    start?: string;
    end?: string;
    scrub?: boolean | number;
    y?: number;
  }
) => {
  return gsap.from(element, {
    opacity: 0,
    y: options?.y || 80,
    scrollTrigger: {
      trigger: options?.trigger || element,
      start: options?.start || 'top 80%',
      end: options?.end || 'top 50%',
      scrub: options?.scrub !== undefined ? options.scrub : 1,
    },
  });
};

/**
 * Parallax effect
 */
export const parallax = (
  element: gsap.DOMTarget,
  options?: {
    trigger?: gsap.DOMTarget;
    y?: number;
    start?: string;
    end?: string;
  }
) => {
  return gsap.to(element, {
    y: options?.y || -100,
    scrollTrigger: {
      trigger: options?.trigger || element,
      start: options?.start || 'top bottom',
      end: options?.end || 'bottom top',
      scrub: true,
    },
  });
};

/**
 * Stagger animation
 */
export const staggerFadeIn = (
  elements: gsap.DOMTarget,
  options?: {
    stagger?: number;
    duration?: number;
    y?: number;
    ease?: string;
  }
) => {
  return gsap.from(elements, {
    opacity: 0,
    y: options?.y || 30,
    duration: options?.duration || 0.8,
    stagger: options?.stagger || 0.1,
    ease: options?.ease || 'power3.out',
  });
};

/**
 * Text reveal animation (split by characters)
 */
export const textReveal = (
  element: gsap.DOMTarget,
  options?: {
    duration?: number;
    stagger?: number;
    ease?: string;
  }
) => {
  const text = (element as HTMLElement).textContent || '';
  const chars = text.split('');
  (element as HTMLElement).innerHTML = chars
    .map((char) => `<span class="inline-block">${char === ' ' ? '&nbsp;' : char}</span>`)
    .join('');

  return gsap.from(`${element} span`, {
    opacity: 0,
    y: 20,
    duration: options?.duration || 0.5,
    stagger: options?.stagger || 0.03,
    ease: options?.ease || 'power2.out',
  });
};

/**
 * Scale on hover
 */
export const scaleOnHover = (element: HTMLElement, scale: number = 1.05) => {
  element.addEventListener('mouseenter', () => {
    gsap.to(element, {
      scale,
      duration: 0.3,
      ease: 'power2.out',
    });
  });

  element.addEventListener('mouseleave', () => {
    gsap.to(element, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  });
};

/**
 * Smooth scroll to element
 */
export const scrollToElement = (target: string | HTMLElement, offset: number = 0) => {
  gsap.to(window, {
    duration: 1,
    scrollTo: {
      y: target,
      offsetY: offset,
    },
    ease: 'power3.inOut',
  });
};

/**
 * Create a GSAP timeline
 */
export const createTimeline = (options?: gsap.TimelineVars) => {
  return gsap.timeline(options);
};

/**
 * Kill all ScrollTriggers
 */
export const killAllScrollTriggers = () => {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
};

/**
 * Refresh ScrollTrigger
 */
export const refreshScrollTrigger = () => {
  ScrollTrigger.refresh();
};

