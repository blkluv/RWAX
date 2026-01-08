// apps/frontend/src/components/ImpactHeroSection.tsx
// Final Hero Section - Emotional closing with CTA
// Video background with black overlay and centered content

import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ImpactHeroSectionProps {
  backgroundImage?: string; // Optional background image path (deprecated, using video instead)
}

export function ImpactHeroSection({ backgroundImage }: ImpactHeroSectionProps) {
  const handleCTAClick = () => {
    // Scroll to asset marketplace or trigger wallet connection
    const assetSection = document.querySelector('main');
    if (assetSection) {
      assetSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh'
      }}
    >
      {/* Video Background - Low opacity, full screen behind content */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          opacity: 0.15 // Low opacity - subtle background
        }}
      >
        <source src="/xrpl.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Dark Overlay for text readability */}
      <div 
        className="absolute inset-0 w-full h-full bg-black"
        style={{ 
          opacity: 0.4,
          zIndex: 1
        }}
      />

      {/* Content - Centered, Above Video */}
      <div 
        className="relative max-w-4xl mx-auto px-6 text-center"
        style={{
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Main Slogan */}
        <h2 
          className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold text-white mb-6 leading-tight"
          style={{ 
            fontFamily: 'sans-serif',
            letterSpacing: '-0.02em',
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)'
          }}
        >
          Liquidity Without Borders.
        </h2>

        {/* Sub-text */}
        <p 
          className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          style={{ 
            fontFamily: 'sans-serif',
            letterSpacing: '0',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)'
          }}
        >
          Bridging the $3 Trillion Real Estate Market to the XRP Ledger.
        </p>

        {/* CTA Button - Large, Glowing */}
        <button
          onClick={handleCTAClick}
          className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black px-8 md:px-12 py-5 md:py-6 rounded-xl font-bold text-base md:text-lg uppercase tracking-wide hover:from-emerald-400 hover:to-emerald-300 transition-all duration-300 transform hover:scale-105 shadow-2xl"
          style={{ 
            letterSpacing: '0.1em',
            fontFamily: 'sans-serif',
            boxShadow: '0 0 40px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.3), inset 0 0 20px rgba(255, 255, 255, 0.1)'
          }}
        >
          <span>Start Tokenizing Now</span>
          <ArrowRight 
            className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-1" 
            strokeWidth={3}
          />
          
          {/* Glow effect overlay */}
          <div 
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at center, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
              filter: 'blur(20px)',
              zIndex: -1
            }}
          />
        </button>
      </div>
    </section>
  );
}
