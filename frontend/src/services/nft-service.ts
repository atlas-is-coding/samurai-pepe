import { Connection, PublicKey, Transaction as SolanaTransaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { NFT, Transaction } from '@/types';
import { Metaplex } from '@metaplex-foundation/js';

// Получаем endpoint из переменных окружения
const SOLANA_RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

export const NFT_ADDRESSES = {
  NFT1: '9qDtyLbFNgfdX7jmATvSZE5jMERm9kwqyPajk1WBUtYW', // Общий адрес коллекции
  NFT2: '9qDtyLbFNgfdX7jmATvSZE5jMERm9kwqyPajk1WBUtYW', // Общий адрес коллекции
  NFT3: '9qDtyLbFNgfdX7jmATvSZE5jMERm9kwqyPajk1WBUtYW', // Общий адрес коллекции
};

// Класс для работы с NFT
export class NftService {
  private connection: Connection;
  private metaplex: Metaplex;

  constructor() {
    this.connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    this.metaplex = new Metaplex(this.connection);
  }

  // Получить все NFT пользователя
  async getNftsByOwner(owner: string): Promise<NFT[]> {
    try {
      // Проверка наличия адреса
      if (!owner) {
        throw new Error('Owner address not specified');
      }

      // Создаем PublicKey из строки
      const ownerPublicKey = new PublicKey(owner);

      // Получаем все NFT пользователя через Metaplex
      const userNFTs = await this.metaplex.nfts().findAllByOwner({ owner: ownerPublicKey });
      
      // Преобразуем в нужный формат
      const nfts = userNFTs.map(nft => {
        return {
          address: nft.address.toBase58(),
          name: nft.name || 'Samurai NFT',
          symbol: nft.symbol || 'SMRI',
          uri: nft.uri || '',
          image: nft.json?.image || '',
          type: 1,
          owner,
          mintedAt: new Date().toISOString(),
        } as NFT;
      });

      return nfts;
    } catch (error) {
      console.error('Error getting NFT:', error);
      throw new Error('Failed to get NFT. Please try again.');
    }
  }

  // Проверить наличие NFT у пользователя
  async checkNFTOwnership(owner: PublicKey): Promise<{[key: string]: number}> {
    try {
      // Получаем все NFT пользователя
      const userNFTs = await this.metaplex.nfts().findAllByOwner({ owner });
      
      // Проверяем наличие каждого NFT по названиям в коллекции
      const nft1Count = userNFTs.filter(nft => 
        nft.collection?.address.toBase58() === NFT_ADDRESSES.NFT1 && 
        nft.name?.includes('Kōjō')).length;
      
      const nft2Count = userNFTs.filter(nft => 
        nft.collection?.address.toBase58() === NFT_ADDRESSES.NFT2 && 
        nft.name?.includes('Daimyō')).length;
      
      const nft3Count = userNFTs.filter(nft => 
        nft.collection?.address.toBase58() === NFT_ADDRESSES.NFT3 && 
        nft.name?.includes('Shōgun')).length;
      
      return {
        NFT1: nft1Count,
        NFT2: nft2Count,
        NFT3: nft3Count
      };
    } catch (error) {
      console.error('Error checking NFT ownership:', error);
      throw new Error('Failed to check NFT ownership. Please try again.');
    }
  }

  // Проверить доступность NFT3
  async isNFT3Available(owner: PublicKey): Promise<boolean> {
    try {
      const ownedNFTs = await this.checkNFTOwnership(owner);
      return ownedNFTs.NFT1 > 0 && ownedNFTs.NFT2 > 0;
    } catch (error) {
      console.error('Error checking NFT3 availability:', error);
      return false;
    }
  }

  // Купить NFT через Candy Machine
  async mintNFT(nftType: 'NFT1' | 'NFT2' | 'NFT3', wallet: any): Promise<string> {
    try {
      // Проверяем доступность NFT3
      if (nftType === 'NFT3') {
        const isAvailable = await this.isNFT3Available(wallet.publicKey);
        if (!isAvailable) {
          throw new Error('NFT 3 is not available. First purchase NFT 1 and NFT 2.');
        }
      }
      
      // Здесь будет реализация взаимодействия с Candy Machine
      // В реальном проекте нужно использовать соответствующий метод для минта
      
      // Возвращаем сигнатуру транзакции
      return "transaction_simulated";
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      throw new Error('Failed to purchase NFT. Please try again.');
    }
  }

  // Получить информацию о транзакции
  async getTransaction(signature: string): Promise<Transaction | null> {
    try {
      // Получаем данные о транзакции
      const txInfo = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!txInfo) {
        return null;
      }

      // Формируем объект транзакции
      return {
        id: signature,
        signature,
        status: 'confirmed',
        timestamp: new Date(txInfo.blockTime! * 1000).toISOString(),
        blockTime: txInfo.blockTime,
        type: 'mint',
        from: 'unknown-address',
        to: 'unknown-address',
      } as Transaction;
    } catch (error) {
      console.error('Error getting transaction information:', error);
      return null;
    }
  }

  // Проверить статус транзакции
  async checkTransactionStatus(signature: string): Promise<'success' | 'error' | 'pending'> {
    try {
      const status = await this.connection.getSignatureStatus(signature);
      
      if (!status || !status.value) {
        return 'pending';
      }
      
      if (status.value.err) {
        return 'error';
      }
      
      return status.value.confirmationStatus === 'finalized' ? 'success' : 'pending';
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return 'error';
    }
  }
} 