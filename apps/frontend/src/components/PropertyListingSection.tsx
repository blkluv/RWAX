import React from 'react';
import { Logger, logAction } from '../utils/logger';

interface Property {
  id: number;
  name: string;
  district: number;
  priceRange: string;
  floors: number;
  bedrooms: number;
  area: number;
  psf: number;
  yield: number;
  risk: string;
  units: number;
  valuation: number;
  leaseYears: string;
  image: string;
  // Chain info for XRPL integration
  chain_info?: {
    issuer: string;
    currency: string;
    ticker: string;
    amm: {
      exists: boolean;
      trading_fee: number;
    };
  };
}

// Featured properties with XRPL chain info for live transactions
const properties: Property[] = [
  {
    id: 1,
    name: "The Hillford",
    district: 21,
    priceRange: "300-400k",
    floors: 3,
    bedrooms: 2,
    area: 0.604,
    psf: 1518.0,
    yield: 5.58,
    risk: "A (Low Risk)",
    units: 24,
    valuation: 2812.0,
    leaseYears: "60 yrs lease from 2013",
    image: "/Property_Image/TheHillFort.png",
    chain_info: {
      issuer: "rPYttdvr95gCyhuTSzpZF8zf9Baa7F4UX2",
      currency: "59542D48494C4C464F52443100000000",
      ticker: "YT-HILLFORD",
      amm: { exists: true, trading_fee: 0.5 }
    }
  },
  {
    id: 2,
    name: "The Hillford",
    district: 21,
    priceRange: "500-600k",
    floors: 3,
    bedrooms: 3,
    area: 0.702,
    psf: 1388.0,
    yield: 5.74,
    risk: "A (Low Risk)",
    units: 5,
    valuation: 3360.0,
    leaseYears: "60 yrs lease from 2013",
    image: "/Property_Image/TheHillFort.png",
    chain_info: {
      issuer: "rPYttdvr95gCyhuTSzpZF8zf9Baa7F4UX2",
      currency: "59542D48494C4C464F52443200000000",
      ticker: "YT-HILLFORD-2",
      amm: { exists: true, trading_fee: 0.5 }
    }
  },
  {
    id: 3,
    name: "Kim Keat House",
    district: 12,
    priceRange: "1000-1100k",
    floors: 2,
    bedrooms: 3,
    area: 1.215,
    psf: 1112.0,
    yield: 5.63,
    risk: "A (Low Risk)",
    units: 1,
    valuation: 5700.0,
    leaseYears: "Freehold",
    image: "/Property_Image/KimKeatHouse.png",
    chain_info: {
      issuer: "rPYttdvr95gCyhuTSzpZF8zf9Baa7F4UX2",
      currency: "59542D4B494D4B454154000000000000",
      ticker: "YT-KIMKEAT",
      amm: { exists: true, trading_fee: 0.5 }
    }
  },
  {
    id: 4,
    name: "D-Leedon",
    district: 10,
    priceRange: ">3000k",
    floors: 1,
    bedrooms: 4,
    area: 4.5,
    psf: 1083.0,
    yield: 5.61,
    risk: "A (Low Risk)",
    units: 2,
    valuation: 21041.0,
    leaseYears: "99 yrs lease from 2010",
    image: "/Property_Image/D'Leedon.png",
    chain_info: {
      issuer: "rPYttdvr95gCyhuTSzpZF8zf9Baa7F4UX2",
      currency: "59542D444C4545444F4E000000000000",
      ticker: "YT-DLEEDON",
      amm: { exists: true, trading_fee: 0.5 }
    }
  },
  {
    id: 5,
    name: "Parc Clematis",
    district: 5,
    priceRange: "1200-1500k",
    floors: 5,
    bedrooms: 3,
    area: 1.076,
    psf: 1650.0,
    yield: 5.89,
    risk: "A (Low Risk)",
    units: 18,
    valuation: 7800.0,
    leaseYears: "99 yrs lease from 2019",
    image: "/Property_Image/ParcClematis.png",
    chain_info: {
      issuer: "rPYttdvr95gCyhuTSzpZF8zf9Baa7F4UX2",
      currency: "59542D50415243434C454D0000000000",
      ticker: "YT-PARCCLEM",
      amm: { exists: true, trading_fee: 0.5 }
    }
  },
  {
    id: 6,
    name: "Treasure at Tampines",
    district: 18,
    priceRange: "800-1000k",
    floors: 12,
    bedrooms: 3,
    area: 0.936,
    psf: 1285.0,
    yield: 6.12,
    risk: "A (Low Risk)",
    units: 42,
    valuation: 5200.0,
    leaseYears: "99 yrs lease from 2019",
    image: "/Property_Image/TreasureTampines.png",
    chain_info: {
      issuer: "rPYttdvr95gCyhuTSzpZF8zf9Baa7F4UX2",
      currency: "59542D5452454153555245544D500000",
      ticker: "YT-TREASURE",
      amm: { exists: true, trading_fee: 0.5 }
    }
  }
];

interface PropertyListingSectionProps {
  onBuyProperty?: (property: any) => void;
  isWalletConnected?: boolean;
  hasDID?: boolean;
}

