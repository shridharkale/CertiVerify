import { useEffect, useRef } from 'react';
import { MOTION_OK } from './reducedMotion';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Usage:
 *   const ref = useScramble('CERT-2024-A3F');
 *   <span ref={ref} />
 *
 * Scrambles random chars, then settles into the real text.
 */
export function useScramble(finalText, { duration = 1200, startDelay = 200 } = {}) {
  const ref = useRef(null);

  const trigger = () => {
    const el = ref.current;
    if (!el) return;

    if (!MOTION_OK) {
      el.textContent = finalText;
      return;
    }

    const chars = finalText.split('');
    let frame = 0;
    const totalFrames = Math.floor(duration / 16);
    const settleStart = Math.floor(totalFrames * 0.4);

    const tick = () => {
      const settled = Math.max(0, frame - settleStart);
      const settledCount = Math.floor((settled / (totalFrames - settleStart)) * chars.length);

      el.textContent = chars.map((c, i) => {
        if (i < settledCount || c === '-' || c === ' ') return c;
        return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      }).join('');

      frame++;
      if (frame < totalFrames) setTimeout(tick, 16);
      else el.textContent = finalText;
    };

    setTimeout(tick, startDelay);
  };

  return { ref, trigger };
}
