'use client';

import './TokenomicsSection.css';

export function TokenomicsSection() {
  return (
    <section id="tokenomics" className="tokenomics">
      <h2>Tokenomics</h2>
      <div className="tokenomics-container">
        <div className="tokenomics-info">
          <h3>Token Details</h3>
          <div className="token-info-item">
            <span>Token Name:</span>
            <span>SAMURAI PEPE</span>
          </div>
          <div className="token-info-item">
            <span>Token Symbol:</span>
            <span>$SPPE</span>
          </div>
          <div className="token-info-item">
            <span>Total Supply:</span>
            <span>500,000,000 $SPPE</span>
          </div>
          <div className="token-info-item">
            <span>Blockchain:</span>
            <span>Solana</span>
          </div>
        </div>
        
        <div className="tokenomics-distribution">
          <h3>Token Distribution</h3>
          <ul>
            <li><span className="percentage">40%</span> NFT Holder Allocation</li>
            <li><span className="percentage">20%</span> Liquidity on CEX and DEX</li>
            <li><span className="percentage">15%</span> Community Airdrop</li>
            <li><span className="percentage">15%</span>  Staking Rewards</li>
            <li><span className="percentage">10%</span> Marketing & Giveaways</li>
          </ul>
          <div className="distribution-chart">
            <div className="chart-segment" style={{ width: '40%', backgroundColor: '#FFD700' }}></div>
            <div className="chart-segment" style={{ width: '20%', backgroundColor: '#8A2BE2' }}></div>
            <div className="chart-segment" style={{ width: '15%', backgroundColor: '#DC143C' }}></div>
            <div className="chart-segment" style={{ width: '15%', backgroundColor: '#FF4500' }}></div>
            <div className="chart-segment" style={{ width: '10%', backgroundColor: '#00FF00' }}></div>
          </div>
        </div>
        
        <div className="nft-allocation">
          <h3>NFT Token Allocation</h3>
          <ul>
            <li><span className="nft-type">Kōjō (Common):</span> 5,000 points per NFT</li>
            <li><span className="nft-type">Daimyō (Rare):</span> 15,000 points per NFT</li>
            <li><span className="nft-type">Shōgun (Legendary):</span> 50,000 points per NFT</li>
          </ul>
        </div>
      </div>
    </section>
  );
} 