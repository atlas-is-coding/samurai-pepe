'use client';

import { useMemo, useEffect, ReactNode } from 'react';
import { ConnectionProvider, WalletProvider, useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { useState } from 'react';
import { Button } from './Button';
import { ReferralButton } from '../Home/ReferralButton';
import { UserStats } from '../Home/UserStats';
import { registerWalletTabsStateChangeCallback } from '../Quests/QuestsWidget';
import { NFTMenu } from '../NFT/NFTMenu';
import { useSolanaNft } from '@/context/SolanaNftProvider';

// Import styles for wallet buttons
import '@solana/wallet-adapter-react-ui/styles.css';

// Configure custom RPC endpoint with higher request limits
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || clusterApiUrl('devnet');

// Get Solana network from environment variables
const NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

// Type definition for props
interface WalletConnectionProviderProps {
  isPulse?: boolean;
  children?: ReactNode;
}

// Create global client component for working with Solana wallet
export function WalletConnectionProvider({ isPulse = true, children }: WalletConnectionProviderProps) {
  // Define Solana network
  const network = useMemo(() => {
    switch (NETWORK) {
      case 'mainnet-beta':
        return WalletAdapterNetwork.Mainnet;
      case 'testnet':
        return WalletAdapterNetwork.Testnet;
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }, []);
  
  // Use custom RPC endpoint or fallback to default
  const endpoint = useMemo(() => RPC_ENDPOINT, []);
  
  // Configure supported wallets - использую только проверенные адаптеры
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new LedgerWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  // Кастомное сообщение для отладки
  useEffect(() => {
    console.log("WalletConnectionProvider initialized with:", {
      network,
      endpoint,
      wallets: wallets.map(w => w.name),
    });
  }, [network, endpoint, wallets]);

  // Используем ConnectionProvider + WalletProvider + WalletModalProvider
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="wallet-header">
            <WalletInfo isPulse={isPulse} />
          </div>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

interface WalletInfoProps {
  isPulse?: boolean;
}

// Компонент, отображающий информацию о кошельке
function WalletInfo({ isPulse = true }: WalletInfoProps) {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ownedNFTs } = useSolanaNft();
  
  // Новое состояние для отображения меню NFT
  const [isNFTMenuVisible, setIsNFTMenuVisible] = useState(false);
  
  // New state for invite code entry
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeSubmitError, setCodeSubmitError] = useState<string | null>(null);
  const [codeSubmitSuccess, setCodeSubmitSuccess] = useState(false);
  // State to track if user was already invited by someone
  const [isAlreadyInvited, setIsAlreadyInvited] = useState(false);

  useEffect(() => {
    // Отправляем событие только при реальных изменениях состояния
    if (typeof window !== 'undefined' && publicKey) {
      console.log("Dispatching wallet-connection-change event with:", {
        connected,
        publicKey: publicKey.toString()
      });
      
      // Небольшая задержка для уверенности, что другие компоненты уже смонтированы
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('wallet-connection-change', {
          detail: { 
            connected, 
            publicKey: publicKey.toString() 
          }
        }));
      }, 100);
    }
  }, [connected, publicKey]);

  // Регистрируем callback для изменения активной вкладки
  useEffect(() => {
    registerWalletTabsStateChangeCallback((tab: string) => {
      if (!isModalVisible) {
        setIsModalVisible(true);
      }
    });
  }, [isModalVisible]);

  // Get wallet balance with error handling and proper refresh interval
  useEffect(() => {
    if (!publicKey || !connection) return;

    let isSubscribed = true;

    const fetchBalance = async () => {
      if (!isSubscribed) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const [balance, blockHeight] = await Promise.all([
          connection.getBalance(publicKey),
          connection.getBlockHeight()
        ]);
        
        if (isSubscribed) {
          setBalance(balance / 1e9); // Convert from lamports to SOL using proper decimal conversion
          console.log(`Balance updated at block height: ${blockHeight}`);
        }
      } catch (e) {
        console.error('Error fetching balance:', e);
        if (isSubscribed) {
          setError('Failed to fetch balance. Please try again later.');
          setBalance(null);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchBalance();

    // Subscribe to account changes
    const subscriptionId = connection.onAccountChange(
      publicKey,
      () => {
        if (isSubscribed) {
          fetchBalance();
        }
      },
      'confirmed'
    );

    // Оповещаем остальные компоненты о подключении кошелька
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wallet-connection-change', {
        detail: { connected, publicKey: publicKey.toString() }
      }));
    }

    // Cleanup subscription
    return () => {
      isSubscribed = false;
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [publicKey, connection, connected]);

  // Separate function to check user invitation status
  useEffect(() => {
    if (!publicKey) return;

    const checkInvitationStatus = async () => {
      try {
        const response = await fetch(`/api/user-status?walletAddress=${publicKey.toString()}`);
        
        if (response.ok) {
          const data = await response.json();
          setIsAlreadyInvited(!!data.referredBy); // Convert to boolean
        }
      } catch (e) {
        console.error('Error checking invite status:', e);
      }
    };
    
    checkInvitationStatus();
  }, [publicKey]);

  // Shorten wallet address for display
  const shortenAddress = (address: string | null): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };
  
  // Функция для открытия модального окна выбора кошелька
  const handleConnectClick = () => {
    // Находим кнопку кошелька и программно кликаем на неё
    const walletButton = document.querySelector('.wallet-adapter-button-trigger');
    if (walletButton instanceof HTMLElement) {
      walletButton.click();
    }
  };

  // Открытие модального окна
  const openModal = () => {
    setIsModalVisible(true);
  };

  // Закрытие модального окна
  const closeModal = () => {
    setIsModalVisible(false);
  };

  // Обработка клавиши Escape для закрытия модального окна
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalVisible) {
        closeModal();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalVisible]);
  
  // Handler for submitting an invite code
  const handleSubmitInviteCode = async () => {
    if (!connected || !publicKey) return;
    if (!inviteCode || inviteCode.length !== 6) {
      setCodeSubmitError('Please enter a valid 6-digit invite code');
      return;
    }
    
    setIsSubmittingCode(true);
    setCodeSubmitError(null);
    setCodeSubmitSuccess(false);
    
    try {
      const response = await fetch('/api/invite', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          inviteCode
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply invite code');
      }
      
      setInviteCode('');
      setCodeSubmitSuccess(true);
      
      // Set status immediately to avoid waiting for the refresh interval
      setIsAlreadyInvited(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setCodeSubmitSuccess(false);
      }, 3000);
      
    } catch (err) {
      setCodeSubmitError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Function to clear all cookies
  const clearAllCookies = () => {
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  };

  // Toggle NFT menu visibility
  const toggleNFTMenu = () => {
    setIsNFTMenuVisible(!isNFTMenuVisible);
    
    // Закрываем модальное окно, если оно открыто
    if (isModalVisible) {
      setIsModalVisible(false);
    }
  };

  // В специальном эффекте для оповещения других компонентов о состоянии кошелька добавим сохранение состояния
  useEffect(() => {
    // Отправляем событие только если есть данные
    if (typeof window !== 'undefined') {
      console.log("WalletProvider: Wallet connection state:", { 
        connected, 
        publicKey: publicKey?.toString(),
        connecting
      });
      
      // Всегда отправляем событие при изменении состояния
      setTimeout(() => {
        try {
          const eventData = { 
            connected, 
            publicKey: publicKey?.toString() || null,
            connecting
          };
          
          console.log("Dispatching wallet-connection-change event with data:", eventData);
          
          window.dispatchEvent(new CustomEvent('wallet-connection-change', {
            detail: eventData
          }));
          
          // Также устанавливаем глобальную переменную
          window.__WALLET_CONNECTED__ = connected && !!publicKey;
          window.__WALLET_PUBLIC_KEY__ = publicKey?.toString() || null;
          window.__WALLET_CONNECTING__ = connecting;
        } catch (e) {
          console.error("Error setting global wallet vars:", e);
        }
      }, 100);
    }
  }, [connected, publicKey, connecting]);

  if (!connected) {
    return (
      <div className="wallet-connect-wrapper">
        {/* Our custom button */}
        <Button 
          className="connect-wallet-btn" 
          onClick={handleConnectClick}
          isPulse={isPulse}
        >
          {connecting ? 'ПОДКЛЮЧЕНИЕ...' : 'CONNECT WALLET'}
        </Button>
        
        {/* Original wallet connection button (hidden) */}
        <div className="hidden-wallet-button">
          <WalletMultiButton />
        </div>
        
        {/* Styles for hiding the original button */}
        <style jsx>{`
          .wallet-connect-wrapper {
            position: relative;
          }
          .hidden-wallet-button {
            position: absolute;
            width: 0;
            height: 0;
            opacity: 0;
            overflow: hidden;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="wallet-connected">
        <Button 
          className="connect-wallet-btn" 
          onClick={openModal}
        >
          {shortenAddress(publicKey?.toBase58() || null)}
        </Button>
        
        {/* Модальное окно с информацией о кошельке */}
        {isModalVisible && (
          <div className="wallet-modal-overlay" onClick={closeModal}>
            <div className="wallet-modal" onClick={e => e.stopPropagation()}>
              <div className="wallet-modal-header">
                <button className="wallet-modal-close" onClick={closeModal}>×</button>
              </div>
              
              <div className="wallet-modal-content">
                <div className="wallet-info-tab">
                  <div className="menu-section">
                    <div className="menu-item">
                      <span className="menu-title">Address:</span>
                      <span className="menu-value">{publicKey?.toString()}</span>
                    </div>
                    <div className="menu-item">
                      <span className="menu-title">Balance:</span>
                      {isLoading ? (
                        <span className="menu-value">Loading...</span>
                      ) : error ? (
                        <span className="menu-value error">{error}</span>
                      ) : (
                        <span className="menu-value">{balance !== null ? balance.toFixed(4) : '0'} SOL</span>
                      )}
                    </div>
                    
                    {/* User statistics information */}
                    <UserStats />
                    
                    {/* Invite code input section - only show if not already invited */}
                    {!isAlreadyInvited ? (
                      <div className="menu-item invite-code-section">
                        <span className="menu-title">Enter Invite Code:</span>
                        <div className="invite-code-input-container">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="6-digit code"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value.trim())}
                            className="invite-code-input"
                          />
                          <Button 
                            onClick={handleSubmitInviteCode}
                            disabled={isSubmittingCode || !inviteCode || inviteCode.length !== 6}
                            className="submit-code-button"
                          >
                            {isSubmittingCode ? 'Submitting...' : 'Submit'}
                          </Button>
                        </div>
                        {codeSubmitError && <div className="code-error">{codeSubmitError}</div>}
                        {codeSubmitSuccess && <div className="code-success">Invite code applied successfully!</div>}
                      </div>
                    ) : (
                      <div className="menu-item">
                        <span className="menu-title">Invite Status:</span>
                        <span className="menu-value invited-status">Already invited</span>
                      </div>
                    )}
                    
                    {/* Button to get referral link */}
                    <ReferralButton className="menu-item" />
                    
                    {/* Disconnect button */}
                    <div className="menu-item">
                      <Button 
                        onClick={() => {
                          clearAllCookies();
                          disconnect();
                          closeModal();
                        }}
                        className="disconnect-wallet-btn"
                      >
                        Disconnect Wallet
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Выпадающее меню с NFT */}
        <NFTMenu isVisible={isNFTMenuVisible} />
      </div>
      
      <style jsx>{`
        .wallet-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .wallet-connected {
          display: flex;
          align-items: center;
        }
        
        .wallet-address {
          background: rgba(0, 0, 0, 0.2);
          padding: 8px 16px;
          border-radius: 50px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s ease;
          border: 1px solid #444;
        }
        
        .wallet-address:hover {
          background: rgba(0, 0, 0, 0.4);
        }
        
        .disconnect-wallet-btn {
          width: 100%;
          margin-top: 10px;
        }
        
        .wallet-modal {
          background: var(--dark-accent);
          border-radius: 15px;
          width: 95%;
          max-width: 650px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.7);
          border: 2px solid var(--primary);
        }
        
        .wallet-modal-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 25px 30px;
          border-bottom: 2px solid rgba(255, 215, 0, 0.4);
        }
        
        .wallet-modal-close {
          background: none;
          border: none;
          color: var(--primary);
          font-size: 32px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }
        
        .wallet-modal-content {
          padding: 30px;
        }
        
        .wallet-info-tab {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }
        
        .menu-section {
          max-height: 500px;
          overflow-y: auto;
          margin-bottom: 22px;
        }
        
        .menu-item {
          display: flex;
          justify-content: space-between;
          padding: 18px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
          word-break: break-all;
          font-size: 17px;
          margin-bottom: 5px;
        }
        
        .menu-title {
          font-weight: 600;
          min-width: 120px;
          color: var(--primary);
          font-size: 17px;
        }
        
        .menu-value {
          color: white;
          text-align: right;
          flex: 1;
          margin-left: 20px;
          font-size: 16px;
        }
        
        .invite-code-section {
          flex-direction: column;
          align-items: stretch;
          gap: 15px;
        }
        
        .invite-code-input-container {
          display: flex;
          gap: 18px;
        }
        
        .invite-code-input {
          flex: 1;
          padding: 15px 18px;
          background: rgba(255, 255, 255, 0.12);
          border: 2px solid rgba(255, 215, 0, 0.4);
          border-radius: 8px;
          color: white;
          font-family: 'Orbitron', sans-serif;
          letter-spacing: 2px;
          text-align: center;
          font-size: 1.2rem;
        }
        
        .submit-code-button {
          padding: 15px 18px;
          min-width: 140px;
          font-size: 17px;
        }
        
        .code-error {
          color: #ff5555;
          font-size: 1rem;
          margin-top: 8px;
        }
        
        .code-success {
          color: #51ff00;
          font-size: 1rem;
          margin-top: 8px;
        }
        
        .error {
          color: #ff4d4d;
        }
        
        .invited-status {
          color: #51ff00;
          font-weight: bold;
        }
      `}</style>
      
      <style jsx global>{`
        .wallet-header {
          position: fixed;
          top: 0;
          right: 20px;
          z-index: 100;
          display: flex;
          align-items: center;
          height: 60px;
        }
        
        /* Глобальные стили для увеличения размера выпадающего меню */
        .wallet-adapter-dropdown-list {
          min-width: 320px !important;
          padding: 20px !important;
          grid-row-gap: 18px !important;
        }
        
        .wallet-adapter-dropdown-list-item {
          height: 55px !important;
          font-size: 18px !important;
          padding: 0 30px !important;
          border-radius: 8px !important;
        }
      `}</style>
    </>
  );
}

// Добавляем глобальные типы для TypeScript
declare global {
  interface Window {
    __WALLET_CONNECTED__?: boolean;
    __WALLET_PUBLIC_KEY__?: string | null;
    __WALLET_CONNECTING__?: boolean;
  }
}