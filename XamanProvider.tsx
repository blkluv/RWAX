// XamanProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { WalletManager, XamanAdapter, CrossmarkAdapter } from 'xrpl-connect';

interface XamanContextType {
  walletManager: WalletManager | null;
  connected: boolean;
  account: any;
  connect: () => void;
  disconnect: () => void;
  error: string | null;
}

const XamanContext = createContext<XamanContextType | null>(null);

export const XamanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletManager, setWalletManager] = useState<WalletManager | null>(null);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check for API keys
      if (!process.env.REACT_APP_XAMAN_API_KEY) {
        throw new Error('Xaman API Key is missing. Get one at https://apps.xaman.dev');
      }

      const manager = new WalletManager({
        adapters: [
          new XamanAdapter({
            apiKey: process.env.REACT_APP_XAMAN_API_KEY,
            apiSecret: process.env.REACT_APP_XAMAN_API_SECRET,
            network: process.env.REACT_APP_XRP_NETWORK || 'testnet'
          }),
          new CrossmarkAdapter()
        ],
        network: process.env.REACT_APP_XRP_NETWORK || 'testnet'
      });

      // Listen for connection events
      manager.on('connected', (data) => {
        setConnected(true);
        setAccount(data.account);
        setError(null);
      });

      manager.on('disconnected', () => {
        setConnected(false);
        setAccount(null);
      });

      manager.on('error', (err) => {
        setError(err.message);
      });

      setWalletManager(manager);
    } catch (err) {
      setError(err.message);
    }

    return () => {
      if (walletManager) {
        walletManager.disconnect();
      }
    };
  }, []);

  const connect = async () => {
    try {
      setError(null);
      // Trigger Xaman connection
      const element = document.querySelector('xrpl-wallet-connector');
      if (element) {
        (element as any).click();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const disconnect = async () => {
    if (walletManager) {
      await walletManager.disconnect();
    }
  };

  return (
    <XamanContext.Provider value={{
      walletManager,
      connected,
      account,
      connect,
      disconnect,
      error
    }}>
      {children}
      {/* Hidden connector element */}
      <xrpl-wallet-connector 
        primary-wallet="xaman" 
        style={{ display: 'none' }} 
      />
    </XamanContext.Provider>
  );
};

export const useXaman = () => {
  const context = useContext(XamanContext);
  if (!context) {
    throw new Error('useXaman must be used within XamanProvider');
  }
  return context;
};