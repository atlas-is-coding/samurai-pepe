'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import './Navigation.css';

// Определение типа для WalletConnectionProvider для решения проблемы с типизацией
interface WalletConnectionProviderProps {
  isPulse?: boolean;
}

// Создаем компонент навигации
export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Проверка при загрузке
    checkIfMobile();
    
    // Проверка при изменении размера окна
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Загружаем компонент кошелька динамически только на клиенте с типизацией
  const WalletConnectionProvider = dynamic<WalletConnectionProviderProps>(
    () => import('./WalletProvider').then(mod => mod.WalletConnectionProvider),
    { ssr: false }
  );

  return (
    <nav className="nav-container">
      <div className="hamburger-menu" onClick={toggleMobileMenu}>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
      </div>
      
      <div className={`nav-links ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
        <a href="#about">About</a>
        <a href="#nft">NFT</a>
        <a href="#howtobuy">How to Buy</a>
        <a href="#roadmap">Roadmap</a>
        <a href="#tokenomics">Tokenomics</a>
        <Link href="/leaderboard">Leaderboard</Link>
        <a href="/whitepaper" target="_blank">Whitepaper</a>
        <a href="#faq">FAQ</a>
        
        <div className="social-icons-nav">
          <a href="https://twitter.com/SamuraiPepe" target="_blank" className="social-icon-nav" rel="noreferrer">
            <i className="fab fa-twitter"></i>
          </a>
          <a href="https://t.me/SamuraiPepe" target="_blank" className="social-icon-nav" rel="noreferrer">
            <i className="fab fa-telegram-plane"></i>
          </a>
          <a href="https://discord.gg/SamuraiPepe" target="_blank" className="social-icon-nav" rel="noreferrer">
            <i className="fab fa-discord"></i>
          </a>
        </div>
      </div>
      
      <WalletConnectionProvider isPulse={!isMobile} />
    </nav>
  );
} 