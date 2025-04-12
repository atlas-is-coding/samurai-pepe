'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface MintSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  mintAddress: string;
  txid: string;
  nftType: string;
}

export function MintSuccessModal({
  isOpen,
  onClose,
  mintAddress,
  txid,
  nftType
}: MintSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  // Обработчик для копирования адреса в буфер обмена
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(mintAddress).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Создаем ссылку на сканер транзакций
  const exploreLink = `https://explorer.solana.com/tx/${txid}?cluster=devnet`;

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="mint-success-modal">
        <span className="close-button" onClick={onClose}>&times;</span>
        
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#4CAF50" strokeWidth="2"/>
            <path d="M8 12L11 15L16 9" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        
        <h2>Mint Success!</h2>
        <p className="nft-type">{nftType} NFT successfully created</p>
        
        <div className="mint-details">
          <div className="mint-address">
            <label>NFT Address:</label>
            <div className="address-container">
              <input 
                type="text" 
                readOnly 
                value={mintAddress} 
                className="address-input"
              />
              <button onClick={handleCopyAddress} className="copy-button">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="transaction-link">
            <a href={exploreLink} target="_blank" rel="noopener noreferrer">
              View transaction in Solana Explorer
            </a>
          </div>
        </div>
        
        <div className="modal-actions">
          <Button onClick={onClose}>Close</Button>
          <a href="/profile" className="view-profile-link">
            <Button variant="outline">View my NFTs</Button>
          </a>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .mint-success-modal {
          background-color: #000;
          border: 1px solid #333;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 480px;
          position: relative;
          color: #fff;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        
        .close-button {
          position: absolute;
          top: 12px;
          right: 16px;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }
        
        .success-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 8px;
          color: #4CAF50;
        }
        
        .nft-type {
          text-align: center;
          margin-bottom: 24px;
          color: #ddd;
        }
        
        .mint-details {
          margin-bottom: 24px;
        }
        
        .mint-address {
          margin-bottom: 16px;
        }
        
        .mint-address label {
          display: block;
          margin-bottom: 6px;
          color: #aaa;
        }
        
        .address-container {
          display: flex;
          align-items: center;
        }
        
        .address-input {
          flex: 1;
          background-color: #111;
          border: 1px solid #333;
          border-radius: 4px 0 0 4px;
          padding: 8px 12px;
          color: #ddd;
          font-family: monospace;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .copy-button {
          background-color: #222;
          border: 1px solid #333;
          border-left: none;
          color: #0088cc;
          padding: 8px 12px;
          border-radius: 0 4px 4px 0;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .copy-button:hover {
          background-color: #333;
        }
        
        .transaction-link {
          text-align: center;
        }
        
        .transaction-link a {
          color: #0088cc;
          text-decoration: none;
          font-size: 14px;
        }
        
        .transaction-link a:hover {
          text-decoration: underline;
        }
        
        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 24px;
        }
        
        .view-profile-link {
          text-decoration: none;
        }
      `}</style>
    </div>
  );
} 