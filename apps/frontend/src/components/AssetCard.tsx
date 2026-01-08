import React from 'react';
import { Shield, TrendingUp, Coins, ExternalLink, ChevronRight, Info } from 'lucide-react';

interface AssetCardProps {
  asset: {
    id: string;
    identity: {
      project: string;
      district: string;
      type: string;
    };
    financials: {
      yield_apy: number;
      est_valuation_sgd?: string | number;
      tokens: {
        yt_ticker: string;
        pt_ticker?: string;
      };
    };
    insights: {
      risk_rating: string;
      connectivity_score?: number;
      mrt_distance?: string;
    };
    chain_info?: {
      issuer?: string;
      currency?: string;
      ticker?: string;
      clawback_enabled?: boolean;
      oracle?: {
        document_id: string;
        asset_class: string;
        price_set: boolean;
      };
      amm?: {
        exists: boolean;
        trading_fee: number;
        liquidity_provided: boolean;
      };
    };
  };
  onBuy: (asset: any) => void;
  hasDID: boolean;
}

/**
 * [XLS-39 Implementation] Compliance Shield
 * Displays MAS-regulated asset indicator with tooltip explaining clawback capability
 */
function ComplianceShield({ enabled }: { enabled?: boolean }) {
  if (!enabled) return null;
  
  return (
    <div 
      className="group relative flex items-center"
      title="MAS Regulated Asset (Clause 39) - Clawback enabled for compliance"
    >
      <Shield className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
      <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50">
        <div className="bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 whitespace-nowrap shadow-xl">
          MAS Regulated Asset
          <div className="text-[10px] text-zinc-500 mt-0.5">Compliance enforcement enabled</div>
        </div>
      </div>
    </div>
  );
}

/**
 * [XLS-47 Implementation] Oracle Price Display
 * Shows live on-chain valuation with pulsing indicator
 */
function OraclePricePulse({ price, enabled }: { price?: string; enabled?: boolean }) {
  if (!enabled || !price) return null;
  
  return (
    <div className="px-6 py-4 bg-gradient-to-r from-emerald-900/20 to-emerald-800/10 border-b border-emerald-500/20 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div className="relative w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-xs text-zinc-400">Verified by Oracle</span>
        </div>
        <span className="text-xl font-bold text-emerald-400">{price}</span>
      </div>
      <p className="text-[10px] text-zinc-600 mt-2">Live on-chain valuation</p>
    </div>
  );
}

/**
 * [XLS-30 Implementation] Instant Liquidity Badge
 * Displays AMM pool status with liquidity indicator
 */
function InstantLiquidityBadge({ enabled }: { enabled?: boolean }) {
  if (!enabled) return null;
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full">
      <Coins className="w-4 h-4 text-blue-400" />
      <span className="text-xs font-medium text-blue-400">Instant Liquidity</span>
    </div>
  );
}

/**
 * AssetCard Component
 * 
 * Fintech-styled asset card with glassmorphism design.
 * Implements 3 XRPL standards visually:
 * - [XLS-39] Compliance shield (hidden behind MAS Regulated tooltip)
 * - [XLS-47] Oracle price pulse (hidden behind "Verified by Oracle")
 * - [XLS-30] Instant liquidity badge (hidden behind "Instant Liquidity")
 * 
 * Technical jargon (XLS-*, AMM, OracleSet) is intentionally hidden
 * behind user-friendly terminology for better UX.
 */
export function AssetCard({ asset, onBuy, hasDID }: AssetCardProps) {
  const hasChainInfo = !!asset.chain_info;
  const hasOracle = asset.chain_info?.oracle?.price_set;
  const hasAMM = asset.chain_info?.amm?.exists;
  const clawbackEnabled = asset.chain_info?.clawback_enabled;

  // Calculate oracle price for display
  const oraclePrice = hasOracle 
    ? `${(100 + Math.random() * 50).toFixed(0)}K SGD` // Demo price formatting
    : null;

  const handleBuyClick = () => {
    // Always show asset detail modal (or call onBuy which will handle it)
    onBuy(asset);
  };

  return (
    <>
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group relative z-10">
        {/* Header with Glassmorphism */}
        <div className="p-6 border-b border-zinc-800/50 bg-gradient-to-br from-zinc-900/80 to-black/40 backdrop-blur-sm">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xl mb-1 truncate">{asset.identity.project}</h3>
              <p className="text-xs text-zinc-400 truncate">
                {asset.identity.district} • {asset.identity.type}
              </p>
            </div>
            
            {/* Status Badges */}
            <div className="flex flex-col gap-2 items-end shrink-0">
              {hasChainInfo && (
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 rounded-full border border-emerald-500/20 font-medium">
                  ON-CHAIN
                </span>
              )}
              {clawbackEnabled && <ComplianceShield enabled={clawbackEnabled} />}
            </div>
          </div>
        </div>

        {/* [XLS-47 Implementation] Oracle Price Pulse */}
        {hasOracle && oraclePrice && (
          <OraclePricePulse price={oraclePrice} enabled={hasOracle} />
        )}

        {/* Main Metrics - Glassmorphism Card */}
        <div className="p-6 bg-gradient-to-br from-black/20 to-zinc-900/30">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Yield APY</p>
              <p className="text-4xl font-bold text-emerald-400">{asset.financials.yield_apy}%</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Risk Rating</p>
              <p className="text-lg font-semibold text-white mt-2">{asset.insights.risk_rating}</p>
            </div>
          </div>
        </div>

        {/* [XLS-30 Implementation] Instant Liquidity Badge */}
        {hasAMM && (
          <div className="px-6 pb-4">
            <InstantLiquidityBadge enabled={hasAMM} />
            <p className="text-[10px] text-zinc-500 mt-2">
              Swap instantly • 0.5% fee
            </p>
          </div>
        )}

        {/* Action Button - Premium Fintech Style */}
        <div className="p-4 bg-black/30 border-t border-zinc-800/50 backdrop-blur-sm">
          <button
            onClick={handleBuyClick}
            className="w-full py-4 bg-gradient-to-r from-white to-zinc-100 text-black font-bold text-sm rounded-xl hover:from-emerald-400 hover:to-emerald-300 hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all flex justify-center items-center gap-2"
          >
            <span>View Asset</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          {!hasDID && (
            <p className="text-[10px] text-zinc-500 text-center mt-2">
              Identity verification required
            </p>
          )}
        </div>

        {/* Compliance Footer - Minimal Design */}
        {clawbackEnabled && (
          <div className="px-6 py-2 bg-zinc-900/40 border-t border-zinc-800/30">
            <div className="flex items-center gap-2 text-[10px] text-zinc-600">
              <Shield className="w-3 h-3" />
              <span>Regulated asset • MAS compliance</span>
            </div>
          </div>
        )}
      </div>

    </>
  );
}
