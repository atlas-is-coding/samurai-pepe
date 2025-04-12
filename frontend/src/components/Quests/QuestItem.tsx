'use client';

import { useState } from 'react';
import Image from 'next/image';
import { QuestServices } from './QuestServices';
import { useWallet } from '@solana/wallet-adapter-react';

interface QuestItemProps {
  id: number;
  title: string;
  points: number;
  icon: string;
  isActive: boolean;
  isCompleted: boolean;
  onComplete: (id: number) => void;
}

export function QuestItem({ id, title, points, icon, isActive, isCompleted, onComplete }: QuestItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { publicKey } = useWallet();

  const handleClick = async () => {
    if (!isActive || isCompleted || isLoading || !publicKey) return;
    
    setIsLoading(true);
    
    try {
      let success = false;
      let twitterUsername: string | undefined;
      
      // Сохраняем адрес кошелька в localStorage для последующего использования в OAuth flow
      localStorage.setItem('walletAddress', publicKey.toString());
      
      // Вызываем соответствующий сервис в зависимости от ID квеста
      switch (id) {
        case 1:
          const twitterResult = await QuestServices.connectTwitter();
          success = twitterResult.success;
          twitterUsername = twitterResult.twitterUsername;
          break;
        case 2:
          const discordResult = await QuestServices.connectDiscord();
          success = discordResult.success;
          break;
        case 3:
          const telegramResult = await QuestServices.connectTelegram();
          success = telegramResult.success;
          break;
      }
      
      if (success) {
        // Сохраняем выполнение квеста и твиттер-юзернейм если это квест твиттера
        const saveResult = await QuestServices.saveCompletedQuest(
          publicKey.toString(), 
          id,
          twitterUsername
        );
        
        if (saveResult) {
          onComplete(id);
        }
      }
    } catch (error) {
      console.error('Error completing quest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`quest-item ${isActive ? 'active' : 'inactive'} ${isCompleted ? 'completed' : ''}`}
      onClick={handleClick}
    >
      <div className="quest-icon">
        <Image src={icon} alt={title} width={32} height={32} />
      </div>
      <div className="quest-info">
        <div className="quest-title">{title}</div>
        <div className="quest-points">+{points} points</div>
      </div>
      <div className="quest-status">
        {isCompleted ? (
          <div className="completed-icon">✓</div>
        ) : isLoading ? (
          <div className="loading-icon">⟳</div>
        ) : (
          <div className="action-icon">{isActive ? '→' : '🔒'}</div>
        )}
      </div>
      
      <style jsx>{`
        .quest-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          border: 1px solid;
          cursor: pointer;
        }
        
        .active {
          border-color: var(--primary, #FFD700);
          background: rgba(30, 30, 30, 0.8);
        }
        
        .inactive {
          border-color: #555;
          filter: grayscale(100%);
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .completed {
          border-color: #51ff00;
          background: rgba(20, 40, 20, 0.4);
        }
        
        .quest-icon {
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .quest-info {
          flex-grow: 1;
        }
        
        .quest-title {
          font-weight: 600;
          color: white;
        }
        
        .quest-points {
          font-size: 0.8em;
          color: var(--primary, #FFD700);
        }
        
        .quest-status {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }
        
        .completed-icon {
          color: #51ff00;
          font-weight: bold;
        }
        
        .loading-icon {
          animation: spin 1s linear infinite;
          color: var(--primary, #FFD700);
        }
        
        .action-icon {
          color: var(--primary, #FFD700);
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 