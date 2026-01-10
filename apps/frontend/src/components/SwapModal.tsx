import React, { useState } from 'react';
import { X, ArrowDown, Coins, AlertCircle, CheckCircle } from 'lucide-react';
import { Logger, logAction } from '../utils/logger';

interface SwapParams {
  fromAsset: 'XRP' | 'PT' | 'YT' | 'RLUSD';
  toAsset: 'XRP' | 'PT' | 'YT' | 'RLUSD';
  fromAmount: string;
  toAssetInfo?: {
    currency: string;
    issuer: string;
    ticker: string;
  };
  deliverMin?: string;
}

interface SwapModalProps {
  asset: {
    identity: {
      project: string;
    };
    financials: {
      tokens: {
        yt_ticker: string;
        pt_ticker?: string;
      };
      yield_apy: number;
    };
    chain_info?: {
      issuer?: string;
      currency?: string;
      tokens?: {
        pt?: { currency: string; ticker: string };
        yt?: { currency: string; ticker: string };
      };
      amm?: {
        exists?: boolean;
        trading_fee?: number;
        yt?: { exists: boolean; trading_fee?: number };
        pt?: { exists: boolean };
      };
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onSwap: (swapParams: SwapParams) => void;
  rlusdInfo?: {
    issuer: string;
    currency: string;
    ticker: string;
  };
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
export function SwapModal({ asset, isOpen, onClose, onSwap, rlusdInfo }: SwapModalProps) {
  const [fromAsset, setFromAsset] = useState<'XRP' | 'PT' | 'YT' | 'RLUSD'>('XRP');
  const [toAsset, setToAsset] = useState<'XRP' | 'PT' | 'YT' | 'RLUSD'>('YT');
  const [amount, setAmount] = useState('100'); // Default to 100 for demo
  const [estimatedTokens, setEstimatedTokens] = useState('9950');
  const tradingFee = asset.chain_info?.amm?.trading_fee || asset.chain_info?.amm?.yt?.trading_fee || 0.5;

  // Update estimated tokens when parameters change
  React.useEffect(() => {
    if (isOpen && amount) {
      const value = parseFloat(amount);
      if (!isNaN(value) && value > 0) {
        // Simplified calculation based on asset types
        let tokens = 0;
        if (fromAsset === 'XRP') {
          tokens = value * 100; // 1 XRP = 100 tokens
        } else {
          tokens = value * 1.0; // 1:1 for token-to-token
        }
        setEstimatedTokens((tokens * (1 - tradingFee / 100)).toFixed(2));
      } else {
        setEstimatedTokens('0');
      }
    }
  }, [isOpen, amount, fromAsset, toAsset, tradingFee]);

  if (!isOpen) return null;

  // Calculate estimated tokens (simplified - real calculation would use AMM math)
  const handleAmountChange = (value: string) => {
    setAmount(value);
    const numValue = parseFloat(value);
    if (value && !isNaN(numValue) && numValue > 0) {
      let tokens = 0;
      if (fromAsset === 'XRP') {
        tokens = numValue * 100;
      } else {
        tokens = numValue * 1.0;
      }
      setEstimatedTokens((tokens * (1 - tradingFee / 100)).toFixed(2));
    } else {
      setEstimatedTokens('0');
    }
  };

  const handleSwap = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Logger.error("Invalid swap amount", { amount });
      return;
    }
    
    // Determine destination asset info
    const toAssetInfo = toAsset === 'YT'
      ? {
          currency: asset.chain_info?.currency || asset.chain_info?.tokens?.yt?.currency || '',
          issuer: asset.chain_info?.issuer || '',
          ticker: asset.financials.tokens.yt_ticker
        }
      : toAsset === 'PT'
      ? {
          currency: asset.chain_info?.tokens?.pt?.currency || '',
          issuer: asset.chain_info?.issuer || '',
          ticker: asset.financials.tokens.pt_ticker || ''
        }
      : toAsset === 'RLUSD' && rlusdInfo
      ? rlusdInfo
      : undefined;
    
    const deliverMin = (parseFloat(estimatedTokens) * 0.98).toFixed(2); // 2% slippage protection
    
    logAction("Swap Confirmed in Modal", {
      asset: asset.identity.project,
      from: fromAsset,
      to: toAsset,
      amount,
      estimatedTokens,
      tradingFee: `${tradingFee}%`
    });
    
    Logger.amm("Swap Transaction Initiated", {
      from: fromAsset,
      to: toAsset,
      amount: `${amount} ${fromAsset}`,
      estimatedTokens: `${estimatedTokens} ${toAsset}`,
      fee: `${tradingFee}%`
    });
    
    onSwap({
      fromAsset,
      toAsset,
      fromAmount: amount,
      toAssetInfo,
      deliverMin
    });
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
            <div className="flex items-center justify-between gap-2 mb-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="bg-transparent text-2xl font-bold text-white outline-none w-full"
              />
              <select
                value={fromAsset}
                onChange={(e) => setFromAsset(e.target.value as 'XRP' | 'PT' | 'YT' | 'RLUSD')}
                className="bg-zinc-800/50 text-white px-3 py-2 rounded-lg border border-zinc-700 outline-none"
              >
                <option value="XRP">XRP</option>
                <option value="PT">PT</option>
                <option value="YT">YT</option>
                {rlusdInfo && <option value="RLUSD">RLUSD</option>}
              </select>
            </div>
            <p className="text-xs text-zinc-600 mt-2">
              Balance: ~90 {fromAsset} available
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
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-2xl font-bold text-emerald-400">
                {estimatedTokens}
              </div>
              <select
                value={toAsset}
                onChange={(e) => setToAsset(e.target.value as 'XRP' | 'PT' | 'YT' | 'RLUSD')}
                className="bg-emerald-500/10 text-emerald-400 px-3 py-2 rounded-lg border border-emerald-500/20 outline-none"
              >
                <option value="XRP">XRP</option>
                <option value="PT">PT</option>
                <option value="YT">YT</option>
                {rlusdInfo && <option value="RLUSD">RLUSD</option>}
              </select>
            </div>
            {toAsset === 'YT' && (
              <p className="text-xs text-emerald-400/70 mt-2">
                Yield: {asset.financials.yield_apy}% APY
              </p>
            )}
          </div>

          {/* Fee Info */}
          <div className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/50">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Trading Fee</span>
              <span className="text-zinc-300">{tradingFee}%</span>
            </div>
            {parseFloat(amount) > 0 && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-zinc-400">Fee Amount</span>
                <span className="text-zinc-300">
                  {((parseFloat(amount) || 0) * tradingFee / 100).toFixed(4)} {fromAsset}
                </span>
              </div>
            )}
          </div>

          {/* Transaction Preview */}
          {parseFloat(amount) > 0 && (
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
          {amount && parseFloat(amount) <= 0 && (
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
            disabled={!amount || parseFloat(amount) <= 0}
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
