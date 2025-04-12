'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '../ui/Button';
import { useQuests } from '../Quests/QuestsProvider';
import { QuestItem } from '../Quests/QuestItem';
import { activateWalletTab } from '../Quests/QuestsWidget';
import { NFTPopup } from '../NFT/NFTPopup';

interface ReferralButtonProps {
  className?: string;
}

interface ReferralData {
  canGenerateLink: boolean;
  referralCount: number;
  points: number;
  inviteCode: string;
}

export function ReferralButton({ className = '' }: ReferralButtonProps) {
  const { publicKey, connected } = useWallet();
  const [showReferralLink, setShowReferralLink] = useState(false);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canGenerateLink, setCanGenerateLink] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [points, setPoints] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [showNFTPopup, setShowNFTPopup] = useState(false);
  const { quests, completeQuest, isQuestActive, isQuestCompleted } = useQuests();
  
  // Check if the user can generate a referral link
  useEffect(() => {
    if (connected && publicKey) {
      const checkReferralEligibility = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          const response = await fetch(`/api/invite?walletAddress=${publicKey.toString()}`);
          const data: ReferralData = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Failed to check referral eligibility');
          }
          
          setCanGenerateLink(data.canGenerateLink);
          setReferralCount(data.referralCount || 0);
          setPoints(data.points || 0);
          
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          setCanGenerateLink(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      checkReferralEligibility();
    } else {
      setCanGenerateLink(false);
      setReferralLink(null);
      setShowReferralLink(false);
    }
  }, [connected, publicKey]);
  
  // Generate referral link
  const generateReferralLink = async () => {
    if (!connected || !publicKey) {
      setError('Wallet not connected');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create referral link');
      }
      
      setReferralLink(data.referralLink);
      setReferralCount(data.referralCount || 0);
      setPoints(data.points || 0);
      
      // Show modal with animation sequence
      setShowReferralLink(true);
      // Delay modal visibility to allow overlay animation to start first
      setTimeout(() => {
        setIsModalVisible(true);
      }, 50);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Copy link to clipboard
  const copyToClipboard = async () => {
    if (referralLink) {
      try {
        await navigator.clipboard.writeText(referralLink);
        setIsCopied(true);
        
        // Reset "copied" status after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      } catch (err) {
        setError('Failed to copy link');
      }
    }
  };
  
  // Copy invite code to clipboard
  const copyInviteCode = async () => {
    try {
      const inviteCode = referralLink?.split('/').pop();
      if (inviteCode) {
        await navigator.clipboard.writeText(inviteCode);
        setIsCopied(true);
        
        // Reset "copied" status after 2 seconds
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      }
    } catch (err) {
      setError('Failed to copy invite code');
    }
  };
  
  // Close the referral modal
  const closeReferralModal = () => {
    // Hide modal first with animation
    setIsModalVisible(false);
    // Then remove the overlay after animation completes
    setTimeout(() => {
      setShowReferralLink(false);
    }, 300);
  };
  
  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showReferralLink) {
        closeReferralModal();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showReferralLink]);
  
  // Функция для открытия popup с NFT
  const handleNFTClick = () => {
    setShowNFTPopup(true);
  };
  
  // Функция для закрытия popup с NFT
  const closeNFTPopup = () => {
    setShowNFTPopup(false);
  };
  
  // Функция для открытия модального окна кошелька с вкладкой квестов
  const handleQuestsClick = () => {
    setShowQuestsModal(true);
  };
  
  // Закрытие модального окна квестов
  const closeQuestsModal = () => {
    setShowQuestsModal(false);
  };
  
  // Обработка клавиши Escape для закрытия модального окна квестов
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showQuestsModal) {
        closeQuestsModal();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showQuestsModal]);
  
  // If wallet is not connected or user cannot generate a link, don't show the button
  if (!connected || !canGenerateLink) {
    return null;
  }
  
  return (
    <div className={`referral-button-container ${className}`}>
      {/* Кнопка для открытия NFT */}
      <Button 
        onClick={handleNFTClick}
        className="nft-button"
      >
        My NFTs
      </Button>
      
      {/* Кнопка для открытия квестов */}
      <Button 
        onClick={handleQuestsClick}
        className="quests-button"
      >
        Available Quests
      </Button>
      
      {/* Кнопка для получения реферальной ссылки */}
      <Button 
        onClick={generateReferralLink} 
        disabled={isLoading}
        className="referral-button"
      >
        {isLoading ? 'Loading...' : 'Get Referral Link'}
      </Button>
      
      {error && <p className="error-message">{error}</p>}
      
      {/* Модальное окно NFT */}
      <NFTPopup isVisible={showNFTPopup} onClose={closeNFTPopup} />
      
      {/* Модальное окно квестов */}
      {showQuestsModal && (
        <div className="quests-modal-overlay" onClick={(e) => {
          // Закрыть модальное окно при клике на фон
          if ((e.target as HTMLElement).className.includes('quests-modal-overlay')) {
            closeQuestsModal();
          }
        }}>
          <div className="quests-modal-popup">
            <div className="modal-header">
              <h3>Available Quests</h3>
              <button 
                className="close-button" 
                onClick={closeQuestsModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="quests-list">
                {quests.map(quest => (
                  <QuestItem 
                    key={quest.id}
                    id={quest.id}
                    title={quest.title}
                    points={quest.points}
                    icon={quest.icon}
                    isActive={isQuestActive(quest.id)}
                    isCompleted={isQuestCompleted(quest.id)}
                    onComplete={completeQuest}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно реферальной ссылки */}
      {showReferralLink && (
        <div 
          className={`referral-modal-overlay ${isModalVisible ? 'visible' : ''}`} 
          onClick={(e) => {
            // Close modal when clicking on the background
            if ((e.target as HTMLElement).className.includes('referral-modal-overlay')) {
              closeReferralModal();
            }
          }}
        >
          <div className={`referral-modal-popup ${isModalVisible ? 'visible' : ''}`}>
            <div className="modal-header">
              <h3>Your Referral Link</h3>
              <button 
                className="close-button" 
                onClick={closeReferralModal}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="referral-info-card">
                <div className="stats-row">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{referralCount}</div>
                    <div className="stat-label">Referrals</div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{points}</div>
                    <div className="stat-label">Points</div>
                  </div>
                </div>
                
                <p className="referral-info">
                  Share this code or link with friends. You'll earn 10 points for each friend who purchases an NFT.
                  They'll receive 5 bonus points too!
                </p>
              </div>
              
              {/* Invite Code Display */}
              <div className="invite-code-section">
                <h4>Your Invite Code</h4>
                <div className="invite-code-display">
                  {referralLink?.split('/').pop()}
                </div>
                <Button 
                  onClick={copyInviteCode} 
                  className={`copy-button ${isCopied ? 'copied' : ''}`}
                >
                  {isCopied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
              
              <div className="referral-link-section">
                <h4>Or Share Your Link</h4>
                <div className="referral-link-container">
                  <input 
                    type="text" 
                    value={referralLink || ''} 
                    readOnly 
                    className="referral-link-input" 
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button 
                    onClick={copyToClipboard} 
                    className={`copy-button ${isCopied ? 'copied' : ''}`}
                  >
                    {isCopied ? 'Copied!' : 'Copy Link'}
                  </Button>
                </div>
                
                <div className="social-share">
                  <Button 
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join Samurai Pepe and get 5 bonus points! ${referralLink}`)}`)} 
                    className="share-button twitter"
                  >
                    <span className="share-icon">𝕏</span>
                    <span>Twitter</span>
                  </Button>
                  <Button 
                    onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink || '')}&text=${encodeURIComponent('Join Samurai Pepe and get 5 bonus points!')}`)} 
                    className="share-button telegram"
                  >
                    <span className="share-icon">✈️</span>
                    <span>Telegram</span>
                  </Button>
                </div>
              </div>
              
              <div className="referral-bonus-info">
                <div className="bonus-icon">🚀</div>
                <div className="bonus-text">
                  <strong>Referral Program:</strong> Invite friends to join Samurai Pepe and earn exclusive rewards!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .referral-button-container {
          margin: 20px 0;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .quests-button {
          width: 100%;
          background: linear-gradient(45deg, #4e54c8, #8f94fb);
        }
        
        .referral-button {
          width: 100%;
        }
        
        .error-message {
          color: #ff5555;
          margin-top: 10px;
          font-size: 14px;
        }
        
        .quests-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.75);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .quests-modal-popup {
          background: linear-gradient(145deg, var(--dark-accent), #1a1a1a);
          border-radius: 20px;
          width: 90%;
          max-width: 480px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .quests-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .referral-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(0px);
          transition: background 0.3s ease, backdrop-filter 0.3s ease;
          opacity: 0;
          visibility: hidden;
        }
        
        .referral-modal-overlay.visible {
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(5px);
          opacity: 1;
          visibility: visible;
        }
        
        .referral-modal-popup {
          background: linear-gradient(145deg, var(--dark-accent), #1a1a1a);
          border-radius: 15px;
          max-width: 550px;
          width: 90%;
          position: relative;
          box-shadow: 0 0 0 rgba(255, 215, 0, 0), 0 0 0 rgba(0, 0, 0, 0);
          overflow: hidden;
          transform: scale(0.9) translateY(20px);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                      opacity 0.3s ease,
                      box-shadow 0.3s ease;
        }
        
        .referral-modal-popup.visible {
          transform: scale(1) translateY(0);
          opacity: 1;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .modal-header {
          background: linear-gradient(90deg, var(--primary), #ff9e1c);
          padding: 12px 18px;
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header h3 {
          color: var(--dark);
          margin: 0;
          font-family: 'Orbitron', sans-serif;
          font-size: 1.2rem;
          text-transform: uppercase;
          font-weight: bold;
          letter-spacing: 0.05em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .close-button {
          background: rgba(0, 0, 0, 0.2);
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--dark);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: all 0.3s ease;
        }
        
        .close-button:hover {
          background: rgba(0, 0, 0, 0.4);
          transform: rotate(90deg);
        }
        
        .modal-body {
          padding: 18px;
        }
        
        .referral-info-card {
          background: rgba(255, 215, 0, 0.05);
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 18px;
          border: 1px solid rgba(255, 215, 0, 0.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          animation: fadeInUp 0.5s ease 0.2s both;
        }
        
        .stats-row {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-bottom: 15px;
        }
        
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          min-width: 90px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 215, 0, 0.15);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }
        
        .stat-icon {
          font-size: 24px;
          margin-bottom: 5px;
        }
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: bold;
          color: var(--primary);
          font-family: 'Orbitron', sans-serif;
          line-height: 1.2;
          background: linear-gradient(90deg, var(--primary), #ff9e1c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .stat-label {
          font-size: 0.8rem;
          color: #ccc;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .referral-info {
          margin: 10px 0 0;
          color: #fff;
          text-align: center;
          line-height: 1.5;
          font-size: 0.9rem;
        }
        
        .referral-link-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .referral-link-container {
          display: flex;
          width: 100%;
        }
        
        .referral-link-input {
          flex: 1;
          padding: 12px;
          background: var(--dark);
          color: #fff;
          border: 1px solid var(--primary);
          border-radius: 8px 0 0 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          font-family: 'Courier New', monospace;
        }
        
        .referral-link-input:focus {
          outline: none;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
        }
        
        .copy-button {
          border-radius: 0 8px 8px 0;
          margin-left: -1px;
          padding: 0 15px;
          transition: all 0.3s ease;
          white-space: nowrap;
          min-width: 100px;
          font-size: 14px;
          font-weight: bold;
          height: 100%;
        }
        
        .copy-button.copied {
          background-color: #4CAF50;
        }
        
        .social-share {
          display: flex;
          gap: 10px;
        }
        
        .share-button {
          padding: 12px;
          font-size: 0.9rem;
          border-radius: 8px;
          flex: 1;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .share-icon {
          font-size: 1.1rem;
        }
        
        .share-button.twitter {
          background-color: #1DA1F2;
        }
        
        .share-button.telegram {
          background-color: #0088cc;
        }
        
        .share-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
        }
        
        .referral-bonus-info {
          display: flex;
          align-items: center;
          background: linear-gradient(45deg, rgba(255, 215, 0, 0.05), rgba(255, 140, 0, 0.1));
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(255, 215, 0, 0.1);
          gap: 12px;
          animation: fadeInUp 0.5s ease 0.4s both;
        }
        
        .bonus-icon {
          font-size: 28px;
        }
        
        .bonus-text {
          color: #eee;
          line-height: 1.4;
          font-size: 0.9rem;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .referral-modal-popup {
            width: 95%;
            max-width: 400px;
          }
          
          .modal-header h3 {
            font-size: 1.1rem;
          }
          
          .referral-link-container {
            flex-direction: column;
          }
          
          .referral-link-input {
            border-radius: 8px;
            margin-bottom: 8px;
          }
          
          .copy-button {
            border-radius: 8px;
            margin-left: 0;
            width: 100%;
            padding: 10px;
          }
          
          .social-share {
            flex-direction: column;
          }
          
          .stats-row {
            gap: 12px;
          }
          
          .stat-card {
            padding: 8px;
            min-width: 70px;
          }
          
          .stat-value {
            font-size: 1.5rem;
          }
          
          .invite-code-display {
            font-size: 1.5rem;
            letter-spacing: 3px;
            padding: 10px;
          }
        }
        
        .invite-code-section {
          margin: 15px 0;
          text-align: center;
        }
        
        .invite-code-section h4 {
          font-family: 'Orbitron', sans-serif;
          color: var(--primary);
          margin-bottom: 8px;
          font-size: 1rem;
        }
        
        .invite-code-display {
          font-size: 1.8rem;
          font-weight: bold;
          letter-spacing: 4px;
          color: var(--primary);
          background: rgba(255, 215, 0, 0.1);
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 12px;
          border: 1px dashed var(--primary);
        }
        
        .referral-link-section {
          margin: 15px 0;
        }
        
        .referral-link-section h4 {
          font-family: 'Orbitron', sans-serif;
          color: var(--primary);
          margin-bottom: 8px;
          text-align: center;
          font-size: 1rem;
        }
        
        .referral-button,
        .quests-button,
        .nft-button {
          width: 100%;
          padding: 12px 15px;
          font-size: 16px;
          text-align: center;
          border-radius: 8px;
          background: linear-gradient(45deg, #FFD700, #FFA500);
          color: black;
          font-weight: bold;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          margin-bottom: 10px;
          font-family: 'Orbitron', sans-serif;
        }
        
        .referral-button:hover,
        .quests-button:hover,
        .nft-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(255, 215, 0, 0.4);
        }
      `}</style>
    </div>
  );
} 