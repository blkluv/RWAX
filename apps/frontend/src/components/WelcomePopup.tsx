import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { X, Shield, Sparkles } from 'lucide-react';

interface WelcomePopupProps {
  onVerify: () => void;
  isWalletConnected: boolean;
  hasDID: boolean;
}

export function WelcomePopup({ onVerify, isWalletConnected, hasDID }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Trigger popup when user scrolls past the hero section
  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView && !isDismissed && !hasDID) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [inView, isDismissed, hasDID]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleVerify = () => {
    setIsVisible(false);
    setIsDismissed(true);
    onVerify();
  };

  return (
    <>
      {/* Invisible trigger element - place after WhiteHeroSection */}
      <div ref={ref} className="h-1 w-full" aria-hidden="true" />

      {/* Popup Modal */}
      {isVisible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slideUp"
            style={{
              animation: 'slideUp 0.4s ease-out'
            }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            >
              <X size={20} />
            </button>

            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-8 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome to RWAX
              </h2>
              <p className="text-white/90 text-sm">
                Real World Assets on XRP Ledger
              </p>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <p className="text-gray-600 text-center mb-6">
                To access tokenized Singapore real estate and trade yield rights, please verify your identity first.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>MAS-compliant identity verification (XLS-40)</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span>Secure on-chain DID stored on XRPL</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span>Instant access to 3,200+ tokenized properties</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                {isWalletConnected ? (
                  <button
                    onClick={handleVerify}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-emerald-300 transition-all transform hover:scale-[1.02] shadow-lg"
                  >
                    Verify My Identity
                  </button>
                ) : (
                  <button
                    onClick={handleDismiss}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white font-semibold rounded-xl hover:from-emerald-400 hover:to-emerald-300 transition-all transform hover:scale-[1.02] shadow-lg"
                  >
                    Connect Wallet First
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="w-full py-3 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
