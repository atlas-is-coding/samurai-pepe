'use client';

import { useState, useEffect, useRef } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    // Обработчик клика вне меню
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && 
          menuRef.current && 
          hamburgerRef.current && 
          !menuRef.current.contains(event.target as Node) && 
          !hamburgerRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    // Добавляем обработчик только когда меню открыто
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    // Предотвращаем быстрые повторные клики
    setTimeout(() => {
      setMobileMenuOpen(!mobileMenuOpen);
    }, 10);
  };

  // Загружаем компонент кошелька динамически только на клиенте с типизацией
  const WalletConnectionProvider = dynamic<WalletConnectionProviderProps>(
    () => import('./WalletProvider').then(mod => mod.WalletConnectionProvider),
    { ssr: false }
  );

  return (
    <nav className="nav-container">
      <div className="hamburger-menu" onClick={toggleMobileMenu} ref={hamburgerRef}>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
      </div>
      
      <div className={`nav-links ${mobileMenuOpen ? 'mobile-menu-open' : ''}`} ref={menuRef}>
        <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
        <a href="#nft" onClick={() => setMobileMenuOpen(false)}>NFT</a>
        <a href="#howtobuy" onClick={() => setMobileMenuOpen(false)}>How to Buy</a>
        <a href="#roadmap" onClick={() => setMobileMenuOpen(false)}>Roadmap</a>
        <a href="#tokenomics" onClick={() => setMobileMenuOpen(false)}>Tokenomics</a>
        <Link href="/leaderboard" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
        <a href="/whitepaper" target="_blank" onClick={() => setMobileMenuOpen(false)}>Whitepaper</a>
        <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
        
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