'use client';

import { useEffect, useState } from 'react';
import { useSolanaNft } from '@/context/SolanaNftProvider';
import { Button } from '../ui/Button';
import { useWallet } from '@solana/wallet-adapter-react';

interface NFTPopupProps {
  isVisible: boolean;
  onClose: () => void;
}

export function NFTPopup({ isVisible, onClose }: NFTPopupProps) {
  const { nfts, totalPoints, isLoading, refreshNFTs } = useSolanaNft();
  const { connected, publicKey } = useWallet();
  const [isFirstOpen, setIsFirstOpen] = useState(true);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  // Обновление NFT при первом открытии окна
  useEffect(() => {
    if (isVisible && isFirstOpen && connected) {
      console.log('NFT update on window open');
      refreshNFTsWithErrorHandling();
      setIsFirstOpen(false);
      setHasRefreshed(true);
    }
  }, [isVisible, isFirstOpen, connected]);

  // При закрытии окна сбрасываем флаг, чтобы при следующем открытии обновить данные
  useEffect(() => {
    if (!isVisible) {
      setIsFirstOpen(true);
    }
  }, [isVisible]);

  // Ручное обновление NFT с обработкой ошибок
  const refreshNFTsWithErrorHandling = async () => {
    try {
      setError(null);
      console.log('Starting manual NFT refresh...');
      await refreshNFTs();
      console.log('NFT refresh completed', { nfts });
      setHasRefreshed(true);
    } catch (err) {
      console.error('Error refreshing NFTs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error refreshing NFTs');
    }
  };

  // Ручное обновление NFT
  const handleRefresh = () => {
    console.log('Manual NFT update requested');
    refreshNFTsWithErrorHandling();
  };

  if (!isVisible) return null;

  return (
    <div className="nft-popup-overlay" onClick={onClose}>
      <div className="nft-popup" onClick={(e) => e.stopPropagation()}>
        <div className="nft-popup-header">
          <h3>My NFTs</h3>
          <div className="nft-points">
            <span>Total points: </span>
            <strong>{totalPoints}</strong>
          </div>
          <button className="nft-popup-close" onClick={onClose}>×</button>
        </div>
        
        <div className="nft-popup-content">
          {!connected ? (
            <div className="no-nft-message">
              <div className="message-icon">
                <i className="fas fa-wallet"></i>
              </div>
              <p>Please connect your wallet</p>
              <p>to view your NFTs</p>
            </div>
          ) : isLoading ? (
            <div className="nft-loading">
              <div className="loader"></div>
              <p>Loading NFT...</p>
            </div>
          ) : (
            <>
              <div className="refresh-button-container">
                <Button 
                  onClick={handleRefresh} 
                  variant="outline"
                  disabled={isLoading}
                  className="refresh-button"
                >
                  <i className="fas fa-sync-alt"></i> Refresh
                </Button>
              </div>
              
              <div className="nft-list">
                {nfts.length > 0 ? (
                  nfts.map((nft) => (
                    <div key={nft.mint} className="nft-item">
                      <div className="nft-image-container">
                        <img 
                          src={nft.image} 
                          alt={nft.name} 
                          className="nft-image"
                          onError={(e) => {
                            console.log('Error loading image:', nft.image);
                            (e.target as HTMLImageElement).src = '/nft/placeholder-nft.svg';
                          }}
                        />
                      </div>
                      <div className="nft-details">
                        <div className="nft-name">{nft.name}</div>
                        <div className="nft-count">
                          <span className="nft-count-label">Quantity:</span>
                          <span className="nft-count-value">{nft.count}</span>
                        </div>
                        <div className="nft-mint small">
                          {nft.mint.substring(0, 6)}...{nft.mint.substring(nft.mint.length - 6)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : hasRefreshed ? (
                  <div className="no-nft-message">
                    <div className="message-icon">
                      <i className="fas fa-box-open"></i>
                    </div>
                    <p>You don't have any NFTs</p>
                    <p>Purchase NFTs in the NFT section</p>
                  </div>
                ) : (
                  <div className="no-nft-message">
                    <div className="message-icon">
                      <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <p>Failed to load NFT</p>
                    <p>Try refreshing</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .nft-popup-overlay {
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
          opacity: 1;
          visibility: visible;
        }
        
        .nft-popup {
          background: linear-gradient(145deg, var(--dark-accent), #1a1a1a);
          border-radius: 15px;
          width: 90%;
          max-width: 550px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 0 30px rgba(255, 215, 0, 0.3), 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid var(--primary);
          animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        
        .nft-popup-header {
          background: linear-gradient(90deg, var(--primary), #ff9e1c);
          padding: 12px 18px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        
        .nft-popup-header h3 {
          color: var(--dark);
          font-size: 1.2rem;
          margin: 0;
          font-family: 'Orbitron', sans-serif;
          text-transform: uppercase;
          font-weight: bold;
          letter-spacing: 0.05em;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }
        
        .nft-points {
          position: absolute;
          left: 18px;
          color: var(--dark);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          background: rgba(0, 0, 0, 0.2);
          padding: 5px 10px;
          border-radius: 20px;
          border: 1px solid rgba(0, 0, 0, 0.3);
        }
        
        .nft-points span {
          margin-right: 5px;
          opacity: 0.8;
        }
        
        .nft-points strong {
          color: #00aa00;
          font-family: 'Orbitron', sans-serif;
          font-weight: bold;
        }
        
        .nft-popup-close {
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
          position: absolute;
          right: 15px;
          top: 50%;
          transform: translateY(-50%);
        }
        
        .nft-popup-close:hover {
          background: rgba(0, 0, 0, 0.4);
          transform: translateY(-50%) rotate(90deg);
        }
        
        .nft-popup-content {
          padding: 20px;
        }
        
        .nft-loading {
          text-align: center;
          padding: 30px 20px;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          animation: fadeInUp 0.5s ease both;
        }
        
        .loader {
          border: 4px solid rgba(255, 215, 0, 0.3);
          border-radius: 50%;
          border-top: 4px solid var(--primary);
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        
        .nft-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 15px;
          padding-top: 10px;
        }
        
        .nft-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 12px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 215, 0, 0.1);
          animation: fadeInUp 0.5s ease both;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        
        .nft-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 215, 0, 0.3);
        }
        
        .nft-image-container {
          width: 100%;
          padding-bottom: 100%;
          position: relative;
          margin-bottom: 10px;
          border-radius: 8px;
          overflow: hidden;
          background: #0d0d0d;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .nft-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        
        .nft-item:hover .nft-image {
          transform: scale(1.05);
        }
        
        .nft-details {
          color: white;
          text-align: center;
        }
        
        .nft-name {
          font-weight: bold;
          font-size: 0.9rem;
          margin-bottom: 5px;
          color: var(--primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .nft-count {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .nft-count-label {
          opacity: 0.7;
          margin-right: 5px;
        }
        
        .nft-count-value {
          font-weight: bold;
          color: var(--secondary);
        }
        
        .no-nft-message {
          text-align: center;
          color: white;
          padding: 30px 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
          border: 1px solid rgba(255, 215, 0, 0.1);
          animation: fadeInUp 0.5s ease both;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .message-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
          color: var(--primary);
          opacity: 0.7;
        }
        
        .no-nft-message p {
          margin: 5px 0;
          opacity: 0.8;
        }
        
        .refresh-button-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
          animation: fadeInUp 0.5s ease 0.2s both;
        }
        
        .refresh-button {
          font-size: 0.9rem;
          padding: 8px 15px;
          border-radius: 8px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .refresh-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
        
        @keyframes slideIn {
          from { transform: scale(0.9) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .nft-list {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          }
        }
        
        @media (max-width: 480px) {
          .nft-popup {
            width: 95%;
            max-width: 400px;
          }
          
          .nft-popup-header h3 {
            font-size: 1.1rem;
          }
          
          .nft-points {
            font-size: 0.8rem;
          }
          
          .nft-list {
            grid-template-columns: repeat(auto-fill, minmax(85px, 1fr));
            gap: 10px;
          }
          
          .nft-item {
            padding: 8px;
          }
          
          .nft-name {
            font-size: 0.8rem;
          }
          
          .nft-count {
            font-size: 0.7rem;
          }
        }
        
        .debug-info {
          margin-bottom: 20px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          border: 1px dashed rgba(255, 215, 0, 0.3);
          color: #ccc;
          font-size: 0.8rem;
        }
        
        .debug-info p {
          margin: 5px 0;
        }
        
        .error-message {
          color: #ff5555 !important;
          font-weight: bold;
        }
        
        .debug-nft-data {
          overflow-x: auto;
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 4px;
          max-height: 200px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 11px;
          white-space: pre-wrap;
          color: #00ff00;
        }
        
        .nft-mint {
          font-size: 0.7rem;
          opacity: 0.7;
          margin-top: 3px;
          font-family: monospace;
        }

        .small {
          font-size: 0.65rem;
        }
      `}</style>
    </div>
  );
} 