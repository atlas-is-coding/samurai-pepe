'use client';

import './SocialFooter.css';

export function SocialFooter() {
  return (
    <footer className="social-footer">
      <div className="social-icons">
        <a href="https://twitter.com/SamuraiPepe" target="_blank" className="social-icon" rel="noreferrer">
          <i className="fab fa-twitter"></i>
        </a>
        <a href="https://t.me/SamuraiPepe" target="_blank" className="social-icon" rel="noreferrer">
          <i className="fab fa-telegram-plane"></i>
        </a>
        <a href="https://discord.gg/SamuraiPepe" target="_blank" className="social-icon" rel="noreferrer">
          <i className="fab fa-discord"></i>
        </a>
      </div>
      <div className="copyright">
        <p>&copy; {new Date().getFullYear()} Samurai Pepe. All rights reserved.</p>
        <p className="disclaimer">Trading cryptocurrencies involves risk. Do your own research before investing.</p>
      </div>
    </footer>
  );
} 