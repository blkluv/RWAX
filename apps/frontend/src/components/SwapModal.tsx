import React, { useState } from 'react';
import { X, ArrowDown, Coins, AlertCircle, CheckCircle } from 'lucide-react';
import { Logger, logAction } from '../utils/logger';

interface SwapModalProps {
  asset: {
    identity: {
      project: string;
    };
    financials: {
      tokens: {
        yt_ticker: string;
      };
      yield_apy: number;
    };
    chain_info?: {
      amm?: {
        trading_fee: number;
      };
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onSwap: (amount: string) => void;
}

/**
 * SwapModal Component
 * 
 * [XLS-30 Implementation] Polished Swap Interface
 * 
 * Provides a professional fintech-style swap interface for exchanging
 * XRP for Yield Rights tokens via AMM pools.
 * 
 * Features:
 * - Clean, minimal design with glassmorphism
 * - Real-time fee calculation
 * - Amount validation
 * - Transaction preview
 */
export function SwapModal({ asset, isOpen, onClose, onSwap }: SwapModalProps) {
  const [xrpAmount, setXrpAmount] = useState('');
  const [estimatedTokens, setEstimatedTokens] = useState('0');
  const tradingFee = asset.chain_info?.amm?.trading_fee || 0.5;

  if (!isOpen) return null;

  // Calculate estimated tokens (simplified - real calculation would use AMM math)
  const handleXrpChange = (value: string) => {
    setXrpAmount(value);
    // Simplified calculation: assume 1 XRP = 100 tokens (demo rate)
    if (value && !isNaN(parseFloat(value))) {
      const tokens = (parseFloat(value) * 100 * (1 - tradingFee / 100)).toFixed(2);
      setEstimatedTokens(tokens);
    } else {
      setEstimatedTokens('0');
    }
  };

  const handleSwap = () => {
    if (!xrpAmount || parseFloat(xrpAmount) <= 0) {
      Logger.error("Invalid swap amount", { amount: xrpAmount });
      return;
    }
    
    logAction("Swap Confirmed in Modal", {
      asset: asset.identity.project,
      xrpAmount,
      estimatedTokens,
      tradingFee: `${tradingFee}%`
    });
    
    Logger.amm("Swap Transaction Initiated", {
      from: "XRP",
      to: asset.financials.tokens.yt_ticker,
      amount: `${xrpAmount} XRP`,
      estimatedTokens: `${estimatedTokens} tokens`,
      fee: `${tradingFee}%`
    });
    
    onSwap(xrpAmount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl w-full max-w-md relative shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-zinc-800/50">
          <h2 className="text-2xl font-bold text-white mb-1">Swap Yield Rights</h2>
          <p className="text-sm text-zinc-400">{asset.identity.project}</p>
        </div>

        {/* Swap Interface */}
        <div className="p-6 space-y-4">
          {/* You Pay */}
          <div className="bg-black/40 backdrop-blur-sm border border-zinc-800 rounded-xl p-4">
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              You Pay
            </label>
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={xrpAmount}
                onChange={(e) => handleXrpChange(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-2xl font-bold text-white outline-none w-full"
              />
              <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-2 rounded-lg">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white">XRP</span>
              </div>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Balance: ~90 XRP available
            </p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-2">
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-full p-2">
              <ArrowDown className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* You Receive */}
          <div className="bg-emerald-900/20 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-4">
            <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">
              You Receive
            </label>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-emerald-400">
                {estimatedTokens}
              </div>
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                <span className="font-bold text-emerald-400">{asset.financials.tokens.yt_ticker}</span>
              </div>
            </div>
            <p className="text-xs text-emerald-400/70 mt-2">
              Yield: {asset.financials.yield_apy}% APY
            </p>
          </div>

          {/* Fee Info */}
          <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Trading Fee</span>
              <span className="text-zinc-300">{tradingFee}%</span>
            </div>
            {parseFloat(xrpAmount) > 0 && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-zinc-400">Fee Amount</span>
                <span className="text-zinc-300">
                  {((parseFloat(xrpAmount) || 0) * tradingFee / 100).toFixed(4)} XRP
                </span>
              </div>
            )}
          </div>

          {/* Transaction Preview */}
          {parseFloat(xrpAmount) > 0 && (
            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-400">
                  <p className="font-medium">Instant Swap via AMM</p>
                  <p className="text-emerald-400/70 mt-0.5">
                    Transaction will route through liquidity pool automatically
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {xrpAmount && parseFloat(xrpAmount) <= 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <div className="text-xs text-red-400">
                  Please enter a valid amount
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="p-6 border-t border-zinc-800/50 bg-black/20">
          <button
            onClick={handleSwap}
            disabled={!xrpAmount || parseFloat(xrpAmount) <= 0}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-bold rounded-xl hover:from-emerald-400 hover:to-emerald-300 hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Swap
          </button>
          <p className="text-[10px] text-zinc-500 text-center mt-3">
            By swapping, you agree to the terms of service
          </p>
        </div>
      </div>
    </div>
  );
}
