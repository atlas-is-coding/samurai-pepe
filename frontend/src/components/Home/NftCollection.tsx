'use client';

import { NftCard } from './NftCard';
import './NftCard.css';

export function NftCollection() {
  return (
    <div>
      <span className="menu-title nft" style={{ fontSize: '1.5em' }}>⚔︎Your collection⚔︎</span>
      <div className="menu-item">
        <div className="nft-list ds">
          <NftCard 
            type="common" 
            title="Kōjō" 
            videoSrc="/kojo-video.mp4"
            price={0.5} 
          />
          <NftCard 
            type="rare" 
            title="Daimyo" 
            videoSrc="/daimyo-video.mp4"
            price={1}
          />
          <NftCard 
            type="legendary" 
            title="Shogun" 
            videoSrc="/shogun-video.mp4"
            price={2}
          />
        </div>
      </div>
      <div className="nft-list ds" style={{ marginTop: 0, justifyContent: 'space-around', width: '361px' }}>
        <div className="nft-cardp">
          <p className="nft-quantity" style={{ fontStyle: 'bold', color: '#8A2BE2' }}><b>Common</b></p>
          <p className="nft-quantity" style={{ fontStyle: 'bold', color: '#8A2BE2' }}><b>[0/50]</b></p>
        </div>
        <div className="nft-cardp">
          <p className="nft-quantity" style={{ fontStyle: 'bold', color: '#FF0000' }}><b>Rare</b></p>
          <p className="nft-quantity" style={{ fontStyle: 'bold', color: '#FF0000' }}><b>[0/20]</b></p>
        </div>
        <div className="nft-cardp">
          <p className="nft-quantity" style={{ fontStyle: 'bold', color: '#FFD700' }}><b>Legendary</b></p>
          <p className="nft-quantity" style={{ fontStyle: 'bold', color: '#FFD700' }}><b>[0/10]</b></p>
        </div>
      </div>
    </div>
  );
} 