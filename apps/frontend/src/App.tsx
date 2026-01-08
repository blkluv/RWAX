import React, { useEffect, useRef, useState } from 'react';
import { WalletManager } from 'xrpl-connect';
import { useIdentity } from './hooks/useIdentity';
import ThreeHero from './components/ThreeHero';
import rwaData from './data/rwa_assets.json';

interface AppProps {
  walletManager: WalletManager;
}

function App({ walletManager }: AppProps) {
  const [account, setAccount] = useState<any>(null);
  const connectorRef = useRef<any>(null);

  const { hasDID, isLoading, isMinting, mintDID } = useIdentity(account?.address, walletManager);

  useEffect(() => {
    // 1. Connect the Manager to the UI Component
    if (connectorRef.current) {
      connectorRef.current.setWalletManager(walletManager);
    }

    // 2. Listen for Events
    const onConnect = (acc: any) => {
      console.log("Wallet Connected:", acc);
      setAccount(acc);
    };

    const onDisconnect = () => {
      console.log("Wallet Disconnected");
      setAccount(null);
    };

    // Subscribe
    walletManager.on('connect', onConnect);
    walletManager.on('disconnect', onDisconnect);

    // Check if already connected
    if (walletManager.account) {
      setAccount(walletManager.account);
    }

    // Cleanup
    return () => {
      walletManager.off('connect', onConnect);
      walletManager.off('disconnect', onDisconnect);
    };
  }, [walletManager]);

  const handleBuy = async (asset: any) => {
    if (!account) return alert("Please connect wallet first");

    // UX FIX: If no DID, prompt to mint immediately
    if (!hasDID) {
      const confirm = window.confirm("⚠️ DID Required: You must verify your identity to trade. Mint ID now?");
      if (confirm) mintDID();
      return;
    }

    // If Asset is on-chain, show link (or implement Swap logic next)
    if (asset.chain_info) {
      window.open(`https://testnet.xrpscan.com/account/${asset.chain_info.issuer}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500 selection:text-black">
      {/* 1. BACKGROUND ANIMATION */}
      <ThreeHero />

      {/* 2. NAVIGATION */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tighter">RWAX</h1>
        </div>

        <div className="flex items-center gap-4">
          {account && (
            <>
              {!hasDID ? (
                <button
                  onClick={mintDID}
                  disabled={isMinting}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg font-bold text-xs animate-pulse transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMinting ? "VERIFYING..." : "🛡️ VERIFY IDENTITY (MINT DID)"}
                </button>
              ) : (
                <span className="bg-emerald-900/50 border border-emerald-500 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
                  ✅ Verified Investor
                </span>
              )}
            </>
          )}

          <xrpl-wallet-connector
            ref={connectorRef}
            primary-wallet="crossmark"
            background-color="#000000"
          ></xrpl-wallet-connector>
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
          {account && (
            <p className="mt-4 text-emerald-400 text-sm">
              Connected: {account.address.slice(0, 6)}...{account.address.slice(-4)}
            </p>
          )}
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
