// Интерфейс для NFT, возвращаемого API
export interface NFT {
  address: string;
  name: string;
  symbol: string;
  uri: string;
  image: string;
  type: number; 
  owner: string;
  mintedAt: string;
}

// Интерфейс для пользовательских кошельков
export interface UserWallet {
  address: string;
  balance: number;
  nfts: NFT[];
}

// Тип для статуса транзакции
export type TransactionStatus = 'processing' | 'confirmed' | 'finalized' | 'error';

// Интерфейс для транзакций
export interface Transaction {
  id: string;
  signature: string;
  status: TransactionStatus;
  timestamp: string;
  blockTime?: number;
  type: 'mint' | 'transfer' | 'sale';
  from: string;
  to: string;
  amount?: number;
  nft?: NFT;
} 