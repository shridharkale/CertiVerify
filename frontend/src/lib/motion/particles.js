const isMobile = () => window.innerWidth < 768;

export function initParticles(canvas, options = {}) {
  const {
    count = 45,
    color = '#7C3AED',
    linkColor = 'rgba(124,58,237,0.12)',
    linkDistance = 120,
  } = options;

  const ctx = canvas.getContext('2d');
  let animId;
  let particles = [];
  const N = isMobile() ? 20 : count;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  function createParticles() {
    particles = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: 1.5 + Math.random() * 2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < N; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.6;
      ctx.fill();

      for (let j = i + 1; j < N; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkDistance) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = linkColor;
          ctx.globalAlpha = 1 - dist / linkDistance;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(draw);
  }

  // Pause when tab hidden
  const handleVisibility = () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else animId = requestAnimationFrame(draw);
  };

  resize();
  createParticles();
  draw();
  window.addEventListener('resize', () => { resize(); createParticles(); });
  document.addEventListener('visibilitychange', handleVisibility);

  // Return cleanup function
  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
