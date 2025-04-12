'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Navigation } from '../ui/Navigation';
import { Logo } from '../ui/Logo';
import { HeroSection } from './HeroSection';
import { AboutSection } from './AboutSection';
import { NftSection } from './NftSection';
import { HowToBuySection } from './HowToBuySection';
import { RoadmapSection } from './RoadmapSection';
import { TokenomicsSection } from './TokenomicsSection';
import { FaqSection } from './FaqSection';
import { SocialFooter } from './SocialFooter';
import { TeamSection } from './TeamSection';

import './Home.css';
import '../ui/Navigation.css';

// Компонент с анимацией для секций
interface AnimatedSectionProps {
  children: ReactNode;
  id?: string;
  className?: string;
  delayMultiplier?: number;
}

function AnimatedSection({ children, id, className, delayMultiplier = 0 }: AnimatedSectionProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.05,
    rootMargin: '-20px 0px'
  });

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
        delay: delayMultiplier * 0.05
      }
    }
  };

  return (
    <motion.section
      id={id}
      className={`animated-section ${className || ''}`}
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants}
      layoutId={`section-${id || Math.random().toString(36).substr(2, 9)}`}
    >
      {children}
    </motion.section>
  );
}

function BackgroundVideo() {
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

  if (isMobile) {
    return (
      <div className="global-static-background">
        <div className="mobile-gradient-overlay"></div>
      </div>
    );
  }

  return (
    <div className="global-video-background">
      <video autoPlay muted loop playsInline className="global-background-video">
        <source src="/samurai.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

export function Home() {
  return (
    <div className="home-container">
      <BackgroundVideo />
      <Navigation />
      
      <main className="home-content">
        <HeroSection />
        
        <AnimatedSection delayMultiplier={0.3}>
          <AboutSection />
        </AnimatedSection>
        
        <AnimatedSection delayMultiplier={0.6}>
          <TeamSection />
        </AnimatedSection>

        <AnimatedSection className="features-section" delayMultiplier={0.9}>
          <div className="feature-item">
            <div className="feature-icon">💰</div>
            <h3>Exclusive NFTs</h3>
            <p>Three tiers of rarity, each with unique benefits</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">🔒</div>
            <h3>Security</h3>
            <p>Fully audited and transparent smart contract</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon">👥</div>
            <h3>Community</h3>
            <p>Become part of the growing global Samurai Pepe community</p>
          </div>
          
          <a href="#nft-section" className="explore-nfts-btn">EXPLORE NFTS</a>
        </AnimatedSection>
        
        <AnimatedSection id="nft-section" delayMultiplier={1.2}>
          <NftSection />
        </AnimatedSection>
        
        <AnimatedSection delayMultiplier={1.5}>
          <HowToBuySection />
        </AnimatedSection>
        
        <AnimatedSection delayMultiplier={1.8}>
          <RoadmapSection />
        </AnimatedSection>
        
        <AnimatedSection delayMultiplier={2.1}>
          <TokenomicsSection />
        </AnimatedSection>
        
        <AnimatedSection delayMultiplier={2.4}>
          <FaqSection />
        </AnimatedSection>
      </main>
      
      <SocialFooter />
    </div>
  );
} 