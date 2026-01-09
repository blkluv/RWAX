// apps/frontend/src/components/Toast.tsx
// Enhanced Toast Notification Component with XRPScan transaction link support

import React, { useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, ExternalLink } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  txHash?: string; // Transaction hash for XRPScan link
}

export function Toast({ message, type = 'success', isVisible, onClose, duration = 5000, txHash }: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const bgColor = {
    success: 'bg-emerald-500/90 border-emerald-400',
    error: 'bg-red-500/90 border-red-400',
    info: 'bg-blue-500/90 border-blue-400'
  }[type];

  const Icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  }[type];

  // XRPScan testnet URL for transaction
  const xrpScanUrl = txHash ? `https://testnet.xrpl.org/transactions/${txHash}` : null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
      <div className={`${bgColor} backdrop-blur-sm border rounded-lg shadow-2xl p-4 min-w-[360px] max-w-md`}>
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 text-white shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{message}</p>

            {/* XRPScan Transaction Link */}
            {txHash && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-white/80 text-xs font-mono">
                  <span>TX:</span>
                  <span className="truncate max-w-[180px]">{txHash}</span>
                </div>
                <a
                  href={xrpScanUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-md text-white text-xs font-semibold transition-all group"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on XRPL Explorer
                  <span className="text-white/60 group-hover:text-white transition-colors">↗</span>
                </a>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
