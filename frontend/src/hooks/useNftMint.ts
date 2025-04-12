import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolanaNft } from '@/context/SolanaNftProvider';
import { toast } from 'react-hot-toast';

// Возможные состояния процесса минтинга
export type MintStatus = 'idle' | 'preparing' | 'minting' | 'success' | 'error';

// Результат минтинга
export type MintResult = {
  success: boolean;
  nftId?: string;
  message?: string;
  txSignature?: string;
};

/**
 * Хук для минтинга NFT через SolanaNftProvider
 */
export const useNftMint = () => {
  const { connected } = useWallet();
  const { purchaseNFT, isNFT3Available, ownedNFTs, refreshNFTs } = useSolanaNft();
  const [status, setStatus] = useState<MintStatus>('idle');
  const [currentNftId, setCurrentNftId] = useState<string | null>(null);

  /**
   * Минтинг NFT с указанным ID
   * @param nftId ID NFT из перечисления ('NFT1', 'NFT2', 'NFT3')
   * @returns Promise с результатом минтинга
   */
  const mintNft = async (nftId: string): Promise<MintResult> => {
    // Проверяем, подключен ли кошелек
    if (!connected) {
      toast.error('Please connect your wallet');
      return { success: false, message: 'Wallet not connected' };
    }

    // Проверяем доступность NFT3
    if (nftId === 'NFT3' && !isNFT3Available) {
      toast.error('To purchase Shōgun, you must own Kōjō and Daimyō');
      return { 
        success: false, 
        message: 'To purchase Shōgun, you must own Kōjō and Daimyō' 
      };
    }

    // Обновляем состояние
    setStatus('preparing');
    setCurrentNftId(nftId);

    try {
      // Переходим в состояние минтинга
      setStatus('minting');
      
      // Вызываем функцию минтинга из контекста
      const success = await purchaseNFT(nftId);
      
      if (success) {
        setStatus('success');
        
        // Обновляем информацию о NFT
        await refreshNFTs();
        
        return { 
          success: true, 
          nftId,
          message: 'NFT successfully created!' 
        };
      } else {
        setStatus('error');
        return { 
          success: false, 
          nftId,
          message: 'Failed to create NFT. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      setStatus('error');
      return { 
        success: false, 
        nftId,
        message: `Error creating NFT: ${(error as Error).message}` 
      };
    }
  };

  /**
   * Сброс состояния минтинга
   */
  const resetMintStatus = () => {
    setStatus('idle');
    setCurrentNftId(null);
  };

  /**
   * Проверка доступности NFT для минтинга
   * @param nftId ID NFT
   * @returns true, если NFT доступно для минтинга
   */
  const isNftAvailable = (nftId: string): boolean => {
    if (nftId === 'NFT3') {
      return isNFT3Available;
    }
    return connected;
  };

  /**
   * Получение количества NFT, которыми владеет пользователь
   * @param nftId ID NFT
   * @returns Количество NFT
   */
  const getNftCount = (nftId: string): number => {
    if (!ownedNFTs || !ownedNFTs[nftId]) return 0;
    return ownedNFTs[nftId];
  };

  return {
    mintNft,
    status,
    currentNftId,
    resetMintStatus,
    isNftAvailable,
    getNftCount,
    isLoading: status === 'preparing' || status === 'minting'
  };
}; 