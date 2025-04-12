'use client';

import './AboutSection.css';
import Link from 'next/link';

export function AboutSection() {
  return (
    <section className="about-section">
      <h2>About Samurai Pepe</h2>
      
      <div className="about-content">
        <p className="about-intro">
          Samurai Pepe is more than just a memecoin - it's a cultural 
          revolution in the crypto space. We combine the wisdom and 
          discipline of ancient Samurai traditions with the innovative 
          world of blockchain technology.
        </p>
        
        <div className="quotes-container">
          <div className="quote-block quote-purple">
            <p>Our mission is to bridge traditional Japanese culture 
            with the innovative world of cryptocurrencies, fostering 
            widespread blockchain adoption in Japan and beyond</p>
          </div>
          
          <div className="quote-block quote-red">
            <p>By purchasing our NFTs, you gain access to an exclusive 
            Whitelist. Earn points that will be displayed in your personal 
            account after purchase. When our token launches, these points 
            can be exchanged for tokens $SPPE, which will be listed on our 
            own exchange, Samurai Pepe, as well as on major exchanges like 
            Binance, Coinbase, Kraken, and Bybit.</p>
          </div>
          
          <div className="quote-block quote-yellow">
            <p>Climb the <Link href="/leaderboard" className="leaderboard-link"><strong>Leaderboard</strong></Link> by bridging, using Dapps, and inviting 
            friends! Compete with other Whitelist members to earn points. Top 
            participants will receive exclusive airdrops, rewards, and other 
            privileges.</p>
          </div>
        </div>
      </div>
    </section>
  );
}