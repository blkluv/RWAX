import React, { useEffect, useRef, useState } from 'react';
import { WalletManager } from 'xrpl-connect';
import { Shield } from 'lucide-react';
import { useIdentity } from './hooks/useIdentity';
import ThreeHero from './components/ThreeHero';
import { VerificationModal } from './components/VerificationModal';
import { AssetCard } from './components/AssetCard';
import { type ParsedDocumentData } from './utils/documentParser';
import { Logger, logAction } from './utils/logger';
import rwaData from './data/rwa_assets.json';

interface AppProps {
  walletManager: WalletManager;
}

function App({ walletManager }: AppProps) {
  const [account, setAccount] = useState<any>(null);
  const connectorRef = useRef<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { hasDID, isLoading, isMinting, mintDID, dryRunMode, setDryRunMode } = useIdentity(account?.address, walletManager);

  // Initialize logging banner on app start
  useEffect(() => {
    console.log('%c═══════════════════════════════════════', 'color: #10b981; font-weight: bold;');
    console.log('%c🚀 RWAX PROTOCOL INITIALIZED', 'color: #10b981; font-weight: bold; font-size: 16px;');
    console.log('%c═══════════════════════════════════════', 'color: #10b981; font-weight: bold;');
    console.log('%c📺 This Console shows all activity!', 'color: #3b82f6; font-size: 14px; font-weight: bold;');
    console.log('%cAll button clicks and transactions are logged here.', 'color: #8b5cf6; font-size: 12px;');
    console.log('%cPress F12 or Cmd+Option+I if console is not visible.', 'color: #ef4444; font-size: 12px;');
    console.log('');
    logAction("App Initialized", { hasWallet: !!walletManager });
  }, [walletManager]);

  useEffect(() => {
    // 1. Connect the Manager to the UI Component
    if (connectorRef.current) {
      connectorRef.current.setWalletManager(walletManager);
    }

    // 2. Listen for Events
    const onConnect = (acc: any) => {
      Logger.wallet("Wallet Connected", {
        address: acc?.address,
        network: acc?.network || "testnet"
      });
      logAction("Wallet Connected", { address: acc?.address });
      setAccount(acc);
    };

    const onDisconnect = () => {
      Logger.wallet("Wallet Disconnected");
      logAction("Wallet Disconnected", {});
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
    if (!account) {
      Logger.wallet("Wallet connection required", { action: "buy_asset" });
      return alert("Please connect wallet first");
    }

    // Log action
    logAction("Buy Asset Clicked", {
      asset: asset.identity.project,
      ticker: asset.financials.tokens.yt_ticker,
      hasDID,
      hasAMM: asset.chain_info?.amm?.exists
    });

    // UX FIX: If no DID, prompt to verify immediately
    if (!hasDID) {
      Logger.info("DID Required - Prompting for verification", { asset: asset.identity.project });
      const confirm = window.confirm("⚠️ DID Required: You must verify your identity to trade. Verify now?");
      if (confirm) setIsModalOpen(true);
      return;
    }

    // [XLS-30 Implementation] If AMM exists, trigger swap transaction
    if (asset.chain_info?.amm?.exists) {
      try {
        Logger.amm("Initiating AMM Swap", {
          asset: asset.chain_info.ticker,
          project: asset.identity.project,
          pool: "Active"
        });
        
        // Prepare Payment transaction (XRP -> Token)
        // XRPL automatically routes through AMM if it's the best path
        const tx: any = {
          TransactionType: "Payment",
          Account: account.address,
          Destination: asset.chain_info.issuer,
          Amount: {
            currency: asset.chain_info.currency,
            issuer: asset.chain_info.issuer,
            value: "1" // Buy 1 token for demo
          },
          SendMax: "10" // Spend max 10 XRP
        };

        Logger.transaction("Payment", {
          type: "XRP → Token Swap",
          from: account.address,
          to: asset.chain_info.issuer,
          amount: "1 token",
          maxSpend: "10 XRP"
        });

        // Prepare transaction
        Logger.info("Connecting to XRPL Testnet...");
        const { Client } = await import('xrpl');
        const client = new Client("wss://s.altnet.rippletest.net:51233");
        await client.connect();
        Logger.success("Connected to XRPL Testnet");
        
        Logger.info("Preparing transaction (autofilling Fee, Sequence, etc.)");
        const prepared = await client.autofill(tx);
        await client.disconnect();
        Logger.success("Transaction prepared", prepared);

        // Sign and submit via wallet
        Logger.wallet("Requesting wallet signature...", {
          account: account.address,
          note: "Please approve in wallet popup"
        });
        const result = await walletManager.signAndSubmit(prepared, true);
        
        Logger.success("Swap Transaction Submitted", {
          hash: result?.hash,
          ticker: asset.chain_info.ticker
        });
        
        if (result?.hash) {
          Logger.info("Transaction Hash", { hash: result.hash });
          alert(`✅ Swap initiated!\n\nTransaction: ${result.hash}\n\nView on XRPScan: https://testnet.xrpscan.com/tx/${result.hash}`);
        }
      } catch (error: any) {
        Logger.error("Swap Transaction Failed", {
          error: error.message,
          asset: asset.identity.project,
          details: error
        });
        alert(`Swap failed: ${error.message || "Unknown error"}\n\nPlease ensure you have XRP in your wallet.`);
      }
      return;
    }

    // Fallback: Show asset details if no AMM
    if (asset.chain_info) {
      Logger.info("Opening asset details", { 
        issuer: asset.chain_info.issuer,
        project: asset.identity.project
      });
      window.open(`https://testnet.xrpscan.com/account/${asset.chain_info.issuer}`, '_blank');
    }
  };

  const handleVerifyClick = () => {
    logAction("Verify Identity Button Clicked", { account: account?.address });
    
    if (!account) {
      Logger.wallet("Wallet not connected", { action: "verify_identity" });
      alert("Please connect your wallet first");
      return;
    }
    Logger.action("Opening Verification Modal");
    setIsModalOpen(true);
  };

  const handleOCRSuccess = async (parsedData: ParsedDocumentData, didPayload: string) => {
    logAction("OCR Verification Successful", {
      documentType: parsedData.documentType,
      isValid: parsedData.isValid,
      hash: parsedData.hash.substring(0, 16)
    });
    
    setIsModalOpen(false);
    
    // [XLS-40 Implementation] Pass the parsed document data and DID payload to mintDID
    Logger.info("Proceeding to DID Minting", {
      payloadSize: didPayload.length,
      documentType: parsedData.documentType
    });
    
    await mintDID(parsedData, didPayload);
  };

  // Fallback: Allow direct minting without OCR (for testing/debugging)
  const handleDirectMint = async () => {
    logAction("Direct Mint (Dev Mode)", { account: account?.address });
    
    if (!account) {
      Logger.wallet("Wallet not connected", { action: "direct_mint" });
      alert("Please connect your wallet first");
      return;
    }
    
    Logger.info("Direct minting (skipping OCR)", {
      account: account.address,
      note: "Dev mode - using default payload"
    });
    
    // Direct mint without document parsing (uses default payload)
    await mintDID(undefined, undefined);
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
              {hasDID && (
                <span className="bg-emerald-900/50 border border-emerald-500 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2">
                  ✅ Verified Investor
                </span>
              )}
              {/* MAS Compliance Indicator - Hidden XLS-39 behind user-friendly text */}
              <div className="group relative">
                <span className="bg-gradient-to-r from-yellow-900/50 to-yellow-800/30 border border-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 cursor-help">
                  <Shield className="w-3 h-3" />
                  <span>MAS Regulated</span>
                </span>
                <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50">
                  <div className="bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 whitespace-nowrap shadow-xl">
                    Compliance enforcement enabled
                    <div className="text-[10px] text-zinc-500 mt-0.5">XLS-39 Clawback</div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyClick}
                  disabled={isMinting}
                  className={`px-4 py-2 rounded-lg font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    hasDID 
                      ? 'bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600' 
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black animate-pulse'
                  }`}
                  title={hasDID ? "Test OCR/Document Parsing (Already Verified)" : "Verify Identity with KYC"}
                >
                  {isMinting ? "VERIFYING..." : hasDID ? "🧪 TEST OCR" : "🛡️ VERIFY IDENTITY (KYC)"}
                </button>
                {/* Debug: Direct mint button (remove in production) */}
                {process.env.NODE_ENV === 'development' && (
                  <>
                    <button
                      onClick={handleDirectMint}
                      disabled={isMinting}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white px-3 py-2 rounded-lg font-bold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Skip OCR and mint directly (dev only)"
                    >
                      ⚡ Direct
                    </button>
                    <button
                      onClick={() => setDryRunMode(!dryRunMode)}
                      className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                        dryRunMode 
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      }`}
                      title="Toggle dry run mode (no XRP spent)"
                    >
                      {dryRunMode ? '🔍 Dry Run ON' : '🔍 Dry Run OFF'}
                    </button>
                  </>
                )}
              </div>
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
            <AssetCard
              key={asset.id}
              asset={asset}
              onBuy={handleBuy}
              hasDID={hasDID}
            />
          ))}
        </div>
      </main>

      <footer className="relative z-10 text-center py-12 text-xs text-gray-600 border-t border-white/5 bg-black">
        <p>Contains information from the Private Residential Property dataset accessed from URA API.</p>
        <p className="mt-2">RWAX Protocol © 2026</p>
      </footer>

      {/* Verification Modal */}
      <VerificationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onVerified={handleOCRSuccess}
        alreadyVerified={hasDID}
      />
    </div>
  );
}

export default App;
