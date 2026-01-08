import React, { useEffect, useRef, useState } from 'react';
import { WalletManager } from 'xrpl-connect';
import { useIdentity } from './hooks/useIdentity';
import ThreeHero from './components/ThreeHero';
import { VerificationModal } from './components/VerificationModal';
import { AssetCard } from './components/AssetCard';
import { AssetDetailModal } from './components/AssetDetailModal';
import { Toast } from './components/Toast';
// import { BackgroundRipple } from './components/BackgroundRipple'; // Disabled - static design
import { WhiteHeroSection } from './components/WhiteHeroSection';
import { HeroSection } from './components/HeroSection';
import { MarketDepthSection } from './components/MarketDepthSection';
import { ImpactHeroSection } from './components/ImpactHeroSection';
import { RWAXHeader } from './components/RWAXHeader';
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
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

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
    // Show asset detail modal
    setSelectedAsset(asset);
    setShowAssetDetailModal(true);
    
    Logger.info("Asset Detail View Opened", {
      asset: asset.identity.project,
      hasAMM: asset.chain_info?.amm?.exists
    });
  };

  interface SwapParams {
    fromAsset: 'XRP' | 'PT' | 'YT' | 'RLUSD';
    toAsset: 'XRP' | 'PT' | 'YT' | 'RLUSD';
    fromAmount: string;
    toAssetInfo?: {
      currency: string;
      issuer: string;
      ticker: string;
    };
    deliverMin?: string; // Minimum tokens to receive (slippage protection)
  }

  const handleSwap = async (asset: any, swapParams: SwapParams) => {
    if (!account) {
      Logger.wallet("Wallet connection required", { action: "swap_asset" });
      setToast({
        message: "Please connect wallet first",
        type: 'error',
        isVisible: true
      });
      return;
    }

    // Log action
    logAction("Swap Yield Rights", {
      asset: asset.identity.project,
      ticker: asset.financials.tokens.yt_ticker,
      from: swapParams.fromAsset,
      to: swapParams.toAsset,
      amount: swapParams.fromAmount,
      hasDID,
      hasAMM: asset.chain_info?.amm?.exists || asset.chain_info?.amm?.yt?.exists
    });

    // UX FIX: If no DID, prompt to verify immediately
    if (!hasDID) {
      Logger.info("DID Required - Prompting for verification", { asset: asset.identity.project });
      setShowAssetDetailModal(false);
      setToast({
        message: "Identity verification required. Please verify your DID first.",
        type: 'error',
        isVisible: true
      });
      setTimeout(() => setIsModalOpen(true), 500);
      return;
    }

    // [XLS-30 Implementation] Asset-to-Asset Swap transaction
    const { fromAsset, toAsset, fromAmount, toAssetInfo, deliverMin } = swapParams;
    
    if (asset.chain_info?.amm?.exists || asset.chain_info?.amm?.yt?.exists || asset.chain_info?.amm?.pt?.exists) {
      try {
        Logger.amm("Initiating Asset-to-Asset Swap", {
          from: fromAsset,
          to: toAsset,
          asset: asset.chain_info.ticker || asset.chain_info?.tokens?.yt?.ticker,
          project: asset.identity.project,
          pool: "Active"
        });
        
        // Determine destination asset info
        let destinationAmount: any;
        let sendMax: any;
        
        // Load RLUSD info if needed
        let rlusdInfo: any = null;
        if (fromAsset === 'RLUSD' || toAsset === 'RLUSD') {
          try {
            const rlusdData = await fetch('/output/rlusd_info.json');
            if (rlusdData.ok) {
              rlusdInfo = await rlusdData.json();
            }
          } catch (e) {
            console.warn('RLUSD info not found:', e);
          }
        }
        
        if (toAsset === 'XRP') {
          // Token → XRP
          destinationAmount = fromAmount; // XRP amount as string
          const sourceTokenInfo = fromAsset === 'YT' 
            ? {
                currency: asset.chain_info.currency || asset.chain_info.tokens.yt.currency,
                issuer: asset.chain_info.issuer,
                value: fromAmount
              }
            : fromAsset === 'PT'
            ? {
                currency: asset.chain_info.tokens.pt.currency,
                issuer: asset.chain_info.issuer,
                value: fromAmount
              }
            : {
                currency: rlusdInfo?.currency || '',
                issuer: rlusdInfo?.issuer || '',
                value: fromAmount
              };
          sendMax = sourceTokenInfo;
        } else if (fromAsset === 'XRP') {
          // XRP → Token
          const estimatedTokens = (parseFloat(fromAmount) * 100).toFixed(2); // Demo: 1 XRP = 100 tokens
          destinationAmount = toAssetInfo || {
            currency: asset.chain_info.currency || asset.chain_info.tokens.yt.currency,
            issuer: asset.chain_info.issuer,
            value: estimatedTokens
          };
          sendMax = fromAmount; // XRP as string
        } else {
          // Token → Token (e.g., PT → YT or PT → RLUSD)
          const estimatedTokens = (parseFloat(fromAmount) * 1.0).toFixed(2); // 1:1 for demo
          
          destinationAmount = toAssetInfo || {
            currency: asset.chain_info.currency || asset.chain_info.tokens.yt.currency,
            issuer: asset.chain_info.issuer,
            value: estimatedTokens
          };
          
          // Determine source token
          const fromTokenInfo = fromAsset === 'YT'
            ? {
                currency: asset.chain_info.currency || asset.chain_info.tokens.yt.currency,
                issuer: asset.chain_info.issuer,
                value: fromAmount
              }
            : fromAsset === 'PT'
            ? {
                currency: asset.chain_info.tokens.pt.currency,
                issuer: asset.chain_info.issuer,
                value: fromAmount
              }
            : {
                currency: rlusdInfo?.currency || '',
                issuer: rlusdInfo?.issuer || '',
                value: fromAmount
              };
          sendMax = fromTokenInfo;
        }
        
        // Build Payment transaction
        const tx: any = {
          TransactionType: "Payment",
          Account: account.address,
          Destination: toAssetInfo?.issuer || asset.chain_info.issuer,
          Amount: destinationAmount,
          SendMax: sendMax
        };
        
        // Add DeliverMin for slippage protection (Token → Token only)
        if (deliverMin && (fromAsset !== 'XRP' || toAsset !== 'XRP')) {
          tx.DeliverMin = typeof deliverMin === 'string' 
            ? deliverMin 
            : {
                currency: (toAssetInfo || destinationAmount).currency,
                issuer: (toAssetInfo || destinationAmount).issuer,
                value: deliverMin
              };
        }
        
        // Optional: Add Paths for complex routing (Token → Token through XRP)
        if (fromAsset !== 'XRP' && toAsset !== 'XRP') {
          // Token → Token: Route through XRP (e.g., PT → XRP → YT)
          const fromCurrency = fromAsset === 'YT'
            ? asset.chain_info.currency || asset.chain_info.tokens.yt.currency
            : fromAsset === 'PT'
            ? asset.chain_info.tokens.pt.currency
            : rlusdInfo?.currency || '';
          
          const toCurrency = toAsset === 'YT'
            ? asset.chain_info.currency || asset.chain_info.tokens.yt.currency
            : toAsset === 'PT'
            ? asset.chain_info.tokens.pt.currency
            : rlusdInfo?.currency || '';
          
          if (fromCurrency && toCurrency) {
            tx.Paths = [
              [
                {
                  currency: fromCurrency,
                  issuer: asset.chain_info.issuer
                },
                { currency: "XRP" },
                {
                  currency: toCurrency,
                  issuer: (toAssetInfo?.issuer || asset.chain_info.issuer)
                }
              ]
            ];
          }
        }

        Logger.transaction("Payment", {
          type: `${fromAsset} → ${toAsset} Swap (XLS-30 AMM)`,
          from: account.address,
          to: toAssetInfo?.issuer || asset.chain_info.issuer,
          amount: JSON.stringify(destinationAmount),
          maxSpend: JSON.stringify(sendMax),
          paths: tx.Paths ? "XRP routed" : "Direct"
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
          amount: `${fromAmount} ${fromAsset}`,
          note: "Please approve in wallet popup"
        });
        
        // Use walletManager.signAndSubmit() for transaction
        const result = await walletManager.signAndSubmit(prepared, true);
        
        Logger.success("Swap Transaction Submitted", {
          hash: result?.hash,
          ticker: asset.chain_info?.ticker || asset.chain_info?.tokens?.yt?.ticker,
          from: fromAsset,
          to: toAsset,
          amount: fromAmount
        });
        
        // Close modals and show toast notification
        setShowAssetDetailModal(false);
        setToast({
          message: "XLS-30 AMM Swap Complete. Received YT-Tokens.",
          type: 'success',
          isVisible: true
        });
        
        if (result?.hash) {
          Logger.info("Transaction Hash", { hash: result.hash });
          // Toast already shown, no need for alert
        }
      } catch (error: any) {
        Logger.error("Swap Transaction Failed", {
          error: error.message,
          asset: asset.identity.project,
          details: error
        });
        setToast({
          message: `Swap failed: ${error.message || "Unknown error"}`,
          type: 'error',
          isVisible: true
        });
      }
      return;
    }

    // Fallback: Show asset details if no AMM
    setToast({
      message: "AMM pool not available for this asset",
      type: 'info',
      isVisible: true
    });
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
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500 selection:text-black bg-black">
      {/* 0. BACKGROUND RIPPLE EFFECT - DISABLED (static design) */}
      {/* <BackgroundRipple /> */}
      
      {/* 1. BACKGROUND ANIMATION - Only visible on dark sections */}
      <ThreeHero />

      {/* 2. HEADER - White background, minimalist design */}
      <RWAXHeader 
        account={account}
        hasDID={hasDID}
        onVerifyClick={handleVerifyClick}
        walletConnectorRef={connectorRef}
        isMinting={isMinting}
        walletManager={walletManager}
      />

      {/* 3. WHITE HERO SECTION - First section user sees */}
      <WhiteHeroSection />

      {/* 4. DARK STATS SECTION - Scroll down to see */}
      <HeroSection />

      {/* 5. MARKET DEPTH SECTION - Yield Heatmap Visualization */}
      <MarketDepthSection />

      {/* 6. IMPACT HERO SECTION - Final CTA with Particle Assembler */}
      {/* Note: Add backgroundImage prop when image is provided - place image in /public/images/ */}
      <ImpactHeroSection />

      {/* 7. MAIN CONTENT (Appears after scroll) */}
      <main className="max-w-7xl mx-auto p-6 pb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rwaData
            .filter((asset: any) => {
              // Filter out assets with incomplete data
              const district = asset.identity?.district || '';
              const type = asset.identity?.type || '';
              
              // Filter out if district contains "?" or "Unknown"
              if (district.includes('?') || district.includes('Unknown') || district === 'D?') {
                return false;
              }
              
              // Filter out if type contains "N/A"
              if (type.includes('N/A')) {
                return false;
              }
              
              return true;
            })
            .slice(0, 6)
            .map((asset: any) => (
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

      {/* Asset Detail Modal */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          isOpen={showAssetDetailModal}
          onClose={() => {
            setShowAssetDetailModal(false);
            setSelectedAsset(null);
          }}
          onSwap={(asset: any) => {
            // Default swap params for backward compatibility
            const swapParams = asset.swapParams || {
              fromAsset: 'XRP' as const,
              toAsset: 'YT' as const,
              fromAmount: asset.swapAmount || '100',
              toAssetInfo: {
                currency: asset.chain_info?.currency || '',
                issuer: asset.chain_info?.issuer || '',
                ticker: asset.financials.tokens.yt_ticker
              }
            };
            handleSwap(asset, swapParams);
          }}
          hasDID={hasDID}
        />
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
        duration={4000}
      />

    </div>
  );
}

export default App;
