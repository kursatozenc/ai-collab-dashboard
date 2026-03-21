"use client";
import { useRef, useEffect } from "react";

const PARTICLE_COUNT = 60;
const CONNECTION_DIST = 130;
const CURSOR_RADIUS = 140;
const CURSOR_FORCE = 0.012;
const DAMPING = 0.98;

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: [number, number, number];
  alpha: number;
};

function makeParticle(w: number, h: number): Particle {
  const rnd = Math.random();
  // 80% neutral tan, 12% research blue, 8% industry gold
  const color: [number, number, number] =
    rnd < 0.8
      ? [180, 155, 120]
      : rnd < 0.92
      ? [61, 95, 125]
      : [164, 120, 58];
  const baseAlpha = rnd < 0.8 ? 0.35 : 0.7;
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
    r: rnd < 0.8 ? 1 + Math.random() * 1 : 1.5 + Math.random() * 1,
    color,
    alpha: baseAlpha + Math.random() * 0.15,
  };
}

export default function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    let rafId: number;
    let w = 0,
      h = 0;
    let mx = -1000,
      my = -1000;
    let ghostMx = -1000,
      ghostMy = -1000;
    const GHOST_LERP = 0.10;
    let particles: Particle[] = [];
    let initialized = false;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      if (w === 0 || h === 0) return;
      canvas.width = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      if (!initialized) {
        particles = Array.from({ length: PARTICLE_COUNT }, () =>
          makeParticle(w, h)
        );
        initialized = true;
      }
    }

    function onMouse(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    }

    function tick() {
      if (document.hidden || w === 0 || h === 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      const m = 30;

      // Ghost cursor — lerps toward real cursor for inertia/weight feel
      ghostMx += (mx - ghostMx) * GHOST_LERP;
      ghostMy += (my - ghostMy) * GHOST_LERP;

      for (const p of particles) {
        const dx = p.x - ghostMx;
        const dy = p.y - ghostMy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CURSOR_RADIUS && dist > 0) {
          const f = (1 - dist / CURSOR_RADIUS) * CURSOR_FORCE;
          p.vx += (dx / dist) * f;
          p.vy += (dy / dist) * f;
        }
        p.vx *= DAMPING;
        p.vy *= DAMPING;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -m) p.x += w + 2 * m;
        if (p.x > w + m) p.x -= w + 2 * m;
        if (p.y < -m) p.y += h + 2 * m;
        if (p.y > h + m) p.y -= h + 2 * m;
      }

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECTION_DIST) {
            const opacity = (1 - d / CONNECTION_DIST) * 0.18;
            ctx.strokeStyle = `rgba(180,155,120,${opacity.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.alpha.toFixed(2)})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    window.addEventListener("mousemove", onMouse);
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
