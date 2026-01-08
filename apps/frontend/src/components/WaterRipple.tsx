// apps/frontend/src/components/WaterRipple.tsx
// Water Ripple Effect Component - Inspired by liquid-glass-vue
// Creates a water ripple effect that follows mouse hover movements

import React, { useRef, useEffect, useState, MouseEvent } from 'react';

interface WaterRippleProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number; // 0-1, controls ripple intensity
  blurAmount?: number; // Controls blur effect
  elasticity?: number; // 0-1, controls responsiveness
  disabled?: boolean;
}

export function WaterRipple({
  children,
  className = '',
  intensity = 0.15,
  blurAmount = 0.5,
  elasticity = 0.8,
  disabled = false
}: WaterRippleProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const currentPosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (disabled || !isHovered) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Smooth animation function
    const animate = () => {
      const dx = mousePosition.x - currentPosition.current.x;
      const dy = mousePosition.y - currentPosition.current.y;

      // Apply elasticity for smooth movement
      currentPosition.current.x += dx * elasticity;
      currentPosition.current.y += dy * elasticity;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw ripple effect - water/glass style
      const gradient = ctx.createRadialGradient(
        currentPosition.current.x,
        currentPosition.current.y,
        0,
        currentPosition.current.x,
        currentPosition.current.y,
        200
      );

      // Subtle emerald glow effect
      gradient.addColorStop(0, `rgba(16, 185, 129, ${intensity * 0.8})`); // emerald-500
      gradient.addColorStop(0.4, `rgba(16, 185, 129, ${intensity * 0.4})`);
      gradient.addColorStop(0.7, `rgba(16, 185, 129, ${intensity * 0.1})`);
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        currentPosition.current.x,
        currentPosition.current.y,
        150,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Continue animation if still moving or hovering
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1 || isHovered) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePosition, isHovered, intensity, elasticity, disabled]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Fade out effect
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      let opacity = 1;
      const fadeOut = () => {
        opacity -= 0.05;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (opacity > 0) {
          const gradient = ctx.createRadialGradient(
            currentPosition.current.x,
            currentPosition.current.y,
            0,
            currentPosition.current.x,
            currentPosition.current.y,
            150
          );
          gradient.addColorStop(0, `rgba(16, 185, 129, ${intensity * opacity})`);
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(
            currentPosition.current.x,
            currentPosition.current.y,
            150,
            0,
            Math.PI * 2
          );
          ctx.fill();
          requestAnimationFrame(fadeOut);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      };
      fadeOut();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Canvas for ripple effect */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          mixBlendMode: 'overlay',
          opacity: isHovered ? 0.6 : 0,
          transition: 'opacity 0.3s ease-out'
        }}
      />
      
      {/* Content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}
