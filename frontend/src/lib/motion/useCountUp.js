import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { MOTION_OK } from './reducedMotion';
import { EASE } from './easings';

/**
 * Usage:
 *   const ref = useCountUp({ to: 1247, suffix: '+' });
 *   <span ref={ref}>0</span>
 */
export function useCountUp({ to, duration = 1800, decimals = 0, prefix = '', suffix = '' } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();

      if (!MOTION_OK) {
        el.textContent = prefix + to.toFixed(decimals) + suffix;
        return;
      }

      const obj = { value: 0 };
      anime({
        targets: obj,
        value: to,
        duration,
        easing: EASE.outExpo,
        onUpdate: () => {
          el.textContent = prefix + obj.value.toFixed(decimals) + suffix;
        }
      });
    }, { threshold: 0.3 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [to]);

  return ref;
}
