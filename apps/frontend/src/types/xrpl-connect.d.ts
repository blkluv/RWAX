declare module 'xrpl-connect' {
  // Add proper config types
  export interface XamanAdapterConfig {
    apiKey: string;
    apiSecret: string;
    network?: 'testnet' | 'mainnet';
  }

  export interface CrossmarkAdapterConfig {
    network?: 'testnet' | 'mainnet';
  }

  // Update adapters with proper constructors
  export class XamanAdapter {
    constructor(config?: XamanAdapterConfig);
  }

  export class CrossmarkAdapter {
    constructor(config?: CrossmarkAdapterConfig);
  }

  // Make WalletManager types specific
  export interface WalletManagerConfig {
    adapters: (XamanAdapter | CrossmarkAdapter)[];
    network?: 'testnet' | 'mainnet';
  }

  export interface WalletAccount {
    address: string;
    name?: string;
    network?: string;
  }

  export class WalletManager {
    constructor(config: WalletManagerConfig);
    
    // Event handling
    on(event: 'connected', callback: (data: { account: WalletAccount }) => void): void;
    on(event: 'disconnected', callback: () => void): void;
    on(event: 'error', callback: (error: Error) => void): void;
    on(event: string, callback: (data: any) => void): void;
    
    off(event: string, callback: (data: any) => void): void;
    
    // Connection methods
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    
    // Transaction methods
    signAndSubmit(tx: any, autofill?: boolean): Promise<{
      hash: string;
      result: any;
    }>;
    
    // Properties
    account: WalletAccount | null;
    connected: boolean;
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'xrpl-wallet-connector': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'primary-wallet'?: 'xaman' | 'crossmark';
        'background-color'?: string;
        ref?: any;
      }, HTMLElement>;
    }
  }
}

export {};