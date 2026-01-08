// apps/frontend/src/App.tsx
import React, { useState, useEffect } from 'react';
import { useIdentity } from './hooks/useIdentity';
import ThreeHero from './components/ThreeHero';
import rwaData from './data/rwa_assets.json';

interface AppProps {
  walletManager: any;
}

function App({ walletManager }: AppProps) {
  const [account, setAccount] = useState<any>(null);

  useEffect(() => {
    walletManager.on('connect', (acc: any) => setAccount(acc));
    walletManager.on('disconnect', () => setAccount(null));
  }, []);

  const { hasDID, isLoading } = useIdentity(account?.address);

  const handleBuy = (asset: any) => {
    if (!account) return alert("Please connect wallet first");
    if (!hasDID) return alert("❌ Access Denied: DID Required.");
    if (asset.chain_info) window.open(`https://testnet.xrpscan.com/account/${asset.chain_info.issuer}`, '_blank');
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500 selection:text-black">
      {/* 1. BACKGROUND ANIMATION */}
      <ThreeHero />

      {/* 2. NAVIGATION (Transparent) */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 mix-blend-difference">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tighter">RWAX</span>
        </div>
        <div className="flex items-center gap-4">
           {account && (
            <div className={`text-xs px-3 py-1 rounded-full border ${hasDID ? 'bg-emerald-900/30 border-emerald-500 text-emerald-400' : 'bg-red-900/30 border-red-500 text-red-400'}`}>
              {isLoading ? "Verifying..." : hasDID ? "✅ DID Verified" : "⚠️ Restricted"}
            </div>
          )}
          <xrpl-wallet-connector primary-wallet="crossmark" background-color="#000000" />
        </div>
      </nav>

      {/* 3. SCROLL SPACER (This triggers the X split) */}
      <div className="h-screen flex items-center justify-center pointer-events-none">
        <div className="text-center animate-pulse">
          <p className="text-xs tracking-[0.3em] text-gray-500">SCROLL TO UNLOCK YIELD</p>
          <div className="mt-4 w-px h-16 bg-gradient-to-b from-gray-500 to-transparent mx-auto"></div>
        </div>
      </div>

      {/* 4. MAIN CONTENT (Appears after scroll) */}
      <main className="max-w-7xl mx-auto p-6 pb-20 relative z-10">
        <div className="mb-12 backdrop-blur-md bg-black/30 p-8 rounded-2xl border border-white/10">
          <h2 className="text-4xl font-bold mb-4">Prime Yield Assets</h2>
          <p className="text-gray-400 max-w-xl">
            RWAX separates ownership from yield. Acquire <strong>Yield Rights (YT)</strong> for instant cash flow
            without the burden of property management. Powered by <strong>Master Lease Agreements</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rwaData.slice(0, 6).map((asset: any) => (
            <div key={asset.id} className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition duration-300 group">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">{asset.identity.project}</h3>
                  <p className="text-xs text-gray-500 mt-1">{asset.identity.district} • {asset.identity.type}</p>
                </div>
                {asset.chain_info && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-1 rounded border border-emerald-500/20">
                    ON-CHAIN
                  </span>
                )}
              </div>

              <div className="p-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Yield APY</p>
                  <p className="text-3xl font-bold text-emerald-400">{asset.financials.yield_apy}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Risk Rating</p>
                  <p className="text-sm font-medium text-white mt-2">{asset.insights.risk_rating}</p>
                </div>
              </div>

              <div className="p-4 bg-black/50 border-t border-zinc-800">
                <button
                  onClick={() => handleBuy(asset)}
                  className="w-full py-3 bg-white text-black font-bold text-sm rounded hover:bg-emerald-400 hover:scale-[1.02] transition-all flex justify-center gap-2"
                >
                  SWAP YIELD (YT) <span className="opacity-50">| {asset.financials.tokens.yt_ticker}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 text-center py-12 text-xs text-gray-600 border-t border-white/5 bg-black">
        <p>Contains information from the Private Residential Property dataset accessed from URA API.</p>
        <p className="mt-2">RWAX Protocol © 2026</p>
      </footer>
    </div>
  );
}

export default App;
