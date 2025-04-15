'use client';

import { Button } from '../ui/Button';
import './HowToBuySection.css';

export function HowToBuySection() {
  return (
    <section id="howtobuy" className="how-to-buy">
      <h2>How to Buy Samurai Pepe</h2>
      <div className="steps-container">
        <div className="step">
          <i className="fas fa-wallet"></i>
          <h3>1. Prepare Your Wallet</h3>
          <p>
          Ensure you have a Solana-compatible wallet like Phantom. Install the Phantom browser extension if you haven't already.
          </p>
        </div>
        
        <div className="step">
          <i className="fas fa-coins"></i>
          <h3>2. Fund Your Wallet</h3>
          <p>
          Make sure your wallet has enough SOL to purchase Samurai Pepe NFTs and cover transaction fees. Holding enough SOL will also ensure you can earn points for your activity within the platform.
          </p>
        </div>
        
        <div className="step">
          <i className="fas fa-exchange-alt"></i>
          <h3>3. Choose Payment Method</h3>
          <p>
          You can purchase Samurai Pepe NFTs by connecting your Phantom wallet directly to the smart contract. Once the payment is completed, the NFTs will be delivered to your personal account.
          </p>
        </div>
        
        <div className="step">
          <i className="fas fa-hand-pointer"></i>
          <h3>4. Complete the Transaction</h3>
          <p>
          Follow the instructions to complete your purchase. Confirm the transaction in your wallet when the prompt appears. After completing the transaction, check your wallet for the newly purchased NFTs and verify the points that have been credited to your account.
          </p>
        </div>
      </div>
      
      <div className="cta-container">
        <a href="#nft">
          <Button isPulse>Buy Samurai Pepe Now</Button>
        </a>
      </div>
    </section>
  );
} 