declare module 'xrpl-connect' {
  export class WalletManager {
    constructor(config: any);
    on(event: string, callback: (data: any) => void): void;
    off(event: string, callback: (data: any) => void): void;
    disconnect(): Promise<void>;
    signAndSubmit(tx: any, autofill?: boolean): Promise<any>;
    account: any;
    connected: boolean;
  }
  export class XamanAdapter {}
  export class CrossmarkAdapter {}
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'xrpl-wallet-connector': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'primary-wallet'?: string;
        'background-color'?: string;
        ref?: any;
      }, HTMLElement>;
    }
  }
}

export {};
