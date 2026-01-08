// apps/frontend/src/components/BackgroundRipple.tsx
// Global Background Water Ripple Effect - Follows mouse cursor
// Layer: z-0 (behind everything, visible on black background)

import React, { useEffect, useRef, useState } from 'react';

interface RippleRing {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  life: number;
}

export function BackgroundRipple() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const currentPosition = useRef({ x: -1000, y: -1000 });
  const rippleRingsRef = useRef<RippleRing[]>([]);
  const lastRippleTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      const now = Date.now();
      const dx = mousePosition.x - currentPosition.current.x;
      const dy = mousePosition.y - currentPosition.current.y;

      currentPosition.current.x += dx * 0.15;
      currentPosition.current.y += dy * 0.15;

      // Clear canvas (transparent)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isVisible && currentPosition.current.x >= 0 && currentPosition.current.y >= 0) {
        // Create new ripple periodically
        if (now - lastRippleTimeRef.current > 500 && Math.abs(dx) < 3 && Math.abs(dy) < 3) {
          if (rippleRingsRef.current.length < 3) {
            rippleRingsRef.current.push({
              x: currentPosition.current.x,
              y: currentPosition.current.y,
              radius: 0,
              opacity: 0.4, // Visible white on black
              life: 1.0
            });
            lastRippleTimeRef.current = now;
          }
        }

        // Draw all ripple rings
        rippleRingsRef.current = rippleRingsRef.current.filter(ring => {
          ring.radius += 2;
          ring.life -= 0.015;
          ring.opacity = ring.life * 0.4;

          if (ring.life > 0 && ring.opacity > 0.02 && ring.radius < 250) {
            // Draw main ring (thick white line)
            ctx.strokeStyle = `rgba(255, 255, 255, ${ring.opacity})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw glow around ring
            const glowGradient = ctx.createRadialGradient(
              ring.x,
              ring.y,
              ring.radius - 8,
              ring.x,
              ring.y,
              ring.radius + 20
            );
            glowGradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
            glowGradient.addColorStop(0.5, `rgba(255, 255, 255, ${ring.opacity * 0.6})`);
            glowGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(ring.x, ring.y, ring.radius + 20, 0, Math.PI * 2);
            ctx.fill();
          }

          return ring.life > 0 && ring.radius < 250;
        });

        // Core cursor dot
        ctx.fillStyle = `rgba(255, 255, 255, 0.3)`;
        ctx.beginPath();
        ctx.arc(currentPosition.current.x, currentPosition.current.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePosition, isVisible]);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
      
      const dx = Math.abs(e.clientX - currentPosition.current.x);
      const dy = Math.abs(e.clientY - currentPosition.current.y);
      
      if ((dx > 15 || dy > 15) && rippleRingsRef.current.length < 3) {
        rippleRingsRef.current.push({
          x: e.clientX,
          y: e.clientY,
          radius: 0,
          opacity: 0.35,
          life: 1.0
        });
        lastRippleTimeRef.current = Date.now();
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
      rippleRingsRef.current = [];
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 5, // Above ThreeHero (-z-10), below content (z-10)
        backgroundColor: 'transparent',
        opacity: 1,
      }}
    />
  );
}
