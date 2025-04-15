'use client';

import { useState } from 'react';
import { useSolanaNft } from '@/context/SolanaNftProvider';
import './NFTMenu.css';
import { toast } from 'react-hot-toast';

interface NFTMenuProps {
  isVisible: boolean;
}

export function NFTMenu({ isVisible }: NFTMenuProps) {
  const { nfts, ownedNFTs, totalPoints, isLoading, syncPoints } = useSolanaNft();
  const [isSyncing, setIsSyncing] = useState(false);
  const [prevPoints, setPrevPoints] = useState(0);
  
  if (!isVisible) return null;
  
  // Обработчик для синхронизации баллов
  const handleSyncPoints = async () => {
    try {
      setIsSyncing(true);
      toast.loading('Синхронизация баллов...', { id: 'sync-toast' });
      
      // Сохраняем текущее количество баллов
      const startPoints = totalPoints;
      setPrevPoints(startPoints);
      
      // Синхронизируем баллы
      await syncPoints();
      
      // Вычисляем разницу баллов после синхронизации
      const pointsDiff = totalPoints - startPoints;
      
      if (pointsDiff > 0) {
        toast.success(`Баллы успешно синхронизированы! Добавлено: ${pointsDiff}`, { id: 'sync-toast' });
      } else {
        toast.success('Баллы уже синхронизированы', { id: 'sync-toast' });
      }
    } catch (error) {
      console.error('Ошибка при синхронизации баллов:', error);
      toast.error('Не удалось синхронизировать баллы', { id: 'sync-toast' });
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <div className="nft-menu-container">
      <div className="nft-menu-header">
        <h3>Your NFTs</h3>
        <div className="nft-points">
          <span>Total points: </span>
          <strong>{totalPoints}</strong>
          <button 
            className="sync-points-button"
            onClick={handleSyncPoints}
            disabled={isLoading || isSyncing}
          >
            {isSyncing ? 'Синхронизация...' : 'Синхронизировать'}
          </button>
        </div>
      </div>
      
      <div className="nft-menu-content">
        {isLoading || isSyncing ? (
          <div className="nft-loading">Loading...</div>
        ) : (
          <div className="nft-list">
            {nfts.map((nft) => (
              <div key={nft.mint} className="nft-item-simple">
                <div className="nft-name">{nft.name}</div>
                <div className="nft-count">Quantity: {nft.count}</div>
              </div>
            ))}
            
            {nfts.length === 0 && (
              <div className="no-nft-message">
                You don't have any NFTs yet. Purchase them in the NFT section.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 