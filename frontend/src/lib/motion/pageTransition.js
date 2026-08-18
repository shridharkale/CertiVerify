import anime from 'animejs';
import { MOTION_OK } from './reducedMotion';
import { EASE } from './easings';

/**
 * Creates a 3-bar vertical wipe overlay for route transitions.
 * Call transitionOut() before navigate(), transitionIn() after mount.
 *
 * Usage in App.jsx:
 *   import { createTransitionOverlay } from './lib/motion/pageTransition';
 *   const { transitionOut, transitionIn } = createTransitionOverlay();
 */
export function createTransitionOverlay() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    display: flex; pointer-events: none;
  `;

  const bars = Array.from({ length: 3 }, () => {
    const bar = document.createElement('div');
    bar.style.cssText = `
      flex: 1; background: #140E22;
      transform: translateY(-105%);
    `;
    overlay.appendChild(bar);
    return bar;
  });

  document.body.appendChild(overlay);

  const transitionOut = () => new Promise(resolve => {
    if (!MOTION_OK) { resolve(); return; }
    anime({
      targets: bars,
      translateY: ['-105%', '0%'],
      duration: 350,
      easing: EASE.outExpo,
      delay: anime.stagger(60),
      onComplete: resolve
    });
  });

  const transitionIn = () => new Promise(resolve => {
    if (!MOTION_OK) { resolve(); return; }
    anime({
      targets: bars,
      translateY: ['0%', '105%'],
      duration: 350,
      easing: 'inExpo',
      delay: anime.stagger(60, { direction: 'reverse' }),
      onComplete: resolve
    });
  });

  return { transitionOut, transitionIn, cleanup: () => overlay.remove() };
}
