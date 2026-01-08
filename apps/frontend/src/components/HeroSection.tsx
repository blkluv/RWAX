// apps/frontend/src/components/HeroSection.tsx
// Hero Section - Dark stats section with horizontal layout
// Updated with RWA market data and smooth count-up animations

import React from 'react';
import { AnimatedCounter } from './AnimatedCounter';

export function HeroSection() {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center px-6 py-20 pt-32 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Container */}
      <div className="max-w-7xl mx-auto w-full relative z-10">
        
        {/* Horizontal Stats Row - Centered */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 xl:gap-24 mb-16">
          
          {/* Stat 1: Tokenized Market Size */}
          <div className="flex-1 flex flex-col items-center text-center">
            <AnimatedCounter
              value="$14 Billion"
              label="Tokenized Market Size | Largest RWA Segment"
              duration={1.2}
            />
          </div>

          {/* Stat 2: Projected Global Market */}
          <div className="flex-1 flex flex-col items-center text-center">
            <AnimatedCounter
              value="$3 Trillion"
              label="Projected Global Market | By 2028"
              duration={1.2}
            />
          </div>

          {/* Stat 3: Yield Premium */}
          <div className="flex-1 flex flex-col items-center text-center">
            <AnimatedCounter
              value="8-12%"
              label="Yield Premium | Uncorrelated to Public Markets"
              duration={1.2}
            />
          </div>
        </div>

        {/* Headline - Positioned below the stats with generous spacing */}
        <div className="mt-16 md:mt-24 lg:mt-32">
          <h2 
            className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight max-w-4xl mx-auto text-center lg:whitespace-nowrap"
            style={{ 
              fontFamily: 'sans-serif',
              letterSpacing: '-0.01em'
            }}
          >
            Real Estate Tokenization at Scale
          </h2>
        </div>
      </div>
    </section>
  );
}
