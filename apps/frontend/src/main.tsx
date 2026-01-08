import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { WalletManager, XamanAdapter, CrossmarkAdapter } from 'xrpl-connect';

// 1. Initialize Global Manager
const walletManager = new WalletManager({
  adapters: [new XamanAdapter(), new CrossmarkAdapter()],
  network: 'testnet'
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Pass manager down as a prop */}
    <App walletManager={walletManager} />
  </React.StrictMode>,
);
