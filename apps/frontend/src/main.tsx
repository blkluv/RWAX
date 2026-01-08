import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// The Official XRPL-Commons Tool
import { WalletManager, XamanAdapter, CrossmarkAdapter } from 'xrpl-connect'
// Import web component registration
import 'xrpl-connect/components'

// 1. Configure the Wallet Manager ONCE
const walletManager = new WalletManager({
  adapters: [
    new XamanAdapter(),      // Supports Xaman
    new CrossmarkAdapter()   // Supports Crossmark
  ],
  network: 'testnet'         // Automatically handles RPC connection
})

// 2. Pass it to the App
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App walletManager={walletManager} />
  </React.StrictMode>,
)
