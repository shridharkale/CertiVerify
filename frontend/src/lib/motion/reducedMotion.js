export const MOTION_OK =
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Returns animationProps if motion is allowed, else a simple fade.
 * Use this to wrap every animate() call.
 */
export function safeAnimate(fullProps, targets, anime_animate) {
  if (MOTION_OK) {
    anime_animate(targets, fullProps);
  } else {
    anime_animate(targets, { opacity: [0, 1], duration: 200 });
  }
}
