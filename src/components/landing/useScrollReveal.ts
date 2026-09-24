import { useEffect } from 'react';

/**
 * Lightweight scroll reveal system using IntersectionObserver.
 * - Graceful degradation: elements remain 100% visible if JS is disabled or observer unavailable.
 * - Once-per-visit reveal: elements stay visible once triggered, preventing jitter.
 * - Accessible: respects prefers-reduced-motion: reduce.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      return;
    }

    // Enable reveal animations by marking root
    document.documentElement.classList.add('reveal-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => {
      observer.observe(el);
    });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('reveal-ready');
    };
  }, []);
}
