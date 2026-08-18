import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { MOTION_OK } from './reducedMotion';
import { EASE } from './easings';

export function useMagnetic({ strength = 0.35, radius = 40 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !MOTION_OK || window.innerWidth < 768) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        anime({
          targets: el,
          translateX: dx * strength,
          translateY: dy * strength,
          duration: 300,
          easing: EASE.outExpo,
        });
      }
    };

    const onLeave = () => {
      anime({
        targets: el,
        translateX: 0,
        translateY: 0,
        duration: 550,
        easing: EASE.outExpo,
      });
    };

    window.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return ref;
}
