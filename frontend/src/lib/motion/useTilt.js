import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { MOTION_OK } from './reducedMotion';
import { EASE } from './easings';

export function useTilt({ max = 8, scale = 1.02, perspective = 1000 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !MOTION_OK) return;

    el.style.transformStyle = 'preserve-3d';
    el.style.perspective = `${perspective}px`;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const rx = ((e.clientY - cy) / (rect.height / 2)) * -max;
      const ry = ((e.clientX - cx) / (rect.width / 2)) * max;

      anime({
        targets: el,
        rotateX: rx,
        rotateY: ry,
        scale,
        duration: 250,
        easing: EASE.outQuad,
      });
    };

    const onLeave = () => {
      anime({
        targets: el,
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 500,
        easing: EASE.outExpo,
      });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return ref;
}
