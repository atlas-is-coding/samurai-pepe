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
import { useQuests } from '@/components/Quests/QuestsProvider';
import { QuestServices } from '@/components/Quests/QuestServices';
import { toast } from 'react-hot-toast';

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
  const { publicKey, sendTransaction, connected, select, disconnect, wallets, connecting } = useWallet();
  const [walletConnected, setWalletConnected] = useState(connected);
  const [localPublicKeyString, setLocalPublicKey] = useState<string>(publicKey?.toString() || '');
  
  useEffect(() => {
    setWalletConnected(connected);
    if (publicKey?.toString() !== localPublicKeyString) {
      setLocalPublicKey(publicKey?.toString() || '');
    }
  }, [connected, publicKey, localPublicKeyString]);

  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ownedNFTs, totalPoints } = useSolanaNft();
  const { quests, completeQuest, isQuestActive, isQuestCompleted } = useQuests();
  
  // Новое состояние для отображения меню NFT
  const [isNFTMenuVisible, setIsNFTMenuVisible] = useState(false);
  
  // State for invite code entry
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [codeSubmitError, setCodeSubmitError] = useState<string | null>(null);
  const [codeSubmitSuccess, setCodeSubmitSuccess] = useState(false);
  // State to track if user was already invited by someone
  const [isAlreadyInvited, setIsAlreadyInvited] = useState(false);
  
  // Дополняем состояние для работы с никнеймом
  const [nickname, setNickname] = useState('');
  const [isSubmittingNickname, setIsSubmittingNickname] = useState(false);
  const [nicknameSubmitSuccess, setNicknameSubmitSuccess] = useState(false);
  const [nicknameSubmitError, setNicknameSubmitError] = useState<string | null>(null);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState<'profile' | 'quests'>('profile');
  
  // Добавляем состояние для активной вкладки квеста
  const [activeQuest, setActiveQuest] = useState<number | null>(null);
  
  // Добавляем состояние для отображения/скрытия инвайт-кода
  const [userInviteCode, setUserInviteCode] = useState<string | null>(null);
  const [isLoadingInviteCode, setIsLoadingInviteCode] = useState(false);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  // State for invitation stats
  const [referralStats, setReferralStats] = useState<{
    count: number;
    points: number;
  } | null>(null);

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
    setActiveQuest(null);
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
  
  // Добавляем функцию для сохранения никнейма в базу данных
  const handleSaveNickname = async () => {
    if (!connected || !publicKey) return;
    if (!nickname.trim()) {
      setNicknameSubmitError('Please enter a nickname');
      return;
    }
    
    setIsSubmittingNickname(true);
    setNicknameSubmitError(null);
    setNicknameSubmitSuccess(false);
    
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          nickname: nickname.trim()
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save nickname');
      }
      
      setNicknameSubmitSuccess(true);
      
      // Сбрасываем сообщение об успехе через 3 секунды
      setTimeout(() => {
        setNicknameSubmitSuccess(false);
      }, 3000);
      
    } catch (err) {
      setNicknameSubmitError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmittingNickname(false);
    }
  };

  // Модифицируем существующий обработчик реферального кода
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
      
      // Устанавливаем статус сразу, чтобы не ждать интервала обновления
      setIsAlreadyInvited(true);
      
      // Сбрасываем сообщение об успехе через 3 секунды
      setTimeout(() => {
        setCodeSubmitSuccess(false);
      }, 3000);
      
    } catch (err) {
      setCodeSubmitError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Function to explicitly set wallet type cookie
  function setWalletTypeCookie(walletType: string | undefined) {
    if (walletType) {
      console.log(`Setting wallet type cookie to: ${walletType}`);
      document.cookie = `walletType=${walletType};path=/;max-age=86400`; // 24 hours expiry
    } else {
      console.log('Clearing wallet type cookie');
      document.cookie = "walletType=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  }

  /**
   * Clears all cookies from the document
   */
  function clearAllCookies() {
    console.log("🍪 Clearing all cookies");
    const cookies = document.cookie.split(";");
    
    // Log existing cookies for debugging
    console.log("Existing cookies:", cookies);
    
    // Check specifically for walletType cookie
    const walletTypeCookie = cookies.find(c => c.trim().startsWith("walletType="));
    if (walletTypeCookie) {
      console.log("Found walletType cookie:", walletTypeCookie);
    }
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      console.log(`Removing cookie: ${name}`);
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      
      // Also try with domain parameter to ensure cookie is removed
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    }
    
    // Set wallet type cookie directly based on detected type
    if (window.__WALLET_TYPE__) {
      console.log(`Setting wallet type cookie directly to: ${window.__WALLET_TYPE__}`);
      document.cookie = `walletType=${window.__WALLET_TYPE__};path=/`;
    }
    
    console.log("🍪 All cookies cleared");
  }

  // Добавляем константу для задержки повторных проверок
  const PHANTOM_RECONNECT_DELAY = 1000; // 1 секунда

  // Handler for Solflare disconnect
  const handleSolflareDisconnect = () => {
    console.log('[WalletProvider] Solflare wallet disconnected');
    resetWalletState();
  };

  // Handler for Solflare account change
  const handleSolflareAccountChanged = (newPublicKey: { toString: () => string } | null) => {
    console.log('[WalletProvider] Solflare account changed:', newPublicKey);
    
    if (!newPublicKey) {
      resetWalletState();
      return;
    }
    
    const newKeyString = newPublicKey.toString();
    setLocalPublicKey(newKeyString);
    window.__WALLET_PUBLIC_KEY__ = newKeyString;
    localStorage.setItem('walletPublicKey', newKeyString);
    
    // Force NFT refresh when account changes
    window.forceNftRefresh = true;
    
    // Dispatch account change event
    window.dispatchEvent(new CustomEvent('wallet-connection-change', {
      detail: { publicKey: newKeyString, walletType: 'solflare' }
    }));
  };

  const connectPhantom = async () => {
    try {
      setIsLoading(true);
      window.__WALLET_CONNECTING__ = true;
      
      // First check if Solflare is available and properly initialized
      if (window.solflare && window.solflare.isSolflare) {
        // User has Solflare extension
        console.log('[WalletProvider] Detected Solflare wallet, using appropriate connection');
        try {
          // Similar pattern to Phantom connection but for Solflare
          if (window.solflare.isConnected) {
            console.log('[WalletProvider] Solflare already connected, getting public key');
            const publicKey = window.solflare.publicKey?.toString();
            
            if (publicKey) {
              console.log(`[WalletProvider] Solflare already connected with public key: ${publicKey}`);
              setLocalPublicKey(publicKey);
              window.__WALLET_PUBLIC_KEY__ = publicKey;
              window.__WALLET_CONNECTED__ = true;
              window.__WALLET_TYPE__ = 'solflare';
              localStorage.setItem('walletType', 'solflare');
              localStorage.setItem('walletPublicKey', publicKey);
              
              // Set wallet type cookie explicitly
              setWalletTypeCookie('solflare');
              
              setWalletConnected(true);
              
              // Add Solflare event listeners
              window.solflare?.on?.('disconnect', handleSolflareDisconnect);
              window.solflare?.on?.('accountChanged', handleSolflareAccountChanged);
              
              // Dispatch connection event
              window.dispatchEvent(new CustomEvent('wallet-connection-change', {
                detail: { publicKey, connected: true, walletType: 'solflare' }
              }));
              
              setIsLoading(false);
              window.__WALLET_CONNECTING__ = false;
              return;
            }
          }
          
          // Connect to Solflare
          const response = await window.solflare.connect();
          const responsePublicKey = response.publicKey.toString();
          console.log(`[WalletProvider] Connected to Solflare with public key: ${responsePublicKey}`);
          
          setLocalPublicKey(responsePublicKey);
          window.__WALLET_PUBLIC_KEY__ = responsePublicKey;
          window.__WALLET_CONNECTED__ = true;
          window.__WALLET_TYPE__ = 'solflare';
          localStorage.setItem('walletType', 'solflare');
          localStorage.setItem('walletPublicKey', responsePublicKey);
          
          // Set wallet type cookie explicitly
          setWalletTypeCookie('solflare');
          
          window.forceNftRefresh = true;
          setWalletConnected(true);
          
          // Add Solflare event listeners
          window.solflare?.on?.('disconnect', handleSolflareDisconnect);
          window.solflare?.on?.('accountChanged', handleSolflareAccountChanged);
          
          // Dispatch connection event
          window.dispatchEvent(new CustomEvent('wallet-connection-change', {
            detail: { publicKey: responsePublicKey, connected: true, walletType: 'solflare' }
          }));
          
          setIsLoading(false);
          window.__WALLET_CONNECTING__ = false;
          return;
        } catch (error) {
          console.error('[WalletProvider] Error connecting to Solflare:', error);
          toast.error('Error connecting to Solflare');
          // Continue to try Phantom if Solflare fails
        }
      }
      
      // Original Phantom connection code
      // Проверяем наличие Phantom в окне
      if (!window.solana || !window.solana.isPhantom) {
        toast.error('No compatible wallet found. Please install Phantom or Solflare wallet extension.');
        setIsLoading(false);
        window.__WALLET_CONNECTING__ = false;
        return;
      }
      
      console.log('[WalletProvider] Connecting to Phantom wallet...');
      
      // Проверка, если кошелек уже подключен
      if (window.solana.isConnected) {
        console.log('[WalletProvider] Phantom already connected, getting public key');
        const publicKey = window.solana.publicKey?.toString();
        
        if (publicKey) {
          console.log(`[WalletProvider] Phantom already connected with public key: ${publicKey}`);
          setLocalPublicKey(publicKey.toString());
          window.__WALLET_PUBLIC_KEY__ = publicKey;
          window.__WALLET_CONNECTED__ = true;
          window.__WALLET_TYPE__ = 'phantom';
          window.phantomInitialized = true;
          localStorage.setItem('walletType', 'phantom');
          localStorage.setItem('walletPublicKey', publicKey);
          
          // Set wallet type cookie explicitly
          setWalletTypeCookie('phantom');
          
          setWalletConnected(true);
          
          // Диспетчеризация события подключения кошелька
          const event = new CustomEvent('phantom-connected', {
            detail: { publicKey, retryCount: 0 }
          });
          window.dispatchEvent(event);
          
          setIsLoading(false);
          window.__WALLET_CONNECTING__ = false;
          return;
        }
      }
      
      // Подключаемся, если кошелек не подключен или публичный ключ не доступен
      const response = await window.solana.connect();
      const responsePublicKey = response.publicKey.toString();
      console.log(`[WalletProvider] Connected to Phantom with public key: ${responsePublicKey}`);
      
      setLocalPublicKey(responsePublicKey);
      window.__WALLET_PUBLIC_KEY__ = responsePublicKey;
      window.__WALLET_CONNECTED__ = true;
      window.__WALLET_TYPE__ = 'phantom';
      window.phantomInitialized = true;
      localStorage.setItem('walletType', 'phantom');
      localStorage.setItem('walletPublicKey', responsePublicKey);
      
      // Set wallet type cookie explicitly
      setWalletTypeCookie('phantom');
      
      // Явно устанавливаем флаг forceNftRefresh для Phantom
      window.forceNftRefresh = true;
      window.phantomSpecificUpdate = true;
      
      setWalletConnected(true);
      
      // Диспетчеризация события подключения кошелька
      const connectEvent = new CustomEvent('phantom-connected', {
        detail: { publicKey: responsePublicKey, retryCount: 0 }
      });
      window.dispatchEvent(connectEvent);
      
      // Добавляем обработчики событий Phantom
      window.solana?.on?.('disconnect', handlePhantomDisconnect);
      window.solana?.on?.('accountChanged', handlePhantomAccountChanged);
      
      setIsLoading(false);
      window.__WALLET_CONNECTING__ = false;
    } catch (error) {
      console.error('[WalletProvider] Error connecting to Phantom:', error);
      toast.error('Ошибка подключения к Phantom');
      setWalletConnected(false);
      setIsLoading(false);
      window.__WALLET_CONNECTING__ = false;
      window.__WALLET_CONNECTED__ = false;
      window.__WALLET_PUBLIC_KEY__ = null;
    }
  };

  // Обработчик отключения Phantom
  const handlePhantomDisconnect = () => {
    console.log('[WalletProvider] Phantom wallet disconnected');
    resetWalletState();
  };

  // Обработчик изменения аккаунта в Phantom
  const handlePhantomAccountChanged = (newPublicKey: { toString: () => string } | null) => {
    console.log('[WalletProvider] Phantom account changed:', newPublicKey);
    
    if (!newPublicKey) {
      resetWalletState();
      return;
    }
    
    const newKeyString = newPublicKey.toString();
    setLocalPublicKey(newKeyString);
    window.__WALLET_PUBLIC_KEY__ = newKeyString;
    localStorage.setItem('walletPublicKey', newKeyString);
    
    // Принудительное обновление NFT при смене аккаунта
    window.forceNftRefresh = true;
    window.phantomSpecificUpdate = true;
    
    // Диспетчеризация события изменения аккаунта
    const event = new CustomEvent('phantom-account-changed', {
      detail: { publicKey: newKeyString }
    });
    window.dispatchEvent(event);
  };

  /**
   * Resets wallet state and clears all related data
   */
  const resetWalletState = () => {
    // Очищаем все куки
    clearAllCookies();
    window.__WALLET_CONNECTED__ = false;
    window.__WALLET_CONNECTING__ = false;
    window.__WALLET_PUBLIC_KEY__ = null;
    window.__WALLET_TYPE__ = undefined;
    window.phantomInitialized = false;
    
    // Сбрасываем переменные, связанные с NFT
    window.lastSuccessfulNftCheck = undefined;
    window.forceNftRefresh = false;
    window.nftUpdateAttempts = 0;
    window.phantomSpecificUpdate = false;
    
    // Отправляем событие об отключении кошелька
    const event = new CustomEvent('walletDisconnected');
    window.dispatchEvent(event);
    
    // Очистка localStorage
    localStorage.removeItem('walletType');
    localStorage.removeItem('walletPublicKey');
    localStorage.removeItem("walletName");
    localStorage.removeItem("autoConnect");
    localStorage.removeItem("wallet");
    
    // Очищаем наши кастомные записи в localStorage
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletState");
    localStorage.removeItem("walletConnection");
    
    // Clear any wallet adapter states in localStorage
    Object.keys(localStorage)
      .filter(key => key.startsWith("wallet-adapter") || key.includes("wallet"))
      .forEach(key => localStorage.removeItem(key));
    
    // Удаляем обработчики Phantom, если они были зарегистрированы
    if (window.solana && window.__WALLET_TYPE__ === 'phantom') {
      try {
        window.solana.off?.('disconnect', handlePhantomDisconnect);
        window.solana.off?.('accountChanged', handlePhantomAccountChanged);
      } catch (e) {
        console.error('[WalletProvider] Error removing Phantom event listeners:', e);
      }
    }
    
    // Remove Solflare event listeners if they were registered
    if (window.solflare && window.__WALLET_TYPE__ === 'solflare') {
      try {
        window.solflare.off?.('disconnect', handleSolflareDisconnect);
        window.solflare.off?.('accountChanged', handleSolflareAccountChanged);
      } catch (e) {
        console.error('[WalletProvider] Error removing Solflare event listeners:', e);
      }
    }
    
    // Сбрасываем внутреннее состояние
    setWalletConnected(false);
    setLocalPublicKey('');
    
    console.log("🔄 Wallet state reset complete");
    
    // Dispatch custom event to notify components about wallet reset
    window.dispatchEvent(new CustomEvent("walletStateReset"));
    window.dispatchEvent(new CustomEvent("wallet-connection-change", {
      detail: { 
        connected: false, 
        publicKey: null,
        connecting: false,
        reset: true,
        walletType: undefined
      }
    }));
    
    // Перезагрузка страницы для полного сброса состояния
    window.location.reload();
  };

  /**
   * Запускает принудительное обновление данных NFT.
   * Вызывается при подключении кошелька и при необходимости обновить данные.
   */
  function forceNftUpdate() {
    if (typeof window !== 'undefined') {
      console.log("Forcing NFT update...");
      
      // Устанавливаем флаг принудительного обновления
      window.forceNftRefresh = true;
      
      // Принудительно очищаем кэш последней проверки NFT
      window.lastSuccessfulNftCheck = undefined;
      
      // Увеличиваем счетчик попыток
      window.nftUpdateAttempts = (window.nftUpdateAttempts || 0) + 1;
      
      // Отправляем событие для обновления NFT
      window.dispatchEvent(new CustomEvent("forceNftUpdate"));
      
      // Отправляем дополнительное событие для Phantom
      if (window.__WALLET_TYPE__ === 'phantom') {
        console.log("Dispatching additional phantom-specific NFT update");
        window.phantomSpecificUpdate = true;
        
        window.dispatchEvent(new CustomEvent("phantom-connected", {
          detail: {
            publicKey: window.__WALLET_PUBLIC_KEY__,
            retryCount: window.nftUpdateAttempts || 0,
            forceUpdate: true
          }
        }));
      }
      
      // Отправляем событие wallet-connection-change для поддержки компонентов,
      // которые слушают это событие для обновления NFT
      window.dispatchEvent(new CustomEvent("wallet-connection-change", {
        detail: {
          connected: true,
          publicKey: window.__WALLET_PUBLIC_KEY__,
          connecting: false,
          walletType: window.__WALLET_TYPE__,
          forceUpdate: true
        }
      }));
      
      console.log("NFT update request sent. Attempt:", window.nftUpdateAttempts);
      
      // Добавляем повторную отправку события с небольшой задержкой
      // Это помогает в случаях, когда SolanaNftProvider не успел подписаться на события
      setTimeout(() => {
        if (window.__WALLET_CONNECTED__) {
          console.log("Sending delayed NFT update event...");
          window.dispatchEvent(new CustomEvent("forceNftUpdate"));
        }
      }, 1000);
    }
  }

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
      
      // Определяем тип подключенного кошелька
      const detectWalletType = (): "phantom" | "solflare" | undefined => {
        console.log("Detecting wallet type...");
        console.log("Solflare detected?", !!window.solflare?.isSolflare);
        console.log("Phantom detected?", !!window.solana?.isPhantom);
        
        // Check if both wallets are detected, log details for debugging
        if (window.solflare?.isSolflare && window.solana?.isPhantom) {
          console.log("WARNING: Both Solflare and Phantom detected");
          console.log("Solflare connected?", window.solflare?.isConnected);
          console.log("Phantom connected?", window.solana?.isConnected);
          
          // If both are detected, check which one is actually connected
          if (window.solflare?.isConnected && !window.solana?.isConnected) {
            console.log("Solflare is connected but Phantom is not - using Solflare");
            return "solflare";
          } else if (!window.solflare?.isConnected && window.solana?.isConnected) {
            console.log("Phantom is connected but Solflare is not - using Phantom");
            return "phantom";
          } else if (window.solflare?.isConnected && window.solana?.isConnected) {
            console.log("BOTH wallets report as connected - prioritizing Solflare");
            return "solflare";
          }
          
          // If neither is connected, prioritize Solflare
          console.log("Neither wallet is connected - prioritizing Solflare based on detection");
        }
        
        if (window.solflare?.isSolflare) {
          console.log("Selecting Solflare wallet");
          return "solflare";
        } else if (window.solana?.isPhantom) {
          console.log("Selecting Phantom wallet");
          return "phantom";
        }
        
        console.log("No wallet detected");
        return undefined;
      };
      
      // Если кошелек подключен, сохраняем его тип в глобальную переменную
      if (connected && publicKey) {
        const walletType = detectWalletType();
        window.__WALLET_TYPE__ = walletType;
        console.log(`Detected wallet type: ${walletType}`);
        
        // Set wallet type cookie
        setWalletTypeCookie(walletType);
        
        // Особая обработка для Phantom кошелька
        if (walletType === 'phantom') {
          // Проверяем, совпадает ли publicKey от хука с publicKey от Phantom
          const phantomPublicKey = window.solana?.publicKey?.toString();
          if (phantomPublicKey && phantomPublicKey !== publicKey.toString()) {
            console.warn('Public key mismatch between useWallet and Phantom:', {
              useWallet: publicKey.toString(),
              phantom: phantomPublicKey
            });
            
            // Если ключи отличаются, отправим специальное событие для Phantom
            window.dispatchEvent(new CustomEvent('phantomKeyMismatch', {
              detail: { 
                useWalletKey: publicKey.toString(),
                phantomKey: phantomPublicKey
              }
            }));
          }
        }
        
        // Сохраняем информацию в localStorage для персистентности между перезагрузками
        try {
          localStorage.setItem('walletType', walletType || '');
          localStorage.setItem('walletConnected', 'true');
          localStorage.setItem('walletPublicKey', publicKey.toString());
          
          // Устанавливаем флаг принудительного обновления NFT
          window.forceNftRefresh = true;
          // Сбрасываем счетчик попыток обновления NFT
          window.nftUpdateAttempts = 0;
        } catch (e) {
          console.error("Error saving wallet info to localStorage:", e);
        }
      }
      
      // Обновляем глобальные переменные немедленно
      window.__WALLET_CONNECTED__ = connected && !!publicKey;
      window.__WALLET_PUBLIC_KEY__ = publicKey?.toString() || null;
      window.__WALLET_CONNECTING__ = connecting;
      
      // Отправляем событие сразу и без таймаута для более быстрой синхронизации
      try {
        const eventData = { 
          connected, 
          publicKey: publicKey?.toString() || null,
          connecting,
          walletType: window.__WALLET_TYPE__,
          // Добавляем информацию для обработчиков о том, является ли это 
          // первым подключением или повторным 
          firstConnection: !window.lastSuccessfulNftCheck,
          // Добавляем информацию о Phantom кошельке если он доступен
          phantomPublicKey: window.solana?.publicKey?.toString()
        };
        
        console.log("Dispatching wallet-connection-change event with data:", eventData);
        
        // Отправляем событие wallet-connection-change для других компонентов
        window.dispatchEvent(new CustomEvent('wallet-connection-change', {
          detail: eventData
        }));
        
        // Также отправляем второе событие для более широкой совместимости
        // Это поможет компонентам, которые подписаны на другие события
        window.dispatchEvent(new CustomEvent('walletConnectionChanged', {
          detail: eventData
        }));
        
        // Для Phantom кошелька отправляем дополнительное событие
        if (window.__WALLET_TYPE__ === 'phantom') {
          console.log('Dispatching phantom-connected event');
          window.dispatchEvent(new CustomEvent('phantom-connected', {
            detail: eventData
          }));
          
          // Немного позже запустим принудительное обновление NFT
          setTimeout(() => {
            if (connected && publicKey) {
              console.log('Triggering delayed NFT refresh for Phantom wallet');
              forceNftUpdate();
            }
          }, 2500);
        }
      } catch (e) {
        console.error("Error dispatching wallet events:", e);
      }
    }
  }, [connected, publicKey, connecting]);

  // Добавляем эффект для отслеживания состояния подключения кошелька
  useEffect(() => {
    // Проверяем тип кошелька по localStorage при загрузке
    const savedWalletType = localStorage.getItem('walletType');
    const savedPublicKey = localStorage.getItem('walletPublicKey');
    
    if (savedWalletType && savedPublicKey) {
      console.log(`[WalletProvider] Detected saved wallet: ${savedWalletType} with key: ${savedPublicKey}`);
      window.__WALLET_TYPE__ = savedWalletType as "phantom" | "solflare";
      
      // Автоматически пытаемся переподключиться к Phantom при загрузке, если был сохранен
      if (savedWalletType === 'phantom' && window.solana && window.solana.isPhantom) {
        // Phantom reconnection code (existing)
        // ... existing code ...
      }
      // Auto reconnect to Solflare if it was the last used wallet
      else if (savedWalletType === 'solflare' && window.solflare && window.solflare.isSolflare) {
        // Use setTimeout to allow for wallet initialization
        setTimeout(async () => {
          try {
            // If Solflare is already connected, use the current key
            if (window.solflare?.isConnected && window.solflare?.publicKey) {
              const currentSolflareKey = window.solflare.publicKey.toString();
              
              // Check if saved key matches current key
              if (currentSolflareKey !== savedPublicKey) {
                console.log('[WalletProvider] Detected Solflare key mismatch:', {
                  saved: savedPublicKey,
                  current: currentSolflareKey
                });
                
                // Update state to current Solflare value
                setLocalPublicKey(currentSolflareKey);
                window.__WALLET_PUBLIC_KEY__ = currentSolflareKey;
                localStorage.setItem('walletPublicKey', currentSolflareKey);
              }
              
              // Consider Solflare connected
              setWalletConnected(true);
              window.__WALLET_CONNECTED__ = true;
              window.__WALLET_TYPE__ = 'solflare';
              
              // Add Solflare event listeners
              window.solflare.on?.('disconnect', handleSolflareDisconnect);
              window.solflare.on?.('accountChanged', handleSolflareAccountChanged);
              
              // Trigger NFT refresh
              window.forceNftRefresh = true;
              
              // Dispatch connection event
              window.dispatchEvent(new CustomEvent('wallet-connection-change', {
                detail: { publicKey: currentSolflareKey, walletType: 'solflare' }
              }));
            } else {
              // Try to reconnect automatically
              console.log('[WalletProvider] Attempting to reconnect to Solflare wallet directly...');
              
              try {
                // Attempt direct reconnection with Solflare
                if (window.solflare) {
                  const response = await window.solflare.connect();
                  if (response && response.publicKey) {
                    const publicKey = response.publicKey.toString();
                    console.log(`[WalletProvider] Successfully reconnected to Solflare: ${publicKey}`);
                    
                    // Update state with Solflare connection
                    setLocalPublicKey(publicKey);
                    window.__WALLET_PUBLIC_KEY__ = publicKey;
                    window.__WALLET_CONNECTED__ = true;
                    window.__WALLET_TYPE__ = 'solflare';
                    localStorage.setItem('walletType', 'solflare');
                    localStorage.setItem('walletPublicKey', publicKey);
                    setWalletConnected(true);
                    
                    // Set wallet type cookie explicitly
                    setWalletTypeCookie('solflare');
                    
                    // Add Solflare event listeners
                    if (window.solflare) {
                      window.solflare.on?.('disconnect', handleSolflareDisconnect);
                      window.solflare.on?.('accountChanged', handleSolflareAccountChanged);
                    }
                    
                    // Trigger NFT refresh
                    window.forceNftRefresh = true;
                    
                    // Dispatch connection event
                    window.dispatchEvent(new CustomEvent('wallet-connection-change', {
                      detail: { publicKey, walletType: 'solflare' }
                    }));
                  }
                }
              } catch (err) {
                console.log('[WalletProvider] Failed direct Solflare reconnection, falling back to adapter selection');
                
                // Fallback - attempt using wallet adapter selection
                // This approach uses the wallet modal instead of direct connection
                const walletButtons = document.querySelectorAll('.wallet-adapter-modal-list button');
                const solflareButton = Array.from(walletButtons).find(
                  button => button.textContent?.includes('Solflare')
                );
                
                if (solflareButton instanceof HTMLElement) {
                  solflareButton.click();
                }
              }
            }
          } catch (error) {
            console.error('[WalletProvider] Error auto-reconnecting to Solflare:', error);
          }
        }, PHANTOM_RECONNECT_DELAY);
      }
    }
    
    // Создаем функцию для проверки изменений состояния подключения внешними скриптами
    const checkWalletConnectionStatus = () => {
      // Check for Solflare wallet connection first
      if (window.solflare && window.solflare.isSolflare && window.solflare.isConnected && 
          window.solflare.publicKey && !walletConnected) {
        const solflareKey = window.solflare.publicKey.toString();
        console.log('[WalletProvider] External Solflare connection detected:', solflareKey);
        
        setLocalPublicKey(solflareKey);
        window.__WALLET_PUBLIC_KEY__ = solflareKey;
        window.__WALLET_CONNECTED__ = true;
        window.__WALLET_TYPE__ = 'solflare';
        localStorage.setItem('walletType', 'solflare');
        localStorage.setItem('walletPublicKey', solflareKey);
        setWalletConnected(true);
        
        // Force NFT refresh after external connection
        window.forceNftRefresh = true;
        
        // Dispatch wallet connection event
        window.dispatchEvent(new CustomEvent('wallet-connection-change', {
          detail: { publicKey: solflareKey, connected: true, walletType: 'solflare' }
        }));
      }
      
      // Check for Solflare wallet disconnection
      if (window.solflare && window.solflare.isSolflare && 
          (!window.solflare.isConnected || !window.solflare.publicKey) && 
          walletConnected && window.__WALLET_TYPE__ === 'solflare') {
        console.log('[WalletProvider] External Solflare disconnection detected');
        resetWalletState();
      }
      
      // Проверка, если кошелек Phantom подключен, но наше состояние не соответствует
      if (window.solana && window.solana.isPhantom && window.solana.isConnected && 
          window.solana.publicKey && !walletConnected) {
        const phantomKey = window.solana.publicKey.toString();
        console.log('[WalletProvider] External connection detected:', phantomKey);
        
        setLocalPublicKey(phantomKey);
        window.__WALLET_PUBLIC_KEY__ = phantomKey;
        window.__WALLET_CONNECTED__ = true;
        window.__WALLET_TYPE__ = 'phantom';
        window.phantomInitialized = true;
        localStorage.setItem('walletType', 'phantom');
        localStorage.setItem('walletPublicKey', phantomKey);
        setWalletConnected(true);
        
        // Принудительное обновление NFT при внешнем подключении
        window.forceNftRefresh = true;
        window.phantomSpecificUpdate = true;
        
        // Диспетчеризация события подключения кошелька
        const event = new CustomEvent('phantom-connected', {
          detail: { publicKey: phantomKey, retryCount: 0 }
        });
        window.dispatchEvent(event);
      }
      
      // Проверка, если кошелек Phantom отключен, но наше состояние показывает подключение
      if (window.solana && window.solana.isPhantom && (!window.solana.isConnected || !window.solana.publicKey) && 
          walletConnected && window.__WALLET_TYPE__ === 'phantom') {
        console.log('[WalletProvider] External disconnection detected');
        resetWalletState();
      }
    };
    
    // Запускаем периодическую проверку состояния подключения
    const checkInterval = setInterval(checkWalletConnectionStatus, 5000);
    
    // Регистрируем обработчик для глобального события проверки подключения
    const handleConnectionCheck = () => {
      checkWalletConnectionStatus();
    };
    window.addEventListener('check-wallet-connection', handleConnectionCheck);
    
    return () => {
      clearInterval(checkInterval);
      window.removeEventListener('check-wallet-connection', handleConnectionCheck);
      
      // Удаляем обработчики событий Phantom при размонтировании компонента
      if (window.solana && window.__WALLET_TYPE__ === 'phantom') {
        window.solana.off?.('disconnect', handlePhantomDisconnect);
        window.solana.off?.('accountChanged', handlePhantomAccountChanged);
      }
      
      // Remove Solflare event listeners on component unmount
      if (window.solflare && window.__WALLET_TYPE__ === 'solflare') {
        window.solflare.off?.('disconnect', handleSolflareDisconnect);
        window.solflare.off?.('accountChanged', handleSolflareAccountChanged);
      }
    };
  }, [walletConnected]);

  // Обработчики событий для UI элементов
  const handleQuestClick = (questId: number) => {
    if (questId !== 1 && !isQuestActive(questId) && !isQuestCompleted(questId)) {
      return; // Не реагируем на клик, если квест неактивен
    }
    setActiveQuest(questId);
  };

  // Функция для выполнения квеста
  const handleCompleteQuest = async () => {
    if (activeQuest !== null && publicKey) {
      setIsLoading(true);
      
      try {
        console.log(`WalletInfo: Attempting to complete quest ${activeQuest} for wallet ${publicKey.toString()}`);
        console.log(`WalletInfo: Current quest state - isCompleted: ${isQuestCompleted(activeQuest)}, isActive: ${isQuestActive(activeQuest)}`);
        
        // Вызываем соответствующий сервис в зависимости от ID квеста
        let success = false;
        
        // Сохраняем адрес кошелька в localStorage для последующего использования в OAuth flow
        localStorage.setItem('walletAddress', publicKey.toString());
        
        switch (activeQuest) {
          case 1:
            console.log('WalletInfo: Initiating Twitter connection...');
            const twitterResult = await QuestServices.connectTwitter();
            success = twitterResult.success;
            console.log('WalletInfo: Twitter connection result:', twitterResult);
            break;
          case 2:
            console.log('WalletInfo: Initiating Discord connection...');
            const discordResult = await QuestServices.connectDiscord();
            success = discordResult.success;
            console.log('WalletInfo: Discord connection result:', discordResult);
            break;
          case 3:
            console.log('WalletInfo: Initiating Telegram connection...');
            const telegramResult = await QuestServices.connectTelegram();
            success = telegramResult.success;
            console.log('WalletInfo: Telegram connection result:', telegramResult);
            break;
        }
        
        // Если авторизация прошла успешно, отмечаем квест как выполненный
        if (success) {
          console.log(`WalletInfo: Quest ${activeQuest} authorization successful, marking as completed...`);
          
          // Check current state before calling completeQuest
          console.log(`WalletInfo: Before completeQuest - isQuestCompleted(${activeQuest}): ${isQuestCompleted(activeQuest)}`);
          
          // Call completeQuest to update state
          completeQuest(activeQuest);
          
          // Check if state was updated after completeQuest call
          console.log(`WalletInfo: After completeQuest - isQuestCompleted(${activeQuest}): ${isQuestCompleted(activeQuest)}`);
          
          // Show success toast
          toast.success(`Quest completed successfully! You earned points!`);
          
          // Close quest details
          setActiveQuest(null);
          
          // Wait a moment and then dispatch an event to refresh quest state
          setTimeout(() => {
            console.log('WalletInfo: Dispatching quest-completed event to trigger UI refresh');
            window.dispatchEvent(new CustomEvent('quest-completed', {
              detail: { questId: activeQuest, walletAddress: publicKey.toString() }
            }));
            
            // Force component re-render by setting a state variable
            setIsLoading(false);
          }, 500);
        } else {
          console.log(`WalletInfo: Quest ${activeQuest} authorization failed or was cancelled`);
          toast.error('Quest completion failed or was cancelled');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('WalletInfo: Error completing quest:', error);
        toast.error('An error occurred while completing the quest');
        setIsLoading(false);
      }
    }
  };

  // Обработчик для кнопки Get Invite Code
  const handleGetInviteCode = async () => {
    if (!connected || !publicKey) return;
    
    // Логируем информацию о типе кошелька для отладки
    const walletType = typeof window !== 'undefined' ? window.__WALLET_TYPE__ : undefined;
    console.log(`Requesting invite code with wallet type: ${walletType}, address: ${publicKey.toString()}`);
    
    // Проверяем наличие хотя бы одного NFT
    const hasNFTs = Object.values(ownedNFTs).some(count => count > 0);
    console.log('Owned NFTs:', ownedNFTs, 'Has NFTs:', hasNFTs);
    
    if (!hasNFTs) {
      setInviteCodeError('To get an invite code, you need at least 1 NFT in your collection');
      return;
    }
    
    // Логируем информацию о NFT для отладки
    console.log('Информация об NFT перед запросом:', {
      ownedNFTs,
      hasNFTs,
      totalPoints,
      walletType
    });
    
    setIsLoadingInviteCode(true);
    setInviteCodeError(null);
    setUserInviteCode(null);
    setReferralStats(null);
    
    try {
      // Возвращаемся к GET запросу, так как сервер не поддерживает POST
      const requestUrl = `/api/user-invite-code?walletAddress=${publicKey.toString()}&walletType=${walletType}`;
      console.log(`Making API request to: ${requestUrl}`);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicKey.toString()}`
        }
      });
      
      console.log('API response status:', response.status, response.statusText);
      
      // Проверяем статус ответа
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied: the server failed to verify the presence of NFT.');
        } else if (response.status === 405) {
          throw new Error('Server error: method not allowed. Please report this issue to developers.');
        }
        
        // Безопасно пытаемся получить текст ошибки
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const text = await response.text(); // Сначала получаем текст ответа
            console.log('Error response text:', text);
            
            // Проверяем, что текст не пустой и является JSON
            if (text && text.trim()) {
              const errorData = JSON.parse(text);
              if (errorData && errorData.error) {
                errorMessage = errorData.error;
              }
            }
          } catch (parseError) {
            console.error('Error parsing the response:', parseError);
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Сначала получаем текст ответа
      const responseText = await response.text();
      console.log('API response text:', responseText);
      
      // Проверяем, что ответ не пустой
      if (!responseText || !responseText.trim()) {
        throw new Error('The server returned an empty response.');
      }
      
      // Парсим JSON
      try {
        const data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
        
        if (data && data.inviteCode) {
          console.log('Setting invite code:', data.inviteCode);
          setUserInviteCode(data.inviteCode);
          
          // Также получаем статистику по рефералам, если она доступна
          if (data.referralStats) {
            setReferralStats({
              count: data.referralStats.count || 0,
              points: data.referralStats.points || 0
            });
          } else {
            // Если сервер не вернул статистику, устанавливаем дефолтные значения
            setReferralStats({ count: 0, points: 0 });
          }
        } else {
          throw new Error('Invalid response format from the server.');
        }
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError, 'Response text:', responseText);
        throw new Error('Failed to process the server response.');
      }
      
      // Дополнительно получаем статистику по рефералам
      try {
        const statsResponse = await fetch(`/api/referral-stats?walletAddress=${publicKey.toString()}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData) {
            setReferralStats({
              count: statsData.count || 0,
              points: statsData.points || 0
            });
          }
        }
      } catch (statsError) {
        console.error('Error fetching referral stats:', statsError);
        // Не выбрасываем ошибку, так как это не критично
      }
    } catch (err) {
      console.error('Error getting invite code:', err);
      setInviteCodeError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoadingInviteCode(false);
    }
  };

  // Обработчик для кнопки Leaderboard
  const handleLeaderboardClick = () => {
    // Закрываем модальное окно
    closeModal();
    
    // Перенаправляем на страницу лидерборда
    window.location.href = '/leaderboard';
  };

  if (!connected) {
    return (
      <div className="wallet-connect-wrapper">
        {/* Our custom button */}
        <Button 
          className="connect-wallet-btn" 
          onClick={handleConnectClick}
          isPulse={isPulse}
        >
          {connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
        </Button>
        
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
            <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
              <div className="wallet-modal-header">
                <button className="wallet-modal-close" onClick={closeModal}>×</button>
              </div>
              
              <div className="wallet-modal-content">
                <div className="wallet-tabs-container">
                  {/* Tab navigation */}
                  <div className="wallet-tabs-navigation">
                    <div 
                      className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
                      onClick={() => setActiveTab('profile')}
                    >
                      <div className="tab-icon">
                        <img src="/profile-icon.jpg" alt="Profile" />
                      </div>
                      <div className="tab-title">Profile</div>
                    </div>
                    <div 
                      className={`tab-item ${activeTab === 'quests' ? 'active' : ''}`}
                      onClick={() => setActiveTab('quests')}
                    >
                      <div className="tab-icon">
                        <img src="/quests-icon.jpg" alt="Quests" />
                      </div>
                      <div className="tab-title">Quests</div>
                    </div>
                  </div>
                  
                  {/* Содержимое вкладки */}
                  <div className="wallet-tabs-content">
                    {activeTab === 'profile' && (
                      // Основная информация профиля
                      <div className="wallet-info-tab">
                        <div className="user-profile-section">
                          <div className="name-field">
                            <div className="name-label">NAME:</div>
                            <input 
                              type="text" 
                              className="name-input" 
                              value={nickname} 
                              onChange={(e) => setNickname(e.target.value)}
                              placeholder="Enter your nickname"
                            />
                            <button 
                              className="save-nickname-btn" 
                              onClick={handleSaveNickname}
                              disabled={isSubmittingNickname}
                            >
                              {isSubmittingNickname ? '...' : '✓'}
                            </button>
                          </div>
                          
                          {nicknameSubmitSuccess && (
                            <div className="success-message">Nickname saved successfully!</div>
                          )}
                          
                          {nicknameSubmitError && (
                            <div className="error-message">{nicknameSubmitError}</div>
                          )}
                          
                          <div className="points-field">
                            <div className="points-label">POINTS:</div>
                            <div className="points-value">{totalPoints.toLocaleString()}</div>
                          </div>
                        </div>
                        
                        <div className="collection-section">
                          <div className="collection-header">×YOUR COLLECTION×</div>
                          
                          <div className="nft-cards-container">
                            {(() => {
                              // Define all available NFTs regardless of ownership
                              const allNFTs = {
                                "NFT1": { name: "Kōjō", class: "common", max: 50, image: "/kojo-image.png" },
                                "NFT2": { name: "Daimyō", class: "rare", max: 25, image: "/daimyo-image.png" },
                                "NFT3": { name: "Shōgun", class: "legendary", max: 10, image: "/shogun-image.png" }
                              };
                              
                              // Always display all NFT types
                              return Object.entries(allNFTs).map(([nftId, nftData]) => {
                                const count = ownedNFTs[nftId] || 0;
                                const isOwned = count > 0;
                                
                                return (
                                  <div key={nftId} className={`nft-card ${nftData.class} ${!isOwned ? 'not-owned' : ''}`}>
                                    <div className="nft-card-image">
                                      <img src={nftData.image} alt={nftData.name} />
                                    </div>
                                    <div className="nft-card-name">{nftData.name}</div>
                                    {count > 0 && <div className="nft-card-count">{count}</div>}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                          
                          <div className="nft-collection-stats">
                            <div className="nft-stat common">
                              <div>Common</div>
                              <div>{ownedNFTs['NFT1'] || 0}</div>
                            </div>
                            <div className="nft-stat rare">
                              <div>Rare</div>
                              <div>{ownedNFTs['NFT2'] || 0}</div>
                            </div>
                            <div className="nft-stat legendary">
                              <div>Legendary</div>
                              <div>{ownedNFTs['NFT3'] || 0}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Invite code section */}
                        <div className="invite-code-section">
                          <div className="invite-code-label">INVITE CODE:</div>
                          <div className="invite-code-input-wrapper">
                            <input 
                              type="text" 
                              className="invite-code-input" 
                              value={inviteCode}
                              onChange={(e) => setInviteCode(e.target.value.trim())}
                              placeholder="/LINK-CODE/"
                              maxLength={6}
                            />
                            <button 
                              className="submit-code-btn" 
                              onClick={handleSubmitInviteCode}
                              disabled={isSubmittingCode || isAlreadyInvited}
                            >
                              {isSubmittingCode ? '...' : 'OK'}
                            </button>
                          </div>
                          
                          {codeSubmitSuccess && (
                            <div className="success-message">Invite code applied successfully!</div>
                          )}
                          
                          {codeSubmitError && (
                            <div className="error-message">{codeSubmitError}</div>
                          )}
                          
                          {isAlreadyInvited && (
                            <div className="info-message">You have already been invited by another user.</div>
                          )}
                        </div>
                        
                        {/* Отображение полученного инвайт-кода */}
                        {userInviteCode && (
                          <div className="user-invite-code">
                            <div className="user-invite-code-label">Your invite code:</div>
                            <div className="user-invite-code-value">{userInviteCode}</div>
                            
                            {/* Добавляем отображение статистики по рефералам */}
                            {referralStats && (
                              <div className="referral-stats">
                                <div className="referral-stats-item">
                                  <span className="referral-stats-label">Registered Users:</span>
                                  <span className="referral-stats-value">{referralStats.count}</span>
                                </div>
                                <div className="referral-stats-item">
                                  <span className="referral-stats-label">Points Earned:</span>
                                  <span className="referral-stats-value">{referralStats.points}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {inviteCodeError && (
                          <div className="error-message">{inviteCodeError}</div>
                        )}
                        
                        {/* Buttons section */}
                        <div className="wallet-buttons-section">
                          <Button 
                            className="get-invite-code-btn"
                            disabled={isLoadingInviteCode}
                            onClick={handleGetInviteCode}
                          >
                            {isLoadingInviteCode ? 'Loading...' : 'Get Invite Code'}
                          </Button>
                          
                          <Button 
                            className="leaderboard-btn"
                            onClick={handleLeaderboardClick}
                          >
                            Leaderboard
                          </Button>
                          
                          <Button 
                            className="update-nft-btn"
                            onClick={() => {
                              // Вызываем функцию принудительного обновления NFT
                              forceNftUpdate();
                              toast.success('Updating NFT data...');
                            }}
                          >
                            Update NFT Data
                          </Button>
                          
                          <Button 
                            onClick={() => {
                              // Вместо просто отключения кошелька делаем полный сброс состояния
                              disconnect().then(() => {
                                // После успешного отключения сбрасываем состояние и перезагружаем страницу
                                resetWalletState();
                              }).catch(error => {
                                console.error("Error disconnecting wallet:", error);
                                // Всё равно сбрасываем состояние даже при ошибке
                                resetWalletState();
                              });
                              closeModal();
                            }}
                            className="disconnect-btn"
                          >
                            Disconnect
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'quests' && (
                      <div className="quests-tab">
                        {activeQuest ? (
                          // Отображение информации о выбранном квесте
                          <div className="quest-details">
                            <button className="back-button" onClick={() => setActiveQuest(null)}>← Back to quests</button>
                            <h3>{quests.find(q => q.id === activeQuest)?.title}</h3>
                            <p>Complete this quest to earn {quests.find(q => q.id === activeQuest)?.points} points!</p>
                            
                            <Button 
                              onClick={handleCompleteQuest} 
                              disabled={!isQuestActive(activeQuest) || isQuestCompleted(activeQuest) || isLoading}
                              className="complete-quest-btn"
                            >
                              {isLoading ? 'Connecting...' : 
                               isQuestCompleted(activeQuest) ? 'Completed' : 
                               !isQuestActive(activeQuest) ? 'Locked' : 'Complete Quest'}
                            </Button>
                          </div>
                        ) : (
                          // Список всех квестов
                          <div className="quests-list">
                            {quests.map(quest => (
                              <div 
                                key={quest.id}
                                className={`quest-item ${isQuestCompleted(quest.id) ? 'completed' : ''} ${!isQuestActive(quest.id) && !isQuestCompleted(quest.id) ? 'locked' : ''}`}
                                onClick={() => handleQuestClick(quest.id)}
                              >
                                <div className="quest-icon">
                                  <img src={quest.icon} alt={quest.title} />
                                </div>
                                <div className="quest-info">
                                  <div className="quest-title">{quest.title}</div>
                                  <div className="quest-points">{quest.points} points</div>
                                </div>
                                <div className="quest-status">
                                  {isQuestCompleted(quest.id) && <div className="quest-completed-badge">✓</div>}
                                  {!isQuestActive(quest.id) && !isQuestCompleted(quest.id) && <div className="quest-locked-badge">🔒</div>}
                                  {isQuestActive(quest.id) && !isQuestCompleted(quest.id) && <div className="quest-active-badge">→</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
        
        .wallet-modal {
          background: #000;
          border-radius: 15px;
          width: 95%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.7);
          border: 2px solid #FFD700;
        }
        
        .wallet-modal-header {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 15px 20px;
          position: relative;
        }
        
        .wallet-modal-close {
          background: none;
          border: none;
          color: #FFD700;
          font-size: 32px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          position: absolute;
          right: 20px;
          top: 10px;
          z-index: 10;
        }
        
        .wallet-modal-content {
          padding: 0;
        }
        
        .wallet-tabs-container {
          display: flex;
          flex-direction: row;
          height: 500px;
        }
        
        .wallet-tabs-navigation {
          display: flex;
          flex-direction: column;
          border-right: 1px solid #333;
          background: #1a1a1a;
          width: 80px;
        }
        
        .tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px 0;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        
        .tab-item.active {
          background: rgba(255, 215, 0, 0.1);
          border-left: 3px solid #FFD700;
        }
        
        .tab-icon {
          width: 30px;
          height: 30px;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .tab-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .tab-title {
          font-size: 12px;
          color: #ccc;
          text-align: center;
        }
        
        .tab-item.active .tab-title {
          color: #FFD700;
          font-weight: bold;
        }
        
        .wallet-tabs-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        
        .quests-tab {
          height: 100%;
        }
        
        .quests-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .quest-item {
          display: flex;
          align-items: center;
          padding: 15px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          border: 1px solid #333;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .quest-item:hover {
          background: rgba(0, 0, 0, 0.5);
          border-color: #555;
        }
        
        .quest-item.completed {
          border-left: 3px solid #51ff00;
        }
        
        .quest-item.locked {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .quest-icon {
          width: 40px;
          height: 40px;
          margin-right: 15px;
        }
        
        .quest-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .quest-info {
          flex: 1;
        }
        
        .quest-title {
          font-weight: bold;
          color: white;
          margin-bottom: 5px;
        }
        
        .quest-points {
          font-size: 12px;
          color: #FFD700;
        }
        
        .quest-status {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
        }
        
        .quest-completed-badge {
          width: 24px;
          height: 24px;
          background: #51ff00;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #000;
        }
        
        .quest-locked-badge {
          font-size: 18px;
          color: #999;
        }
        
        .quest-active-badge {
          font-size: 18px;
          color: #FFD700;
        }
        
        .quest-details {
          padding: 20px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          border: 1px solid #333;
        }
        
        .back-button {
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 0;
          margin-bottom: 15px;
          transition: color 0.2s ease;
        }
        
        .back-button:hover {
          color: #FFD700;
        }
        
        .quest-details h3 {
          color: #FFD700;
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 24px;
        }
        
        .quest-details p {
          color: #ccc;
          margin-bottom: 20px;
        }
        
        .complete-quest-btn {
          width: 100%;
        }
        
        .user-profile-section {
          margin-bottom: 20px;
        }
        
        .name-field, .points-field {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          border: 1px solid #FFD700;
          border-radius: 5px;
          padding: 5px 10px;
          background: #111;
        }
        
        .name-label, .points-label {
          color: #FFD700;
          font-weight: bold;
          min-width: 80px;
        }
        
        .name-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-family: inherit;
          padding: 5px;
        }
        
        .name-input:focus {
          outline: none;
        }
        
        .points-value {
          color: #51ff00;
          font-weight: bold;
          font-size: 20px;
        }
        
        .collection-section {
          margin-bottom: 20px;
        }
        
        .collection-header {
          text-align: center;
          color: #FFD700;
          font-weight: bold;
          margin-bottom: 15px;
          padding: 5px;
          border: 1px solid #FFD700;
          border-radius: 5px;
          background: #111;
        }
        
        .nft-cards-container {
          display: flex;
          justify-content: space-around;
          margin-bottom: 15px;
          min-height: 120px;
        }
        
        .nft-card {
          width: 100px;
          height: 120px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          position: relative;
          margin: 0 5px;
        }
        
        .nft-card-image {
          width: 70px;
          height: 70px;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .nft-card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .nft-card.common {
          background: linear-gradient(to bottom, rgba(138, 43, 226, 0.3), rgba(138, 43, 226, 0.7));
          border: 2px solid #8A2BE2;
        }
        
        .nft-card.rare {
          background: linear-gradient(to bottom, rgba(255, 0, 0, 0.3), rgba(255, 0, 0, 0.7));
          border: 2px solid #FF0000;
        }
        
        .nft-card.legendary {
          background: linear-gradient(to bottom, rgba(255, 215, 0, 0.3), rgba(255, 215, 0, 0.7));
          border: 2px solid #FFD700;
        }
        
        .nft-card-name {
          color: white;
          font-size: 14px;
          font-weight: bold;
          text-align: center;
        }
        
        .nft-card-count {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
        }
        
        .no-nfts-message {
          color: #999;
          text-align: center;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        
        .nft-collection-stats {
          display: flex;
          justify-content: space-around;
        }
        
        .nft-stat {
          text-align: center;
          font-weight: bold;
          width: 30%;
        }
        
        .nft-stat.common {
          color: #8A2BE2;
        }
        
        .nft-stat.rare {
          color: #FF0000;
        }
        
        .nft-stat.legendary {
          color: #FFD700;
        }
        
        .invite-code-section {
          margin-bottom: 20px;
        }
        
        .invite-code-label {
          color: #FFD700;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .invite-code-input-wrapper {
          border: 1px solid #FFD700;
          border-radius: 5px;
          background: #111;
          padding: 5px;
          display: flex;
          align-items: center;
        }
        
        .invite-code-input {
          flex: 1;
          background: transparent;
          border: none;
          color: white;
          font-family: inherit;
          padding: 5px;
          text-align: center;
        }
        
        .invite-code-input:focus {
          outline: none;
        }
        
        .user-invite-code {
          margin: 15px 0;
          padding: 10px;
          background: rgba(255, 215, 0, 0.1);
          border: 1px solid #FFD700;
          border-radius: 5px;
          text-align: center;
        }
        
        .user-invite-code-label {
          color: #FFD700;
          font-size: 12px;
          margin-bottom: 5px;
        }
        
        .user-invite-code-value {
          font-size: 20px;
          font-weight: bold;
          color: white;
          letter-spacing: 3px;
        }
        
        .info-message {
          color: #999;
          font-size: 12px;
          margin-top: 5px;
          text-align: center;
        }
        
        .wallet-buttons-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .get-invite-code-btn,
        .leaderboard-btn,
        .update-nft-btn,
        .disconnect-btn {
          width: 100%;
          padding: 10px;
          margin-bottom: 10px;
          font-weight: bold;
        }
        
        .update-nft-btn {
          background: #0066cc;
          color: white;
        }
        
        .update-nft-btn:hover {
          background: #0055aa;
        }
        
        .disconnect-btn {
          background: #222;
          color: #ccc;
        }
        
        .disconnect-btn:hover {
          background: #333;
        }
        
        .name-field {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          border: 1px solid #FFD700;
          border-radius: 5px;
          padding: 5px 10px;
          background: #111;
        }
        
        .save-nickname-btn, .submit-code-btn {
          background: #FFD700;
          color: #000;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          cursor: pointer;
          margin-left: 10px;
        }
        
        .save-nickname-btn:disabled, .submit-code-btn:disabled {
          background: #666;
          cursor: not-allowed;
        }
        
        .success-message {
          color: #51ff00;
          font-size: 12px;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .error-message {
          color: #ff0000;
          font-size: 12px;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .nft-card.not-owned {
          opacity: 0.5;
          filter: grayscale(70%);
        }
        
        .referral-stats {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px dashed rgba(255, 215, 0, 0.3);
        }
        
        .referral-stats-item {
          display: flex;
          justify-content: space-between;
          margin-top: 5px;
          font-size: 14px;
        }
        
        .referral-stats-label {
          color: #ccc;
        }
        
        .referral-stats-value {
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
    __WALLET_TYPE__?: "phantom" | "solflare" | undefined;
  }
}