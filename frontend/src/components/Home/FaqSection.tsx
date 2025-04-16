'use client';

import { useState } from 'react';
import './FaqSection.css';

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
  const faqItems: FaqItem[] = [
    {
      question: "What is Samurai Pepe?",
      answer: "Samurai Pepe is a unique cryptocurrency project that combines the viral nature of meme coins with the rich heritage of Japanese Samurai culture. It features an ERC-20 token ($SAMURAI) and exclusive NFT collections with real utility."
    },
    {
      question: "How can I claim my $SPPE tokens?",
      answer: "To be eligible for $SPPE tokens, you need to participate in our ecosystem. Here's how it works:\n\n• Complete quests: Each quest grants 5 points.\n• Invite friends: You get 10 points for each referral, and your friend gets 5 points.\n• NFT ownership: Kōjō (Common) NFT grants 100 points, Daimyō (Rare) NFT grants 500 points, and Shōgun (Legendary) NFT grants 2500 points.\n\nYou can purchase Kōjō and Daimyō NFTs directly. However, to mint a Shōgun NFT, you must already own both a Kōjō and a Daimyō NFT.\n\nOnce you've acquired points, they'll be stored in your personal account, which can later be swapped for $SPPE tokens. These tokens will be tradable on major exchanges, including our own Samurai Pepe Exchange, as well as platforms like Binance, Coinbase, Kraken, and Bybit.\n\nThe exact date for swapping points into tokens and the token listing will be announced on our official channels."
    },
    {
      question: "How do I participate in the NFT presale?",
      answer: "To participate in the NFT presale, you need to have a Solana-compatible wallet (like Phantom). You can then choose from our three tiers of NFTs: Kōjō, Daimyō, or Shōgun. Each tier has different benefits and token allocations. Simply connect your wallet and follow the minting instructions on our website."
    },
    {
      question: "How do I contact the Samurai Pepe team?",
      answer: "You can reach out to our team by joining our official Telegram group and contacting a staff member. Alternatively, you can email us at contact@samuraipepe.com. We're always here to assist our community!"
    },
  ];
  
  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };
  
  return (
    <section id="faq" className="faq">
      <h2>Frequently Asked Questions</h2>
      <p>Got questions? We've got answers. If you don't see your question here, join our community to ask!</p>
      
      <div className="faq-container">
        {faqItems.map((item, index) => (
          <div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`}>
            <div className="faq-question" onClick={() => toggleAccordion(index)}>
              <h3>{item.question}</h3>
              <span className="faq-icon">{activeIndex === index ? '−' : '+'}</span>
            </div>
            <div className={`faq-answer ${activeIndex === index ? 'show' : ''}`}>
              <p style={{ whiteSpace: 'pre-wrap' }}>{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 