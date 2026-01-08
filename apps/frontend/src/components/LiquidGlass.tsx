// apps/frontend/src/components/LiquidGlass.tsx
// Liquid Glass Effect Component - Inspired by liquid-glass-vue tutorial
// Creates a liquid glass displacement effect that follows mouse hover movements

import React, { useRef, useEffect, useState, MouseEvent } from 'react';
import './LiquidGlass.css';

interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  turbulenceBaseFrequency?: number;
  displacementScale?: number;
  blurAmount?: number;
}

export function LiquidGlass({
  children,
  className = '',
  turbulenceBaseFrequency = 0.01,
  displacementScale = 200,
  blurAmount = 2
}: LiquidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<SVGFETurbulenceElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!filterRef.current || !isHovered) return;

    // Animate the turbulence based on mouse position
    const animate = () => {
      if (!filterRef.current) return;
      
      // Update baseFrequency based on mouse position for dynamic effect
      const baseFreqX = turbulenceBaseFrequency + (mousePosition.x - 0.5) * 0.02;
      const baseFreqY = turbulenceBaseFrequency + (mousePosition.y - 0.5) * 0.02;
      
      filterRef.current.setAttribute('baseFrequency', `${baseFreqX} ${baseFreqY}`);
    };

    const interval = setInterval(animate, 16); // ~60fps
    return () => clearInterval(interval);
  }, [mousePosition, isHovered, turbulenceBaseFrequency]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setMousePosition({ x, y });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0.5, y: 0.5 }); // Reset to center
    // Reset filter
    if (filterRef.current) {
      filterRef.current.setAttribute('baseFrequency', `${turbulenceBaseFrequency} ${turbulenceBaseFrequency}`);
    }
  };

  return (
    <>
      {/* SVG Filter Definition */}
      <svg style={{ display: 'none', position: 'absolute' }} width="0" height="0">
        <defs>
          <filter id="liquidGlassFilter" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              ref={filterRef}
              type="turbulence"
              baseFrequency={`${turbulenceBaseFrequency} ${turbulenceBaseFrequency}`}
              numOctaves="2"
              result="turbulence"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="turbulence"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div
        ref={containerRef}
        className={`liquid-glass-card ${className}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          filter: isHovered ? 'url(#liquidGlassFilter)' : 'none',
          backdropFilter: isHovered 
            ? `brightness(1.1) blur(${blurAmount}px)` 
            : 'brightness(1.0) blur(0px)',
          transition: 'backdrop-filter 0.26s ease-out, filter 0.26s ease-out'
        }}
      >
        {children}
      </div>
    </>
  );
}