export function PropertyListingSection({ onBuyProperty, isWalletConnected, hasDID }: PropertyListingSectionProps) {

  const handleViewProperty = (property: Property) => {
    logAction("View Property Clicked", {
      property: property.name,
      district: property.district,
      yield: property.yield,
      ticker: property.chain_info?.ticker
    });

    Logger.info("Property Selected for Yield Rights", {
      name: property.name,
      ticker: property.chain_info?.ticker,
      hasAMM: property.chain_info?.amm?.exists,
      walletConnected: isWalletConnected
    });

    // Convert to asset format for App.tsx handler
    const assetFormat = {
      id: `prop-${property.id}`,
      identity: {
        project: property.name,
        type: `${property.bedrooms}-Bed | ${property.area.toFixed(3)} sqft`,
        district: `D${property.district}`
      },
      financials: {
        yield_apy: property.yield,
        est_valuation_sgd: `${property.valuation}K`,
        tokens: {
          yt_ticker: property.chain_info?.ticker || `YT-${property.name.toUpperCase().replace(/\s/g, '')}`,
          pt_ticker: `PT-${property.name.toUpperCase().replace(/\s/g, '')}`
        }
      },
      insights: {
        risk_rating: property.risk,
        connectivity_score: 85,
        mrt_distance: "500m"
      },
      chain_info: property.chain_info ? {
        issuer: property.chain_info.issuer,
        currency: property.chain_info.currency,
        ticker: property.chain_info.ticker,
        amm: {
          exists: property.chain_info.amm.exists,
          trading_fee: property.chain_info.amm.trading_fee,
          yt: { exists: true }
        },
        oracle: { price_set: true },
        clawback_enabled: true
      } : undefined
    };

    if (onBuyProperty) {
      onBuyProperty(assetFormat);
    } else {
      // Scroll to main asset section if no handler provided
      const mainSection = document.querySelector('main');
      if (mainSection) {
        mainSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center px-6 py-20 pt-32 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
        position: 'relative',
        zIndex: 10
      }}
    >
      {/* Background Glow Effect */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold tracking-wider">
              FEATURED LISTINGS
            </span>
          </div>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6"
            style={{
              fontFamily: 'sans-serif',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              fontWeight: 700
            }}
          >
            Prime Singapore Properties
          </h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto">
            Tokenized Master Lease Rights backed by real estate assets. Acquire yield rights instantly on XRPL.
          </p>

          {/* Wallet Status Indicator */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              isWalletConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-zinc-800/50 text-zinc-400 border border-zinc-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isWalletConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              {isWalletConnected ? 'Wallet Connected' : 'Connect Wallet to Buy'}
            </div>
            {isWalletConnected && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                hasDID
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${hasDID ? 'bg-blue-400' : 'bg-yellow-400 animate-pulse'}`} />
                {hasDID ? 'DID Verified' : 'Verify Identity to Trade'}
              </div>
            )}
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div
              key={property.id}
              className="group relative backdrop-blur-xl bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden hover:border-emerald-500/50 transition-all duration-300 hover:transform hover:scale-[1.02]"
              style={{
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Property Image */}
              <div className="relative h-56 overflow-hidden bg-zinc-800">
                <img
                  src={property.image}
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%239CA3AF" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EProperty Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
                    ON-CHAIN
                  </span>
                  {property.chain_info?.amm?.exists && (
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
                      AMM LIVE
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center gap-2 text-zinc-300 text-sm">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                    District {property.district} | {property.bedrooms} Bed | {property.area.toFixed(3)} sqft
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-6">
                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-2">
                  {property.name}
                </h3>
                <p className="text-emerald-400 text-sm font-semibold mb-4">
                  SGD {property.priceRange}
                </p>

                {/* Token Ticker */}
                {property.chain_info?.ticker && (
                  <div className="mb-4 px-3 py-1.5 bg-zinc-800/50 rounded-lg inline-block">
                    <span className="text-xs text-zinc-400">Token: </span>
                    <span className="text-xs font-mono text-emerald-400">{property.chain_info.ticker}</span>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">YIELD APY</p>
                    <p className="text-emerald-400 text-2xl font-bold">
                      {property.yield.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">RISK RATING</p>
                    <p className="text-white text-lg font-semibold">
                      {property.risk}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">PSF</p>
                    <p className="text-white text-lg font-semibold">
                      ${property.psf.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs mb-1">UNITS</p>
                    <p className="text-white text-lg font-semibold">
                      {property.units}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2 mb-6 text-sm text-zinc-400">
                  <div className="flex justify-between">
                    <span>Est. Valuation:</span>
                    <span className="text-white font-semibold">
                      ${property.valuation.toFixed(0)}K SGD
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenure:</span>
                    <span className="text-white">
                      {property.leaseYears}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 px-4 font-bold rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                    isWalletConnected && hasDID
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white hover:shadow-lg hover:shadow-emerald-500/50'
                      : isWalletConnected
                      ? 'bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black hover:shadow-lg hover:shadow-yellow-500/50'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                  }`}
                  onClick={() => handleViewProperty(property)}
                >
                  {isWalletConnected && hasDID
                    ? 'Buy Yield Rights'
                    : isWalletConnected
                    ? 'Verify ID to Buy'
                    : 'Connect Wallet'}
                </button>

                {/* Compliance Footer */}
                <div className="mt-4 pt-4 border-t border-zinc-800">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    <span>MAS Compliant | XLS-39 Clawback | XRPL Testnet</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-zinc-400 mb-6">
            View all 3,600+ tokenized properties on XRPL
          </p>
          <button
            className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-emerald-500/50 text-white font-semibold rounded-lg transition-all duration-200"
            onClick={() => {
              const mainSection = document.querySelector('main');
              if (mainSection) {
                mainSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Browse Full Marketplace
          </button>
        </div>
      </div>
    </section>
  );
}
