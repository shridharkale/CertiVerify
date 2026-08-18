import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Lenis from 'lenis';
import './index.css'
import App from './App.jsx'
import { MOTION_OK } from './lib/motion/reducedMotion';

// Initialize Lenis smooth scroll (only if motion is allowed)
if (MOTION_OK) {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
