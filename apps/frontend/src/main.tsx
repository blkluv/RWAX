import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { WalletManager, XamanAdapter, CrossmarkAdapter } from 'xrpl-connect';

// Get these from https://apps.xaman.dev
const XAMAN_API_KEY = process.env.REACT_APP_XAMAN_API_KEY || 'your-api-key-here';
const XAMAN_API_SECRET = process.env.REACT_APP_XAMAN_API_SECRET || 'your-api-secret-here';

// 1. Initialize with credentials
const walletManager = new WalletManager({
  adapters: [
    new XamanAdapter({ 
      apiKey: XAMAN_API_KEY,
      apiSecret: XAMAN_API_SECRET,
      network: 'testnet'  // or 'mainnet'
    }),
    new CrossmarkAdapter()
  ],
  network: 'testnet'
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App walletManager={walletManager} />
  </React.StrictMode>,
);