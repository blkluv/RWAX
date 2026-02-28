// apps/frontend/src/components/RWAXHeader.tsx
// Header Component - Clean white background with minimalist black text
// Pixel-perfect replication of XION design

import React from 'react';
import { WalletManager } from 'xrpl-connect';
import { Logger } from '../utils/logger';

interface RWAXHeaderProps {
  account?: any;
  hasDID?: boolean;
  onVerifyClick?: () => void;
  walletConnectorRef?: any;
  isMinting?: boolean;
  walletManager?: WalletManager;
}

export function RWAXHeader({ account, hasDID, onVerifyClick, walletConnectorRef, isMinting, walletManager }: RWAXHeaderProps) {
  // Handle wallet disconnection via WalletManager
  const handleDisconnect = async () => {
    if (!walletManager) return;
    
    try {
      Logger.wallet("Disconnecting wallet...");
      await walletManager.disconnect();
      Logger.success("Wallet disconnected");
    } catch (error: any) {
      Logger.error("Wallet disconnection failed", { error: error?.message });
      console.error("Wallet disconnection error:", error);
    }
  };
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-gray-200">
      <nav className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
        {/* Left: Logo */}
        <div className="flex items-center">
          <h1 className="text-2xl font-bold tracking-tight text-black" style={{ fontFamily: 'sans-serif' }}>
            XRPLRWA
          </h1>
        </div>

        {/* Center: Navigation Links - Exact spacing as XION */}
        <div className="absolute items-center hidden gap-8 transform -translate-x-1/2 lg:flex left-1/2">
        <a href="https://map.xrplrwa.com" className="text-sm font-medium tracking-wide text-black uppercase transition-colors hover:text-gray-600" style={{ letterSpacing: '0.05em' }}>
            Map
          </a>
          <a href="#vision" className="text-sm font-medium tracking-wide text-black uppercase transition-colors hover:text-gray-600" style={{ letterSpacing: '0.05em' }}>
            Vision
          </a>
          <a href="#data" className="text-sm font-medium tracking-wide text-black uppercase transition-colors hover:text-gray-600" style={{ letterSpacing: '0.05em' }}>
            Data
          </a>
          <a href="#assets" className="text-sm font-medium tracking-wide text-black uppercase transition-colors hover:text-gray-600" style={{ letterSpacing: '0.05em' }}>
            Assets
          </a>
          <a href="#live-chart" className="text-sm font-medium tracking-wide text-black uppercase transition-colors hover:text-gray-600" style={{ letterSpacing: '0.05em' }}>
            Live Chart
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-6">
          {/* Wallet Connector - Always functional */}
          <div className="flex items-center gap-3">
            {/* Show Verified badge or Verify button when connected */}
            {account && (
              <>
                {hasDID && (
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
                    Verified
                  </span>
                )}
                {onVerifyClick && !hasDID && (
                  <button
                    onClick={onVerifyClick}
                    disabled={isMinting}
                    className="px-4 py-2 text-sm font-medium tracking-wide text-white uppercase transition-colors bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {isMinting ? 'Verifying...' : 'Verify'}
                  </button>
                )}
              </>
            )}
            
            {/* Wallet Connector - Functional xrpl-connect web component */}
            {account ? (
              /* Connected: Show address with disconnect option */
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-black">
                  {account.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Connected'}
                </span>
                <button
                  onClick={handleDisconnect}
                  className="px-6 py-2 text-sm font-medium tracking-wide text-white uppercase transition-colors bg-black hover:bg-gray-900"
                  style={{ letterSpacing: '0.05em' }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              /* Not Connected: Functional xrpl-wallet-connector with custom styling */
              <div className="wallet-connector-wrapper-rwax">
                {/* @ts-ignore */}
                <xrpl-wallet-connector
                  ref={walletConnectorRef}
                  primary-wallet="crossmark"
                  background-color="#FFFFFF"
                />
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
