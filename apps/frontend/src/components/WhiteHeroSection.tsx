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
        className="relative flex items-center justify-center min-h-screen pt-32 bg-white"
        style={{
          position: 'relative',
          zIndex: 10
        }}
      >
        <div className="w-full px-6 py-20 mx-auto max-w-7xl">
          {/* Split Layout: Left (Text) | Right (iPhone) */}
          <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            
            {/* Left Column: RWAX Text and Description (col-span-6) */}
            <div className="space-y-8 lg:col-span-6">
              {/* Main Heading: RWAX (Heading 1) */}
              <h1 
                className="mb-6 text-5xl font-bold text-black md:text-6xl lg:text-7xl xl:text-8xl"
                style={{ 
                  fontFamily: 'sans-serif',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  fontWeight: 700
                }}
              >
                XRPLRWA
              </h1>

              {/* Subheading: Real World Assets XRP Ledger (Normal font) */}
              <p 
                className="max-w-xl text-base font-normal md:text-lg lg:text-xl xl:text-2xl text-black/60"
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
                className="max-w-xl text-sm font-normal md:text-base text-black/50"
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
            <div className="flex flex-col items-center justify-center space-y-8 lg:col-span-6">
              {/* XRP Phone Image */}
              <div className="relative w-full max-w-md">
                <img
                  src="/xrp-phone.png"
                  alt="RWAX Protocol on XRPL"
                  className="object-contain w-full h-auto drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))'
                  }}
                />
              </div>

              {/* Demo Verification Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 font-medium tracking-wide text-white uppercase transition-all transform bg-black rounded-lg shadow-lg hover:bg-gray-900 hover:scale-105"
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
