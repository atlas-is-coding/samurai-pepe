'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import './NFTStore.css';
import { useSolanaNft } from '@/context/SolanaNftProvider';
import { useEffect, useState } from 'react';

function NFTButton({ nftId, disabled, onClick }: { nftId: string; disabled: boolean; onClick: () => void }) {
  const { isLoading, ownedNFTs } = useSolanaNft();
  
  // Проверяем, владеет ли пользователь этим NFT
  const isOwned = ownedNFTs[nftId] > 0;
  
  // Определяем текст кнопки и её состояние
  let buttonText = "Buy";
  let buttonDisabled = disabled || isLoading;
  
  if (isLoading) {
    buttonText = "Processing...";
  } else if (isOwned) {
    buttonText = "Already purchased";
    buttonDisabled = true;
  }
  
  return (
    <button 
      className={`nft-purchase-button ${buttonDisabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={buttonDisabled}
    >
      {buttonText}
    </button>
  );
}

export function NFTStore() {
  const { connected } = useWallet();
  const { ownedNFTs, purchaseNFT, isLoading, isNFT3Available } = useSolanaNft();
  const [showConnectMessage, setShowConnectMessage] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showConnectMessage) {
      timer = setTimeout(() => setShowConnectMessage(false), 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showConnectMessage]);

  const handlePurchase = (nftId: string) => {
    if (!connected) {
      setShowConnectMessage(true);
      return;
    }
    purchaseNFT(nftId);
  };

  const nfts = [
    {
      id: "NFT1",
      name: "Kōjō (Common)",
      description: "Standard NFT with a balance of 5,000 tokens",
      imageUrl: "/kojo-image.jpg",
      tokenAmount: 5000,
      price: 0.5
    },
    {
      id: "NFT2",
      name: "Daimyō (Rare)",
      description: "Improved NFT with a balance of 3,000 tokens",
      imageUrl: "/daimyo-image.jpg",
      tokenAmount: 3000,
      price: 1
    },
    {
      id: "NFT3",
      name: "Shōgun (Legendary)",
      description: "Premium NFT with a balance of 2,000 tokens",
      imageUrl: "/shogun-image.jpg",
      tokenAmount: 2000,
      price: 2,
      limited: true
    }
  ];

  return (
    <div className="nft-store-container">
      <h2 className="nft-store-title">NFT Store</h2>
      
      {showConnectMessage && (
        <div className="connect-wallet-message">
          Please connect your wallet to purchase NFTs
        </div>
      )}
      
      <div className="nft-grid">
        {nfts.map((nft) => (
          <div key={nft.id} className="nft-card">
            <div className="nft-image-container">
              <img src={nft.imageUrl} alt={nft.name} className="nft-image" />
              {nft.limited && !isNFT3Available && (
                <div className="nft-sold-out">Sold out</div>
              )}
              {ownedNFTs[nft.id] > 0 && (
                <div className="nft-owned-badge">Purchased</div>
              )}
            </div>
            <div className="nft-details">
              <h3 className="nft-name">{nft.name}</h3>
              <p className="nft-description">{nft.description}</p>
              <div className="nft-token-amount">
                <span className="token-amount-value">{nft.tokenAmount}</span>
                <span className="token-amount-label">tokens</span>
              </div>
              <div className="nft-price">
                <span className="price-value">{nft.price}</span>
                <span className="price-label">SOL</span>
              </div>
              <NFTButton 
                nftId={nft.id}
                disabled={nft.limited ? !isNFT3Available : false}
                onClick={() => handlePurchase(nft.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 