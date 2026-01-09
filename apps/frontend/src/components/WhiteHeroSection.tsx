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

            {/* Right Column: XRP Phone Image and Demo Button (col-span-6) */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center space-y-8">
              {/* XRP Phone Image */}
              <div className="relative w-full max-w-md">
                <img
                  src="/xrp-phone.png"
                  alt="RWAX Protocol on XRPL"
                  className="w-full h-auto object-contain drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))'
                  }}
                />
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
