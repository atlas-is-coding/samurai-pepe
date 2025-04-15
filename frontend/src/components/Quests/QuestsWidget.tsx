'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuests } from './QuestsProvider';
import { Button } from '../ui/Button';
import { ReferralButton } from '../Home/ReferralButton';
import { NFTPopup } from '../NFT/NFTPopup';

// Глобальное состояние для управления вкладками модального окна кошелька
// В реальном приложении лучше использовать Context API или Redux
let walletTabsStateChangeCallback: ((tab: string) => void) | null = null;

// Функция для регистрации callback'а изменения вкладки
export function registerWalletTabsStateChangeCallback(callback: (tab: string) => void) {
  walletTabsStateChangeCallback = callback;
}

// Функция для активации определенной вкладки
export function activateWalletTab(tab: string) {
  if (walletTabsStateChangeCallback) {
    walletTabsStateChangeCallback(tab);
  }
}

export function QuestsWidget() {
  const { connected, publicKey } = useWallet();
  const { quests, completedQuests, isQuestActive, isQuestCompleted } = useQuests();
  const [showReferralLink, setShowReferralLink] = useState(false);
  const [showNFTPopup, setShowNFTPopup] = useState(false);
  
  // Функция для открытия модального окна кошелька с определенным квестом
  const handleQuestClick = (questId: number) => {
    // Находим кнопку кошелька и программно кликаем на неё
    const walletButton = document.querySelector('.connect-wallet-btn');
    if (walletButton instanceof HTMLElement) {
      // Устанавливаем активный квест перед открытием модального окна
      localStorage.setItem('activeQuest', questId.toString());
      
      walletButton.click();
      
      // Открываем модальное окно и активируем вкладку с квестами
      setTimeout(() => {
        // Уведомляем об изменении активного квеста
        if (walletTabsStateChangeCallback) {
          walletTabsStateChangeCallback(`quest-${questId}`);
        }
      }, 100);
    } else {
      alert('Кошелек не найден. Пожалуйста, перезагрузите страницу.');
    }
  };
  
  // Функция для открытия popup с NFT
  const handleNFTClick = () => {
    setShowNFTPopup(true);
  };
  
  // Функция для закрытия popup с NFT
  const closeNFTPopup = () => {
    setShowNFTPopup(false);
  };
  
  // Обработчик для кнопки "GET REFERRAL LINK"
  const handleReferralClick = () => {
    setShowReferralLink(true);
  };
  
  if (!connected) {
    return null;
  }

  return (
    <div className="quests-widget">
      <div className="quests-widget-header">
        <h3>Available Quests</h3>
      </div>
      
      <div className="quests-list">
        {quests.map(quest => (
          <div 
            key={quest.id}
            className={`quest-item ${quest.id === 1 || isQuestActive(quest.id) ? 'active' : 'inactive'} ${isQuestCompleted(quest.id) ? 'completed' : ''}`}
            onClick={() => (quest.id === 1 || isQuestActive(quest.id)) && handleQuestClick(quest.id)}
            data-quest-id={quest.id}
          >
            <div className="quest-icon">
              <img src={quest.icon} alt={quest.title} />
            </div>
            <div className="quest-info">
              <div className="quest-title">{quest.title}</div>
              <div className="quest-points">+{quest.points} points</div>
            </div>
            <div className="quest-status">
              {isQuestCompleted(quest.id) ? (
                <div className="completed-icon">✓</div>
              ) : quest.id === 1 || isQuestActive(quest.id) ? (
                <div className="action-icon">→</div>
              ) : (
                <div className="locked-icon">🔒</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="quests-widget-buttons">
        <Button onClick={handleNFTClick} className="nft-button">
          MY NFTs
        </Button>
        
        <Button onClick={() => handleQuestClick(1)} className="quests-button">
          QUESTS
        </Button>
        
        <ReferralButton className="referral-button-wrapper" />
      </div>
      
      {/* Всплывающее окно с NFT */}
      <NFTPopup isVisible={showNFTPopup} onClose={closeNFTPopup} />
      
      <style jsx>{`
        .quests-widget {
          background: rgba(0, 0, 0, 0.7);
          border: 2px solid #333;
          border-radius: 10px;
          padding: 15px;
          width: 100%;
          max-width: 500px;
          margin: 0 auto;
        }
        
        .quests-widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .quests-title {
          font-size: 24px;
          font-weight: bold;
          color: var(--primary, #FFD700);
          font-family: 'Orbitron', sans-serif;
        }
        
        .quests-counter {
          font-size: 24px;
          color: #51ff00;
          font-weight: bold;
        }
        
        .quests-widget-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .nft-button,
        .quests-button {
          width: 100%;
          padding: 15px;
          font-size: 18px;
          text-align: center;
          border-radius: 8px;
          background: linear-gradient(45deg, #FFD700, #FFA500);
          color: black;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
        }
        
        .nft-button:hover,
        .quests-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
        }
        
        .referral-button-wrapper {
          width: 100%;
        }
        
        @media (max-width: 768px) {
          .quests-widget {
            max-width: 100%;
          }
        }
        
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
        
        /* Стили для первого квеста - всегда активный */
        .quest-item[data-quest-id="1"] {
          border-color: var(--primary, #FFD700) !important;
          background: rgba(30, 30, 30, 0.8) !important;
          filter: none !important;
          opacity: 1 !important;
          cursor: pointer !important;
        }
      `}</style>
    </div>
  );
} 