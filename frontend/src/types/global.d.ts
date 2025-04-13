import { PublicKey, Transaction } from '@solana/web3.js';

// Глобальные типы для доступа к Phantom API и глобальным переменным
declare global {
  interface Window {
    __WALLET_CONNECTED__?: boolean;
    __WALLET_PUBLIC_KEY__?: string | null;
    __WALLET_CONNECTING__?: boolean;
    solana?: {
      isPhantom?: boolean;
      publicKey?: PublicKey;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      request: (request: any) => Promise<any>;
    };
  }
} 