// apps/frontend/src/components/AssetDetailModal.tsx
// Asset Detail Modal - Shows full asset information with Swap button

import React from 'react';
import { X, Shield, TrendingUp, MapPin, Coins } from 'lucide-react';
import { SwapModal } from './SwapModal';

interface AssetDetailModalProps {
  asset: any;
  isOpen: boolean;
  onClose: () => void;
  onSwap: (asset: any) => void;
  hasDID: boolean;
}

export function AssetDetailModal({ asset, isOpen, onClose, onSwap, hasDID }: AssetDetailModalProps) {
  const [showSwapModal, setShowSwapModal] = React.useState(false);
  const hasAMM = asset.chain_info?.amm?.exists;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Header */}
          <div className="p-6 border-b border-zinc-800/50">
            <h2 className="text-2xl font-bold text-white mb-2">{asset.identity.project}</h2>
            <div className="flex items-center gap-4 text-sm text-zinc-400">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{asset.identity.district}</span>
              </div>
              <span>•</span>
              <span>{asset.identity.type}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Financial Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Yield APY</p>
                <p className="text-3xl font-bold text-emerald-400">{asset.financials.yield_apy}%</p>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border border-zinc-800 rounded-xl p-4">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Risk Rating</p>
                <p className="text-2xl font-bold text-white">{asset.insights.risk_rating}</p>
              </div>
            </div>

            {/* Chain Info */}
            {asset.chain_info && (
              <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">On-Chain Information</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Token</span>
                    <span className="text-white font-mono">{asset.financials.tokens.yt_ticker}</span>
                  </div>
                  {asset.chain_info.oracle?.price_set && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Oracle Price</span>
                      <span className="text-emerald-400">✓ Verified</span>
                    </div>
                  )}
                  {hasAMM && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Liquidity Pool</span>
                      <span className="text-emerald-400">✓ Active</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compliance */}
            {asset.chain_info?.clawback_enabled && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="font-semibold text-white">MAS Regulated Asset</p>
                    <p className="text-xs text-zinc-400 mt-1">Compliance enforcement enabled (XLS-39)</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-zinc-800/50 bg-black/20 space-y-3">
            {hasAMM && hasDID ? (
              <button
                onClick={() => setShowSwapModal(true)}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-bold rounded-xl hover:from-emerald-400 hover:to-emerald-300 hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                Swap Yield Rights
              </button>
            ) : hasAMM && !hasDID ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full py-4 bg-zinc-700 text-zinc-400 font-bold rounded-xl cursor-not-allowed"
                >
                  Identity Verification Required
                </button>
                <p className="text-xs text-zinc-500 text-center">
                  Please verify your identity to swap tokens
                </p>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-4 bg-zinc-700 text-white font-bold rounded-xl hover:bg-zinc-600 transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Swap Modal */}
      {showSwapModal && (
        <SwapModal
          asset={asset}
          isOpen={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          onSwap={(swapParams: any) => {
            setShowSwapModal(false);
            onSwap({ ...asset, swapParams });
          }}
        />
      )}
    </>
  );
}
