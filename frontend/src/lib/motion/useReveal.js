import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { MOTION_OK } from './reducedMotion';
import { EASE, DUR } from './easings';

/**
 * Attach ref to a container. All direct children will animate in
 * when the container enters the viewport.
 *
 * Usage:
 *   const ref = useReveal();
 *   <section ref={ref}>...</section>
 */
export function useReveal({ threshold = 0.2, staggerDelay = 110 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = Array.from(el.children);

    // Set initial invisible state
    children.forEach(c => {
      c.style.opacity = '0';
      c.style.transform = 'translateY(48px)';
      if (MOTION_OK) c.style.filter = 'blur(4px)';
    });

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      anime({
        targets: children,
        opacity: [0, 1],
        translateY: [48, 0],
        ...(MOTION_OK ? { filter: ['blur(4px)', 'blur(0px)'] } : {}),
        duration: MOTION_OK ? DUR.entrance : 200,
        easing: EASE.outExpo,
        delay: anime.stagger(staggerDelay, { start: 60 }),
        onComplete: () => {
          // Clean up will-change after animation
          children.forEach(c => { c.style.filter = ''; });
        }
      });
    }, { threshold });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
