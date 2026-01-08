// apps/frontend/src/components/WhiteHeroSection.tsx
// White Hero Section - Demo-ready layout with split design
// First section user sees when page loads

import React, { useState } from 'react';
import { DemoVerificationModal } from './DemoVerificationModal';

export function WhiteHeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section 
        className="relative min-h-screen flex items-center justify-center bg-white pt-32"
        style={{
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="max-w-7xl mx-auto w-full px-6 py-20">
          {/* Split Layout: Left (Text) | Right (iPhone) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: RWAX Text and Description (col-span-6) */}
            <div className="lg:col-span-6 space-y-8">
              {/* Vertical Line Element - Left aligned */}
              <div className="flex mb-8">
                <div className="relative">
                  {/* Inverted Y or dropdown indicator at top of line */}
                  <div className="absolute -top-4 left-0">
                    <svg 
                      width="14" 
                      height="10" 
                      viewBox="0 0 14 10" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-black"
                    >
                      <path 
                        d="M2 9L7 4L12 9" 
                        stroke="currentColor" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {/* Thin vertical line - subtle dark line */}
                  <div className="w-px h-32 bg-black/30"></div>
                </div>
              </div>

              {/* Main Heading: RWAX (Heading 1) */}
              <h1 
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-black mb-6"
                style={{ 
                  fontFamily: 'sans-serif',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  fontWeight: 700
                }}
              >
                RWAX
              </h1>

              {/* Subheading: Real World Assets XRP Ledger (Normal font) */}
              <p 
                className="text-base md:text-lg lg:text-xl xl:text-2xl text-black/60 font-normal max-w-xl"
                style={{ 
                  fontFamily: 'sans-serif',
                  letterSpacing: '0',
                  lineHeight: 1.6,
                  fontWeight: 400
                }}
              >
                Real World Assets XRP Ledger
              </p>

              {/* Additional Description */}
              <p 
                className="text-sm md:text-base text-black/50 font-normal max-w-xl"
                style={{ 
                  fontFamily: 'sans-serif',
                  letterSpacing: '0',
                  lineHeight: 1.6
                }}
              >
                Tokenize Singapore real estate with compliance-first architecture. Powered by XRPL standards for identity, assets, and instant liquidity.
              </p>
            </div>

            {/* Right Column: iPhone Container and Demo Button (col-span-6) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-8">
              {/* iPhone Placeholder Container */}
              <div className="relative w-full max-w-sm">
                {/* Floating iPhone Mockup */}
                <div 
                  className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-[3rem] p-8 shadow-2xl border-8 border-black/10"
                  style={{
                    transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* iPhone Screen */}
                  <div className="bg-black rounded-[2rem] aspect-[9/19.5] flex items-center justify-center overflow-hidden shadow-inner">
                    {/* Screen Content - Mock App Interface */}
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex flex-col items-center justify-center p-6 text-white">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center backdrop-blur-sm">
                          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-lg">RWAX Protocol</p>
                          <p className="text-sm opacity-80">Identity Verification</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating effect shadow */}
                <div className="absolute -z-10 inset-0 bg-black/20 blur-2xl transform translate-y-8 rounded-full"></div>
              </div>

              {/* Demo Verification Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-black text-white px-8 py-4 rounded-lg font-medium uppercase tracking-wide hover:bg-gray-900 transition-all transform hover:scale-105 shadow-lg"
                style={{ 
                  letterSpacing: '0.1em',
                  fontFamily: 'sans-serif',
                  fontSize: '0.875rem'
                }}
              >
                Verify Identity (DID)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Verification Modal */}
      <DemoVerificationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
