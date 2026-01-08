/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    'xrpl-wallet-connector': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      'primary-wallet'?: string;
      'background-color'?: string;
    };
  }
}
