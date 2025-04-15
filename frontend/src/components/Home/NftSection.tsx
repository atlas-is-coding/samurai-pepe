'use client';

import { useState, useEffect, useReducer, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { QuestsWidget } from '../Quests/QuestsWidget';
import { NFTStore } from '../NFT/NFTStore';
import { useSolanaNft } from '@/context/SolanaNftProvider';
import { NftCard } from './NftCard';
import './NftSection.css';
import { PublicKey } from '@solana/web3.js';
import { Transaction } from '@solana/web3.js';
import { toast } from 'react-hot-toast';

// Импортируем стили для кнопок кошелька
import '@solana/wallet-adapter-react-ui/styles.css';

// Обновляем интерфейс для события wallet-connection-change
interface WalletConnectionChangeEvent extends CustomEvent {
  detail: {
    connected: boolean;
    publicKey: string | null;
    connecting?: boolean;
    isRestoredState?: boolean; // добавляем флаг восстановленного состояния
  };
}

interface NftCard {
  title: string;
  description: string;
  supply: number;
  reward: number;
  price: string;
  type: 'common' | 'rare' | 'legendary';
  icon: string;
  videoSrc: string;
  imageSrc: string;
  requirements?: string;
  nftId: string; // Добавляю идентификатор для минтинга
}

// Глобальное объявление типов перенесено в отдельный файл types/global.d.ts

export function NftSection() {
  const [isMobile, setIsMobile] = useState(false);
  
  // Получаем значения из хука useWallet
  const wallet = useWallet();
  
  // Локальное состояние для отслеживания подключения
  const [walletConnected, setWalletConnected] = useState(wallet.connected);
  const [walletPublicKey, setWalletPublicKey] = useState<PublicKey | null>(wallet.publicKey);
  
  // Принудительное обновление компонента
  const [, forceUpdate] = useReducer(x => x + 1, 0);
  
  const { purchaseNFT, isNFT3Available, isLoading } = useSolanaNft();
  
  const [mintStatus, setMintStatus] = useState<{ 
    status: 'idle' | 'loading' | 'success' | 'error',
    nftId: string | null,
    message: string | null 
  }>({
    status: 'idle',
    nftId: null,
    message: null
  });
  
  // Обработчик события изменения состояния кошелька
  useEffect(() => {
    const handleWalletConnectionChange = (event: Event) => {
      const customEvent = event as WalletConnectionChangeEvent;
      
      console.log("NftSection: Received wallet-connection-change event:", customEvent.detail);
      
      if (customEvent.detail) {
        const { connected, publicKey } = customEvent.detail;
        
        // Обновляем локальное состояние
        setWalletConnected(connected);
        
        if (connected && publicKey) {
          try {
            // Преобразуем строку в PublicKey
            const key = new PublicKey(publicKey);
            setWalletPublicKey(key);

            // Если тип кошелька еще не определен, попробуем определить его
            if (typeof window !== 'undefined' && !window.__WALLET_TYPE__) {
              // Проверяем доступные кошельки
              if (window.solana && window.solana.isPhantom && 
                  window.solana.publicKey && window.solana.publicKey.toString() === publicKey) {
                console.log("Detected wallet type: phantom");
                window.__WALLET_TYPE__ = 'phantom';
              } else if (window.solflare && window.solflare.isSolflare && 
                         window.solflare.publicKey && window.solflare.publicKey.toString() === publicKey) {
                console.log("Detected wallet type: solflare");
                window.__WALLET_TYPE__ = 'solflare';
              }
            }
          } catch (e) {
            console.error("Failed to parse public key:", e);
          }
        } else {
          setWalletPublicKey(null);
        }
        
        // Принудительное обновление компонента
        setTimeout(() => {
          forceUpdate();
        }, 50);
      }
    };
    
    // Добавляем слушатель события
    window.addEventListener('wallet-connection-change', handleWalletConnectionChange as EventListener);
    
    // Удаляем слушатель при размонтировании
    return () => {
      window.removeEventListener('wallet-connection-change', handleWalletConnectionChange as EventListener);
    };
  }, []);
  
  // Дополнительная проверка global state при монтировании и через интервал
  useEffect(() => {
    const checkGlobalState = () => {
      if (typeof window !== 'undefined' && window.__WALLET_CONNECTED__ && window.__WALLET_PUBLIC_KEY__) {
        // Обновляем состояние только если оно действительно отличается
        if (window.__WALLET_CONNECTED__ !== walletConnected) {
          console.log("Global wallet state differs from local - updating local");
          setWalletConnected(window.__WALLET_CONNECTED__);
        }
        
        // Обновляем publicKey только если он действительно отличается
        if (window.__WALLET_PUBLIC_KEY__ && 
           (!walletPublicKey || window.__WALLET_PUBLIC_KEY__ !== walletPublicKey.toString())) {
          try {
            const pubKey = new PublicKey(window.__WALLET_PUBLIC_KEY__);
            setWalletPublicKey(pubKey);

            // Проверяем тип кошелька если он еще не определен
            if (!window.__WALLET_TYPE__) {
              // Пытаемся определить тип кошелька
              if (window.solana && window.solana.isPhantom && 
                  window.solana.publicKey && window.solana.publicKey.toString() === window.__WALLET_PUBLIC_KEY__) {
                console.log("Detected wallet type from global state: phantom");
                window.__WALLET_TYPE__ = 'phantom';
              } else if (window.solflare && window.solflare.isSolflare && 
                         window.solflare.publicKey && window.solflare.publicKey.toString() === window.__WALLET_PUBLIC_KEY__) {
                console.log("Detected wallet type from global state: solflare");
                window.__WALLET_TYPE__ = 'solflare';
              }
            }
          } catch (e) {
            console.error("Failed to parse global public key:", e);
          }
        }
      }
    };
    
    // Проверяем сразу при монтировании
    checkGlobalState();
    
    // И устанавливаем интервал с более длительным периодом и только если кошелек не подключен
    // Если кошелек уже подключен, интервал не нужен
    let interval: NodeJS.Timeout | null = null;
    
    if (!walletConnected) {
      // Проверяем только когда кошелек не подключен, чтобы обнаружить подключение
      interval = setInterval(checkGlobalState, 2000); // Увеличиваем интервал до 2 секунд
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [walletConnected, walletPublicKey]);
  
  // Отслеживаем изменения в хуке useWallet - оптимизируем чтобы избежать лишних рендеров
  useEffect(() => {
    // Обновляем состояние только если значения действительно отличаются
    const hookConnected = wallet.connected;
    const hookPublicKey = wallet.publicKey;
    
    let needsUpdate = false;
    
    if (hookConnected !== walletConnected) {
      console.log("Updating walletConnected from hook:", hookConnected);
      setWalletConnected(hookConnected);
      needsUpdate = true;
    }
    
    // Проверяем, отличается ли publicKey
    const currentKeyStr = walletPublicKey?.toString();
    const hookKeyStr = hookPublicKey?.toString();
    if (hookKeyStr !== currentKeyStr) {
      console.log("Updating walletPublicKey from hook:", hookKeyStr);
      setWalletPublicKey(hookPublicKey);
      needsUpdate = true;
    }
    
    // Вызываем forceUpdate только если были изменения
    if (needsUpdate) {
      setTimeout(() => {
        forceUpdate();
      }, 50);
    }
  }, [wallet.connected, wallet.publicKey]);
  
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
  
  // Функция для прямого подключения через поддерживаемые кошельки
  const connectWithWallet = async () => {
    try {
      // Проверяем, что кошелек уже не подключен
      if (!walletConnected && !walletPublicKey) {
        // Пробуем Phantom
        if (typeof window !== 'undefined' && window.solana) {
          console.log("Connecting with Phantom...");
          
          try {
            // Запрашиваем соединение
            await window.solana.connect();
            
            // Получаем публичный ключ
            const phantom = window.solana;
            
            if (phantom.isPhantom && phantom.publicKey) {
              console.log("Connected to Phantom:", phantom.publicKey.toString());
              
              // Обновляем локальное состояние
              setWalletConnected(true);
              setWalletPublicKey(phantom.publicKey);
              
              // Обновляем глобальное состояние
              window.__WALLET_CONNECTED__ = true;
              window.__WALLET_PUBLIC_KEY__ = phantom.publicKey.toString();
              window.__WALLET_TYPE__ = 'phantom'; // Сохраняем тип кошелька
              
              // Принудительно обновляем UI
              forceUpdate();
              return true;
            }
          } catch (error) {
            console.error("Error connecting with Phantom:", error);
          }
        }
        
        // Пробуем Solflare
        if (typeof window !== 'undefined' && window.solflare) {
          console.log("Connecting with Solflare...");
          
          try {
            // Запрашиваем соединение
            await window.solflare.connect();
            
            // Получаем публичный ключ
            const solflare = window.solflare;
            
            if (solflare.isSolflare && solflare.publicKey) {
              console.log("Connected to Solflare:", solflare.publicKey.toString());
              
              // Обновляем локальное состояние
              setWalletConnected(true);
              setWalletPublicKey(solflare.publicKey);
              
              // Обновляем глобальное состояние
              window.__WALLET_CONNECTED__ = true;
              window.__WALLET_PUBLIC_KEY__ = solflare.publicKey.toString();
              window.__WALLET_TYPE__ = 'solflare'; // Сохраняем тип кошелька
              
              // Принудительно обновляем UI
              forceUpdate();
              return true;
            }
          } catch (error) {
            console.error("Error connecting with Solflare:", error);
          }
        }
        
        // Если ни один из кошельков не найден
        alert('Wallet extension not found! Please install Phantom or Solflare extension');
      }
    } catch (error) {
      console.error("Error connecting with wallet:", error);
    }
    
    return false;
  };

  // Обновленная функция для минтинга NFT с поддержкой всех кошельков
  const mintWithWallet = async (nftId: string) => {
    // Проверяем, является ли кошелек подключенным
    if (!walletConnected || !walletPublicKey) {
      // Пробуем подключить
      const connected = await connectWithWallet();
      
      // Проверяем снова после подключения
      if (!connected) {
        toast.error("Please connect your wallet first");
        return;
      }
    }
    
    setMintStatus({
      status: 'loading',
      nftId,
      message: 'Processing...'
    });
    
    try {
      // Вызываем функцию purchaseNFT из контекста
      const success = await purchaseNFT(nftId);
      
      if (success) {
        setMintStatus({
          status: 'success',
          nftId,
          message: 'NFT minted!'
        });
        
        // Сбрасываем статус через 3 секунды
        setTimeout(() => {
          setMintStatus({
            status: 'idle',
            nftId: null,
            message: null
          });
        }, 3000);
      } else {
        setMintStatus({
          status: 'error',
          nftId,
          message: 'Minting Error'
        });
      }
    } catch (error) {
      console.error('Error in mintWithWallet:', error);
      setMintStatus({
        status: 'error',
        nftId,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
  
  // Моковые данные для NFT карточек
  const nftCards: NftCard[] = [
    {
      title: 'Kōjō',
      description: 'Entry-level samurai. Join the legend!',
      supply: 500,
      reward: 100,
      price: '0.5 SOL',
      type: 'common',
      icon: '👻',
      videoSrc: '/kojo-video.mp4',
      imageSrc: '/kojo-image.jpg',
      nftId: 'NFT1'
    },
    {
      title: 'Daimyō',
      description: 'Elite warrior. Power and prestige!',
      supply: 50,
      reward: 500,
      price: '1 SOL',
      type: 'rare',
      icon: '🏯',
      videoSrc: '/daimyo-video.mp4',
      imageSrc: '/daimyo-image.jpg',
      nftId: 'NFT2'
    },
    {
      title: 'Shōgun',
      description: 'Supreme ruler. Absolute power!',
      supply: 10,
      reward: 2500,
      price: '2 SOL',
      type: 'legendary',
      icon: '💀',
      requirements: '1 Kōjō + 1 Daimyō',
      videoSrc: '/shogun-video.mp4',
      imageSrc: '/shogun-image.jpg',
      nftId: 'NFT3'
    }
  ];
  
  // Отладочный вывод при рендере компонента для проверки состояния
  console.log("Rendering NftSection with wallet state:", {
    localConnected: walletConnected,
    localPublicKey: walletPublicKey?.toString(),
    hookConnected: wallet.connected,
    hookPublicKey: wallet.publicKey?.toString(),
    globalConnected: typeof window !== 'undefined' ? window.__WALLET_CONNECTED__ : undefined,
    globalPublicKey: typeof window !== 'undefined' ? window.__WALLET_PUBLIC_KEY__ : undefined 
  });
  
  const refreshWalletState = () => {
    if (typeof window !== 'undefined' && window.__WALLET_CONNECTED__ && window.__WALLET_PUBLIC_KEY__) {
      console.log("Refreshing from global state:", {
        connected: window.__WALLET_CONNECTED__,
        publicKey: window.__WALLET_PUBLIC_KEY__,
        walletType: window.__WALLET_TYPE__ || 'unknown'
      });
      
      setWalletConnected(window.__WALLET_CONNECTED__);
      
      try {
        const pubKey = new PublicKey(window.__WALLET_PUBLIC_KEY__);
        setWalletPublicKey(pubKey);
        
        // Определяем тип кошелька, если он не определен
        if (!window.__WALLET_TYPE__) {
          if (window.solana && window.solana.isPhantom && 
              window.solana.publicKey && window.solana.publicKey.toString() === window.__WALLET_PUBLIC_KEY__) {
            console.log("Setting wallet type during refresh: phantom");
            window.__WALLET_TYPE__ = 'phantom';
          } else if (window.solflare && window.solflare.isSolflare && 
                     window.solflare.publicKey && window.solflare.publicKey.toString() === window.__WALLET_PUBLIC_KEY__) {
            console.log("Setting wallet type during refresh: solflare");
            window.__WALLET_TYPE__ = 'solflare';
          }
        }
        
        forceUpdate();
      } catch (e) {
        console.error("Error parsing public key:", e);
      }
    } else if (wallet.connected && wallet.publicKey) {
      console.log("Refreshing from wallet hook:", {
        connected: wallet.connected,
        publicKey: wallet.publicKey.toString()
      });
      
      setWalletConnected(wallet.connected);
      setWalletPublicKey(wallet.publicKey);
      
      // Определяем тип кошелька
      if (typeof window !== 'undefined' && !window.__WALLET_TYPE__) {
        if (window.solana && window.solana.isPhantom && 
            window.solana.publicKey && window.solana.publicKey.toString() === wallet.publicKey.toString()) {
          console.log("Setting wallet type during refresh from hook: phantom");
          window.__WALLET_TYPE__ = 'phantom';
        } else if (window.solflare && window.solflare.isSolflare && 
                   window.solflare.publicKey && window.solflare.publicKey.toString() === wallet.publicKey.toString()) {
          console.log("Setting wallet type during refresh from hook: solflare");
          window.__WALLET_TYPE__ = 'solflare';
        }
      }
      
      forceUpdate();
    } else {
      console.log("No connected wallet found to refresh from");
    }
  };
  
  return (
    <>
      <section id="nft" className="nft-section">
        <h2>Samurai Pepe NFTs</h2>
        
        <div className="nft-collection-layout">
          <div className="nft-cards-container">
            {nftCards.map((card, index) => (
              <div key={index} className={`nft-card-vertical ${card.type}`}>
                <div className="nft-image-frame">
                  <video 
                    src={card.videoSrc} 
                    autoPlay 
                    loop 
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  >
                    <img src={card.imageSrc} alt={card.title} />
                  </video>
                  
                  {/* Показываем цену NFT внутри карточки */}
                  <div className="nft-price-badge">
                    <span>{card.price}</span>
                  </div>
                </div>
                
                <div className="nft-card-content">
                  <h3>{card.icon} {card.title} <span className="nft-rarity">({card.type === 'common' ? 'Common' : card.type === 'rare' ? 'Rare' : 'Legendary'})</span></h3>
                  
                  <p className="nft-description">{card.description}</p>
                  
                  <div className="nft-stats">
                    <p className="nft-supply">Supply: <span>{card.supply}</span></p>
                    <p className="nft-reward">Reward: <span>{card.reward} $SPPE</span></p>
                    {card.requirements && (
                      <p className="nft-requirements">Requirement: <span>{card.requirements}</span></p>
                    )}
                  </div>
                  
                  <div className="mint-button-container">
                    <button 
                      className={`mint-button ${card.type}`}
                      onClick={() => mintWithWallet(card.nftId)}
                    >
                      {!walletConnected
                        ? 'Connect wallet' 
                        : mintStatus.status === 'loading' && mintStatus.nftId === card.nftId 
                        ? 'Minting...' 
                        : 'MINT'}
                    </button>
                    
                    {mintStatus.nftId === card.nftId && mintStatus.status !== 'idle' && (
                      <div className={`mint-status ${mintStatus.status}`}>
                        {mintStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
} 