'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  sendAndConfirmTransaction,
  Keypair
} from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import * as anchor from '@coral-xyz/anchor';
import { 
  getAssociatedTokenAddress, 
  ASSOCIATED_TOKEN_PROGRAM_ID, 
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  createAssociatedTokenAccountInstruction,
  getAccount
} from '@solana/spl-token';
import { toast } from 'react-hot-toast';

// Добавлю типы для NFT
type NFT = {
  mint: string;
  name: string;
  image: string;
  count: number;
};

// Обновленный тип для NFT с большим количеством токенов
type NFTConfig = {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  price: number;
  supply: number;
  uri: string;
};

// Настройки NFT
const NFT_CONFIGS: NFTConfig[] = [
  {
    id: 'NFT1',
    name: 'Kōjō (Common)',
    symbol: 'SAM',
    description: 'Entry-level samurai. Join the legend!',
    image: '/kojo-image.jpg',
    price: 0.5,
    supply: 5000,
    uri: 'https://blush-defensive-anglerfish-127.mypinata.cloud/ipfs/bafkreifjglef3hxqc37ryvi4v4fb45uieietqjagqugskkv7clf5j7rdxm'
  },
  {
    id: 'NFT2',
    name: 'Daimyō (Rare)',
    symbol: 'SAM',
    description: 'Elite warrior. Power and prestige!',
    image: '/daimyo-image.jpg',
    price: 1,
    supply: 3000,
    uri: 'https://blush-defensive-anglerfish-127.mypinata.cloud/ipfs/bafkreiejg3orncrnt2w4mkiwvb6jfbkre5vfzjrzjoyh23nxvvyfm2uqua'
  },
  {
    id: 'NFT3',
    name: 'Shōgun (Legendary)',
    description: 'Supreme ruler. Absolute power!',
    symbol: 'SAM',
    image: '/shogun-image.jpg',
    price: 2,
    supply: 2000,
    uri: 'https://blush-defensive-anglerfish-127.mypinata.cloud/ipfs/bafkreichpdjmt6z7rpw5jucd4vyc5mwe2lcmle77vgqwgphpicsek5ie7q'
  }
];

// ID программы для минтинга NFT
const PROGRAM_ID = new PublicKey('9uJ8yGTieFKj2f3XixAfuBAdFmavEoVNgCZgkcK56KrJ');

// ID коллекции для генерации уникальных ID
const COLLECTION_ID_BASE = Math.floor(Math.random() * 1000000) + 100;

// Обновлённый тип контекста
type SolanaNftContextType = {
  nfts: NFT[];
  isLoading: boolean;
  isNFT3Available: boolean;
  ownedNFTs: { [key: string]: number };
  purchaseNFT: (nftId: string) => Promise<boolean>;
  refreshNFTs: () => Promise<void>;
  totalPoints: number;
  syncPoints: () => Promise<void>;
  forceUpdatePoints: (points: number) => Promise<void>;
};

// Адреса NFT из конфига
const NFT_ADDRESSES = {
  NFT1: 'CUwe3xJkkLDi8MuF9uy3SgueMZyCdc5JLL2RuqyAPvjY', // Адрес коллекции NFT из cache.json
  NFT2: 'GgPjcdrqUU43G5z1qe3WdRWjPaXknx1XfgsXGYSdVYVq', // Уникальный адрес для NFT2
  NFT3: 'H11nUzK9kLEGfmcCZntCT6KEff5wuz6A3BgcLP1n4wXv', // Уникальный адрес для NFT3
};

const PROXY_WALLETS = {
  NFT1: {
    publicKey: "3T12LjYNS3AP4VJ2N3MzFHYqFr9sSgYnzFAaPGvHyKsE",
    secretKey: [
      246, 157, 114, 157, 132, 70, 77, 161, 132, 242, 6, 216, 13, 156, 113, 64, 
      180, 101, 123, 241, 74, 195, 59, 177, 242, 240, 201, 249, 31, 30, 176, 65, 
      36, 96, 128, 66, 155, 61, 251, 179, 224, 176, 125, 21, 82, 24, 230, 110, 
      212, 13, 56, 203, 131, 55, 7, 133, 254, 101, 27, 106, 128, 173, 219, 137
    ],
    nftMint: "GgPjcdrqUU43G5z1qe3WdRWjPaXknx1XfgsXGYSdVYVq",
    nftName: "Kojo (Common)"
  },
  NFT2: {
    publicKey: "5BaRA76UZBRqBfTVTfSYmdiiNvU9jckv47qvqd9JxSPJ",
    secretKey: [
      186, 203, 37, 77, 22, 110, 27, 234, 255, 252, 38, 131, 125, 201, 130, 140, 
      234, 201, 241, 248, 109, 205, 9, 34, 112, 137, 254, 177, 47, 175, 40, 68, 
      62, 36, 87, 7, 38, 131, 159, 37, 254, 218, 113, 238, 115, 232, 251, 52, 
      28, 170, 81, 196, 242, 218, 172, 101, 244, 162, 124, 22, 195, 51, 5, 57
    ],
    nftMint: "CUwe3xJkkLDi8MuF9uy3SgueMZyCdc5JLL2RuqyAPvjY",
    nftName: "Daimyo (Rare)"
  },
  NFT3: {
    publicKey: "4nobpBm3ctS6D8p3XWfzsDkrtQA6cSmFo1UDyKHRn5pt",
    secretKey: [
      133, 128, 186, 216, 131, 127, 204, 203, 39, 3, 62, 43, 98, 20, 185, 44, 
      41, 114, 99, 135, 185, 165, 105, 145, 154, 140, 89, 41, 140, 181, 52, 235, 
      56, 78, 227, 99, 168, 235, 177, 71, 132, 146, 130, 247, 106, 138, 1, 125, 
      179, 255, 180, 28, 174, 51, 39, 84, 71, 24, 200, 142, 128, 20, 130, 113
    ],
    nftMint: "H11nUzK9kLEGfmcCZntCT6KEff5wuz6A3BgcLP1n4wXv",
    nftName: "Shogun (Legendary)"
  }
};

// Создаю контекст с дефолтными значениями
const SolanaNftContext = createContext<SolanaNftContextType>({
  nfts: [],
  isLoading: false,
  isNFT3Available: false,
  ownedNFTs: {},
  purchaseNFT: async () => false,
  refreshNFTs: async () => {},
  totalPoints: 0,
  syncPoints: async () => {},
  forceUpdatePoints: async () => {}
});

// Хук для использования контекста
export const useSolanaNft = () => useContext(SolanaNftContext);

// Props для провайдера
type SolanaNftProviderProps = {
  children: ReactNode;
};

// Компонент провайдера
export function SolanaNftProvider({ children }: SolanaNftProviderProps) {
  const { publicKey, connected, signTransaction, signAllTransactions, sendTransaction } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ownedNFTs, setOwnedNFTs] = useState<{ [key: string]: number }>({});
  const [isNFT3Available, setIsNFT3Available] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Сохраняем время последнего обновления и соединение
  const lastRefreshTime = useRef<number>(0);
  const connectionRef = useRef<Connection | null>(null);
  const metaplexRef = useRef<Metaplex | null>(null);
  
  // Счетчик для генерации уникальных идентификаторов NFT
  const [nftIdCounter, setNftIdCounter] = useState<number>(0);
  
  // Кэширование IDL
  const idlRef = useRef<any>(null);
  
  // Инициализация соединения
  const getConnection = () => {
    if (!connectionRef.current) {
      connectionRef.current = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        { commitment: 'confirmed' }
      );
    }
    return connectionRef.current;
  };
  
  // Инициализация Metaplex
  const getMetaplex = () => {
    if (!metaplexRef.current) {
      const connection = getConnection();
      const metaplex = new Metaplex(connection);
      
      // Добавляем расширенное логирование для отладки
      console.log("Initializing Metaplex with wallet info:", {
        connected,
        publicKey: publicKey?.toString(),
        walletType: typeof window !== 'undefined' ? window.__WALLET_TYPE__ : 'unknown'
      });
      
      // Проверяем, есть ли подключенный кошелек
      if (publicKey) {
        // Создаем драйвер идентификации на основе publicKey
        const identity = {
          publicKey,
          signMessage: async () => {
            throw new Error('signMessage not implemented');
          },
          signTransaction: async (transaction: Transaction) => {
            if (signTransaction) {
              return await signTransaction(transaction);
            }
            
            // Если signTransaction от useWallet не доступен, пробуем использовать доступный кошелек
            const walletType = typeof window !== 'undefined' ? window.__WALLET_TYPE__ : null;
            
            if (walletType === 'solflare' && typeof window !== 'undefined' && window.solflare) {
              console.log("Using Solflare to sign transaction in Metaplex");
              return await window.solflare.signTransaction(transaction);
            } else if (typeof window !== 'undefined' && window.solana) {
              console.log("Using Phantom to sign transaction in Metaplex");
              return await window.solana.signTransaction(transaction);
            }
            
            throw new Error('No wallet available to sign transaction');
          },
          signAllTransactions: async (transactions: Transaction[]) => {
            if (signAllTransactions) {
              return await signAllTransactions(transactions);
            }
            
            // Если signAllTransactions от useWallet не доступен, пробуем использовать доступный кошелек
            const walletType = typeof window !== 'undefined' ? window.__WALLET_TYPE__ : null;
            
            if (walletType === 'solflare' && typeof window !== 'undefined' && window.solflare) {
              return await window.solflare.signAllTransactions(transactions);
            } else if (typeof window !== 'undefined' && window.solana) {
              return await window.solana.signAllTransactions(transactions);
            }
            
            throw new Error('No wallet available to sign transactions');
          },
        };
        
        // Устанавливаем идентификацию (identity) в Metaplex
        // @ts-ignore - Обходим проблемы типизации с Metaplex
        metaplex.use({ install: (mx: any) => mx.identity(identity) });
      }
      
      // Дополнительная проверка для Phantom кошелька
      const walletType = typeof window !== 'undefined' ? window.__WALLET_TYPE__ : null;
      
      if (walletType === 'phantom' && typeof window !== 'undefined' && window.solana?.publicKey) {
        console.log("Checking Phantom wallet compatibility...");
        
        // Если publicKey из useWallet не совпадает с Phantom publicKey, создаем альтернативный Metaplex
        if (!publicKey || publicKey.toString() !== window.solana.publicKey.toString()) {
          console.log("Creating alternative Phantom-specific Metaplex instance");
          
          // Создаем идентификацию на основе Phantom publicKey
          const phantomIdentity = {
            publicKey: window.solana.publicKey,
            signMessage: async () => {
              throw new Error('signMessage not implemented');
            },
            signTransaction: async (transaction: Transaction) => {
              if (window.solana) {
                return await window.solana.signTransaction(transaction);
              }
              throw new Error('Phantom wallet not available');
            },
            signAllTransactions: async (transactions: Transaction[]) => {
              if (window.solana) {
                return await window.solana.signAllTransactions(transactions);
              }
              throw new Error('Phantom wallet not available');
            },
          };
          
          // Создаем второй Metaplex с прямой идентификацией Phantom
          try {
            // @ts-ignore - Обходим проблемы типизации с Metaplex
            metaplex.use({ install: (mx: any) => mx.identity(phantomIdentity) });
            console.log("Successfully applied Phantom-specific identity to Metaplex");
          } catch (err) {
            console.error("Error applying Phantom identity:", err);
          }
        }
      }
      
      metaplexRef.current = metaplex;
    }
    return metaplexRef.current;
  };

  // Загрузка IDL
  const getIdl = async () => {
    if (!idlRef.current) {
      try {
        // Используем локальный IDL, так как fetchIdl может вызывать проблемы с типами
        // в Next.js 15 из-за изменений в Wallet API
        idlRef.current = {
          version: "0.1.0",
          name: "nft_program",
          instructions: [
            {
              name: "createSingleNft",
              accounts: [
                { name: "authority", isMut: true, isSigner: true },
                { name: "payer", isMut: true, isSigner: true },
                { name: "mint", isMut: true, isSigner: false },
                { name: "tokenAccount", isMut: true, isSigner: false },
                { name: "associatedTokenProgram", isMut: false, isSigner: false },
                { name: "rent", isMut: false, isSigner: false },
                { name: "systemProgram", isMut: false, isSigner: false },
                { name: "tokenProgram", isMut: false, isSigner: false },
                { name: "metadataProgram", isMut: false, isSigner: false },
                { name: "masterEditionAccount", isMut: true, isSigner: false },
                { name: "nftMetadata", isMut: true, isSigner: false }
              ],
              args: [
                { name: "id", type: "u64" },
                { name: "name", type: "string" },
                { name: "symbol", type: "string" },
                { name: "uri", type: "string" },
                { name: "price", type: "f32" },
                { name: "cant", type: "u64" }
              ]
            },
            {
              name: "createLargeNftCollection",
              accounts: [
                { name: "authority", isMut: true, isSigner: true },
                { name: "payer", isMut: true, isSigner: true },
                { name: "mint", isMut: true, isSigner: false },
                { name: "tokenAccount", isMut: true, isSigner: false },
                { name: "associatedTokenProgram", isMut: false, isSigner: false },
                { name: "rent", isMut: false, isSigner: false },
                { name: "systemProgram", isMut: false, isSigner: false },
                { name: "tokenProgram", isMut: false, isSigner: false },
                { name: "metadataProgram", isMut: false, isSigner: false },
                { name: "masterEditionAccount", isMut: true, isSigner: false },
                { name: "nftMetadata", isMut: true, isSigner: false }
              ],
              args: [
                { name: "id", type: "u64" },
                { name: "name", type: "string" },
                { name: "symbol", type: "string" },
                { name: "uri", type: "string" },
                { name: "price", type: "f32" },
                { name: "supply", type: "u64" }
              ]
            }
          ]
        };
      } catch (error) {
        console.error('Error loading IDL:', error);
        // В случае ошибки используем резервный локальный IDL
        idlRef.current = {
          version: "0.1.0",
          name: "nft_program",
          // Оставляем тот же IDL...
        };
      }
    }
    return idlRef.current;
  };
  
  // Получение программы Anchor
  const getProgram = async () => {
    const idl = await getIdl();
    const connection = getConnection();
    
    // Создаем конфигурацию провайдера вручную вместо использования стандартного AnchorProvider
    const providerConfig = {
      connection,
      publicKey: publicKey || anchor.web3.Keypair.generate().publicKey,
      signTransaction: signTransaction || ((tx: Transaction) => Promise.resolve(tx)),
      signAllTransactions: signAllTransactions || ((txs: Transaction[]) => Promise.resolve(txs)),
      sendTransaction
    };
    
    // @ts-ignore - игнорируем ошибки типов, так как мы обходим стандартную проверку типов
    return new anchor.Program(idl, PROGRAM_ID, providerConfig);
  };
  
  // Получение адреса mint на основе ID
  const getMintAddress = (id: number) => {
    const [mintAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint'), Buffer.from(new anchor.BN(id).toArray('le', 8))],
      PROGRAM_ID
    );
    return mintAddress;
  };
  
  // Генерация уникального ID для NFT
  const generateUniqueNftId = () => {
    const newId = COLLECTION_ID_BASE + nftIdCounter;
    setNftIdCounter(prevCounter => prevCounter + 1);
    return newId;
  };

  // Функция для проверки владения NFT с улучшенным механизмом повторных попыток
  const checkNFTOwnership = async (): Promise<boolean> => {
    if (!publicKey || !connected) return false;
    
    const now = Date.now();
    // Ограничиваем запросы до одного в 5 секунд для избежания частых запросов
    const MIN_REFRESH_INTERVAL = 5000; // 5 секунд
    
    // Исключаем проверку интервала при первом запуске или принудительном обновлении
    const forceRefresh = window.forceNftRefresh === true;
    window.forceNftRefresh = false; // Сбрасываем флаг после использования
    
    if (!forceRefresh && now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) {
      console.log('Too frequent requests to RPC, skipping update');
      return false;
    }
    
    setIsLoading(true);
    
    // Отслеживаем успешность операции
    let success = false;
    
    try {
      lastRefreshTime.current = now;
      
      // Получаем тип кошелька для отладки
      const walletType = typeof window !== 'undefined' ? window.__WALLET_TYPE__ : 'unknown';
      console.log(`Checking NFT ownership with wallet type: ${walletType}`);
      
      // Добавляем задержку перед запросом для стабилизации соединения
      // Phantom требует больше времени для инициализации
      const stabilizationDelay = walletType === 'phantom' ? 1500 : 500;
      await new Promise(resolve => setTimeout(resolve, stabilizationDelay));
      
      // Проверка активного публичного ключа Phantom
      if (walletType === 'phantom' && window.solana?.publicKey) {
        console.log('Using Phantom public key from window.solana:', window.solana.publicKey.toString());
        
        // Если кошелек Phantom, но publicKey из useWallet не активен, используем кошелек из window
        if (!publicKey || publicKey.toString() !== window.solana.publicKey.toString()) {
          console.warn('Public key mismatch between useWallet and window.solana');
          // Продолжаем с текущим ключом, но добавляем проверку с кошельком Phantom
        }
      }
      
      // Всегда пересоздаем инстанс Metaplex для избежания проблем с кешированием
      metaplexRef.current = null;
      const metaplex = getMetaplex();
      
      // Проверка соединения и публичного ключа перед запросом
      if (!publicKey) {
        console.error("Public key is undefined, aborting NFT check");
        return false;
      }
      
      // Получаем все NFT пользователя
      console.log(`Fetching NFTs for wallet: ${publicKey.toString()}`);
      
      // Делаем до 3 попыток получения NFT, если первая попытка не удастся
      let userNFTs: any[] | null = null;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (attempt < maxAttempts) {
        try {
          // Увеличиваем счетчик попыток
          attempt++;
          
          // Получаем NFT с увеличенным таймаутом
          userNFTs = await Promise.race([
            metaplex.nfts().findAllByOwner({ owner: publicKey }),
            // Устанавливаем таймаут на запрос (30 секунд)
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('NFT fetch timeout')), 30000)
            )
          ]);
          
          // Если успешно получили NFT, выходим из цикла
          if (userNFTs) {
            console.log(`Attempt ${attempt}: Found ${userNFTs.length} NFTs for user`);
            break;
          } else {
            throw new Error('NFTs data is null');
          }
        } catch (error: any) {
          const errorMessage = error?.message || 'Unknown error';
          console.error(`Attempt ${attempt} failed:`, errorMessage);
          
          // Если это была последняя попытка и у нас Phantom кошелек, попробуем запасной метод
          if (attempt >= maxAttempts) {
            if (walletType === 'phantom' && window.solana?.publicKey) {
              console.log('Trying backup method for Phantom wallet...');
              try {
                // Пробуем запасной метод с непосредственным использованием Phantom публичного ключа
                userNFTs = await metaplex.nfts().findAllByOwner({ owner: window.solana.publicKey });
                if (userNFTs) {
                  console.log(`Backup method successful! Found ${userNFTs.length} NFTs`);
                  break;
                }
              } catch (backupError: any) {
                console.error('Backup method failed:', backupError?.message || 'Unknown error');
                throw new Error(`Failed to fetch NFTs after all attempts: ${errorMessage}`);
              }
            } else {
              throw new Error(`Failed to fetch NFTs after ${maxAttempts} attempts: ${errorMessage}`);
            }
          }
          
          // Ждем перед следующей попыткой (увеличивающаяся задержка)
          const retryDelay = 1000 * attempt * (walletType === 'phantom' ? 2 : 1); // Phantom нуждается в большей задержке
          console.log(`Waiting ${retryDelay}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          // Пересоздаем Metaplex для следующей попытки
          metaplexRef.current = null;
          getMetaplex();
        }
      }
      
      if (!userNFTs || userNFTs.length === 0) {
        console.log('No NFTs found for this wallet');
        // Устанавливаем пустые значения
        setOwnedNFTs({
          NFT1: 0,
          NFT2: 0,
          NFT3: 0
        });
        setNfts([]);
        setIsNFT3Available(false);
        setTotalPoints(0);
        
        // Отмечаем успех операции, даже если NFT не найдены - это валидный результат
        success = true;
        return true;
      }
      
      console.log('Found NFTs for user:', userNFTs.length);
      
      // Проверяем наличие NFT для запланированных коллекций 
      const relevantAddresses = [NFT_ADDRESSES.NFT1, NFT_ADDRESSES.NFT2, NFT_ADDRESSES.NFT3];
      console.log('Looking for NFTs with these addresses:', relevantAddresses);
      
      // Выводим в лог все NFT для отладки
      userNFTs.forEach((nft, index) => {
        const nftAddress = nft.address.toBase58();
        const collectionAddress = nft.collection?.address.toBase58() || 'no collection';
        const isRelevant = relevantAddresses.includes(nftAddress) || 
                          relevantAddresses.includes(collectionAddress);
                          
        console.log(`NFT #${index}:`, {
          name: nft.name,
          address: nftAddress,
          collection: collectionAddress,
          symbol: nft.symbol,
          uri: nft.uri,
          isRelevant: isRelevant,
          json: nft.json // Добавляем JSON метаданные для дополнительного анализа
        });
      });
      
      // Более точная логика идентификации NFT с лучшей отладкой
      let nft1Count = 0;
      let nft2Count = 0;
      let nft3Count = 0;
      
      userNFTs.forEach(nft => {
        const nftAddress = nft.address.toBase58();
        const collectionAddress = nft.collection?.address.toBase58();
        const name = nft.name?.toLowerCase() || '';
        const jsonName = nft.json?.name ? String(nft.json.name).toLowerCase() : '';
        
        // Проверка для NFT1 (Kōjō/Kojo)
        if (nftAddress === NFT_ADDRESSES.NFT1 || 
            collectionAddress === NFT_ADDRESSES.NFT1 ||
            name.includes('shōgun') || name.includes('shōgun') ||
            jsonName.includes('shōgun') || jsonName.includes('shōgun')) {
          console.log(`Found NFT1 (Kōjō): ${nftAddress}`);
          nft1Count++;
        }
        
        // Проверка для NFT2 (Daimyō/Daimyo)
        else if (nftAddress === NFT_ADDRESSES.NFT2 || 
            collectionAddress === NFT_ADDRESSES.NFT2 ||
            name.includes('daimyō') || name.includes('daimyo') ||
            jsonName.includes('daimyō') || jsonName.includes('daimyo')) {
          console.log(`Found NFT2 (Daimyō): ${nftAddress}`);
          nft2Count++;
        }
        
        // Проверка для NFT3 (Shōgun/Shogun)
        else if (nftAddress === NFT_ADDRESSES.NFT3 || 
            collectionAddress === NFT_ADDRESSES.NFT3 ||
            name.includes('shōgun') || name.includes('shogun') ||
            jsonName.includes('shōgun') || jsonName.includes('shogun')) {
          console.log(`Found NFT3 (Shōgun): ${nftAddress}`);
          nft3Count++;
        }
      });
      
      console.log('Found NFTs by types:', {
        'Kōjō (Common)': nft1Count,
        'Daimyō (Rare)': nft2Count,
        'Shōgun (Legendary)': nft3Count
      });
      
      // Обновляем состояние с количеством NFT
      const owned = {
        NFT1: nft1Count,
        NFT2: nft2Count,
        NFT3: nft3Count
      };
      
      console.log('Обновляем состояние количества NFT:', owned);
      setOwnedNFTs(owned);
      
      // NFT3 доступно только если есть NFT1 и NFT2
      setIsNFT3Available(nft1Count > 0 && nft2Count > 0);
      
      // Расчет общего количества поинтов (можно реализовать собственную логику)
      setTotalPoints(nft1Count * 10 + nft2Count * 20 + nft3Count * 50);
      
      // Собираем информацию о NFT для отображения
      const availableNFTs = [
        { 
          mint: NFT_ADDRESSES.NFT1,
          name: 'Kōjō (Common)',
          image: '/kojo-image.jpg', // Обновлен путь к SVG изображению
          count: nft1Count
        },
        {
          mint: NFT_ADDRESSES.NFT2,
          name: 'Daimyō (Rare)',
          image: '/daimyo-image.jpg', // Обновлен путь к SVG изображению
          count: nft2Count
        },
        {
          mint: NFT_ADDRESSES.NFT3,
          name: 'Shōgun (Legendary)',
          image: '/shogun-image.jpg', // Обновлен путь к SVG изображению
          count: nft3Count
        }
      ];
      
      // Фильтруем только NFT, которые есть у пользователя
      const filteredNFTs = availableNFTs.filter(nft => nft.count > 0);
      
      setNfts(filteredNFTs);
      
      // Помечаем, что последняя проверка NFT была успешной
      window.lastSuccessfulNftCheck = Date.now();
      
      // Отмечаем успех операции
      success = true;
      return true;
    } catch (error) {
      console.error('Error checking NFT:', error);
      return false;
    } finally {
      setIsLoading(false);
      
      // Если операция была неуспешной, планируем повторную попытку
      if (!success && publicKey && connected) {
        console.log('Scheduling retry for NFT check due to failure');
        setTimeout(() => {
          // Повторяем попытку с флагом принудительного обновления
          window.forceNftRefresh = true;
          checkNFTOwnership();
        }, 3000);
      }
    }
  };

  // Функция для загрузки прокси кошелька
  const getProxyKeypair = (nftId: string): Keypair | null => {
    const walletInfo = PROXY_WALLETS[nftId as keyof typeof PROXY_WALLETS];
    if (!walletInfo) {
      console.error(`Proxy wallet for ${nftId} not found`);
      return null;
    }
    
    try {
      return Keypair.fromSecretKey(Uint8Array.from(walletInfo.secretKey));
    } catch (error) {
      console.error(`Error creating keypair for ${nftId}:`, error);
      return null;
    }
  };
  
  // Функция для передачи NFT от прокси-кошелька к пользователю
  const transferNftFromProxy = async (nftId: string): Promise<boolean> => {
    if (!publicKey) return false;
    
    const proxyKeypair = getProxyKeypair(nftId);
    if (!proxyKeypair) return false;
    
    const walletInfo = PROXY_WALLETS[nftId as keyof typeof PROXY_WALLETS];
    const nftMint = new PublicKey(walletInfo.nftMint);
    
    try {
      // Получение адресов токен-аккаунтов
      const proxyTokenAccount = await getAssociatedTokenAddress(
        nftMint,
        proxyKeypair.publicKey
      );
      
      const userTokenAccount = await getAssociatedTokenAddress(
        nftMint,
        publicKey
      );
      
      console.log(`Sender token account address (proxy): ${proxyTokenAccount.toString()}`);
      console.log(`Recipient token account address (user): ${userTokenAccount.toString()}`);
      
      // Проверяем существование токен-аккаунта пользователя
      let userTokenAccountExists = true;
      try {
        await getAccount(getConnection(), userTokenAccount);
      } catch (error) {
        userTokenAccountExists = false;
      }
      
      // Создаем инструкции для транзакции
      const instructions = [];
      
      // Если токен-аккаунт пользователя не существует, создаем его
      if (!userTokenAccountExists) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            proxyKeypair.publicKey, // плательщик
            userTokenAccount,        // ассоциированный токен-аккаунт
            publicKey,               // владелец
            nftMint                  // монета
          )
        );
      }
      
      // Инструкция для передачи токена
      instructions.push(
        createTransferInstruction(
          proxyTokenAccount,
          userTokenAccount,
          proxyKeypair.publicKey,
          BigInt(1), // Передаем 1 токен
          [proxyKeypair]
        )
      );
      
      // Создаем транзакцию
      const transaction = new Transaction().add(...instructions);
      
      // Получаем последний блокхэш и устанавливаем fee payer
      transaction.feePayer = proxyKeypair.publicKey;
      transaction.recentBlockhash = (await getConnection().getLatestBlockhash()).blockhash;
      
      // Подписываем транзакцию прокси-кошельком
      transaction.sign(proxyKeypair);
      
      // Отправляем транзакцию
      const signature = await getConnection().sendRawTransaction(transaction.serialize());
      
      // Ждем подтверждения
      await getConnection().confirmTransaction(signature, 'confirmed');
      
      console.log(`Successfully sent 1 NFT token (${walletInfo.nftName}) to user`);
      console.log(`Transaction: ${signature}`);
      
      return true;
    } catch (error) {
      console.error(`Error transferring NFT from proxy to user:`, error);
      return false;
    }
  };

  // Функция для покупки NFT (теперь сначала требует оплату, затем передает токен от прокси)
  const purchaseNFT = async (nftId: string): Promise<boolean> => {
    // Проверяем подключение - сначала из хука, затем из глобальных переменных
    const walletConnected = connected || (typeof window !== 'undefined' && window.__WALLET_CONNECTED__);
    const walletPublicKey = publicKey || (typeof window !== 'undefined' && window.__WALLET_PUBLIC_KEY__ ? new PublicKey(window.__WALLET_PUBLIC_KEY__) : null);
    
    if (!walletPublicKey || !walletConnected) {
      toast.error('Wallet not connected');
      return false;
    }
    
    // Проверяем, доступно ли NFT3
    if (nftId === 'NFT3' && !isNFT3Available) {
      toast.error('To purchase Shōgun, you must own Kōjō and Daimyō');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      // Находим конфигурацию NFT для получения цены
      const nftConfig = NFT_CONFIGS.find(config => config.id === nftId);
      if (!nftConfig) {
        toast.error('NFT configuration not found');
        return false;
      }
      
      // Получаем цену NFT в SOL
      const priceInSol = nftConfig.price;
      
      // Получаем прокси-кошелек для приема средств
      const proxyKeypair = getProxyKeypair(nftId);
      if (!proxyKeypair) {
        toast.error('Failed to get seller information');
        return false;
      }
      
      // Создаем транзакцию для оплаты
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: proxyKeypair.publicKey,
          lamports: Math.floor(priceInSol * 1000000000) // Конвертируем SOL в ламппорты (1 SOL = 10^9 lamports)
        })
      );
      
      // Получаем последний блокхэш и устанавливаем fee payer
      transaction.feePayer = walletPublicKey;
      transaction.recentBlockhash = (await getConnection().getLatestBlockhash()).blockhash;
      
      // Проверяем доступность метода подписи
      if (!signTransaction) {
        // Определяем, какой кошелек следует использовать первым
        const walletType = typeof window !== 'undefined' ? window.__WALLET_TYPE__ : null;
        
        // Если известно, что вход был через Solflare, сначала пробуем его
        if (walletType === 'solflare' && typeof window !== 'undefined' && window.solflare && window.solflare.isSolflare) {
          console.log("Attempting to sign transaction using Solflare wallet (primary)");
          try {
            const signedTransaction = await window.solflare.signTransaction(transaction);
            
            // Отправляем транзакцию в сеть
            const paymentSignature = await getConnection().sendRawTransaction(signedTransaction.serialize());
            
            // Ждем подтверждения оплаты
            const paymentConfirmation = await getConnection().confirmTransaction(paymentSignature, 'confirmed');
            
            if (paymentConfirmation.value.err) {
              toast.error('Error paying for NFT. Check your wallet balance.');
              return false;
            }
            
            toast.success(`Payment of ${priceInSol} SOL successful!`);
            
            // После успешной оплаты передаем NFT от прокси-кошелька пользователю
            const success = await transferNftFromProxy(nftId);
            
            if (success) {
              toast.success(`${PROXY_WALLETS[nftId as keyof typeof PROXY_WALLETS].nftName} successfully received!`);
              
              // Обновляем данные о владении NFT
              await checkNFTOwnership();
              
              // Обновляем баллы пользователя через API
              try {
                // Вычисляем баллы на основе типа NFT
                const pointsToAdd = nftId === 'NFT1' ? 10 : nftId === 'NFT2' ? 20 : 50;
                
                const response = await fetch('/api/nft/update-points', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    walletAddress: walletPublicKey.toString(),
                    nftId,
                    points: pointsToAdd
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Points updated:', result);
                } else {
                  console.error('Failed to update points');
                }
              } catch (error) {
                console.error('Error updating points:', error);
              }
              
              return true;
            } else {
              toast.error('Failed to receive NFT. Please try again.');
              return false;
            }
          } catch (err) {
            console.error("Error using Solflare to sign transaction:", err);
            // Если Solflare не сработал, продолжаем с Phantom
          }
        }
        
        // Пробуем Phantom или используем его как запасной вариант
        if (typeof window !== 'undefined' && window.solana && window.solana.isPhantom) {
          console.log("Attempting to sign transaction using Phantom wallet", 
                     walletType === 'phantom' ? '(primary)' : '(fallback)');
          
          try {
            const signedTransaction = await window.solana.signTransaction(transaction);
            
            // Отправляем транзакцию в сеть
            const paymentSignature = await getConnection().sendRawTransaction(signedTransaction.serialize());
            
            // Ждем подтверждения оплаты
            const paymentConfirmation = await getConnection().confirmTransaction(paymentSignature, 'confirmed');
            
            if (paymentConfirmation.value.err) {
              toast.error('Error paying for NFT. Check your wallet balance.');
              return false;
            }
            
            toast.success(`Payment of ${priceInSol} SOL successful!`);
            
            // После успешной оплаты передаем NFT от прокси-кошелька пользователю
            const success = await transferNftFromProxy(nftId);
            
            if (success) {
              toast.success(`${PROXY_WALLETS[nftId as keyof typeof PROXY_WALLETS].nftName} successfully received!`);
              
              // Обновляем данные о владении NFT
              await checkNFTOwnership();
              
              // Обновляем баллы пользователя через API
              try {
                // Вычисляем баллы на основе типа NFT
                const pointsToAdd = nftId === 'NFT1' ? 10 : nftId === 'NFT2' ? 20 : 50;
                
                const response = await fetch('/api/nft/update-points', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    walletAddress: walletPublicKey.toString(),
                    nftId,
                    points: pointsToAdd
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Points updated:', result);
                } else {
                  console.error('Failed to update points');
                }
              } catch (error) {
                console.error('Error updating points:', error);
              }
              
              return true;
            } else {
              toast.error('Failed to receive NFT. Please try again.');
              return false;
            }
          } catch (err) {
            console.error("Error using Phantom to sign transaction:", err);
          }
        }
        
        // Если ни один из предыдущих вариантов не сработал и тип кошелька - Solflare,
        // но мы ещё не пробовали его (может быть из-за неизвестного типа кошелька),
        // то пробуем Solflare как запасной вариант
        if (walletType !== 'solflare' && typeof window !== 'undefined' && window.solflare && window.solflare.isSolflare) {
          console.log("Attempting to sign transaction using Solflare wallet (fallback)");
          try {
            const signedTransaction = await window.solflare.signTransaction(transaction);
            
            // Отправляем транзакцию в сеть
            const paymentSignature = await getConnection().sendRawTransaction(signedTransaction.serialize());
            
            // Ждем подтверждения оплаты
            const paymentConfirmation = await getConnection().confirmTransaction(paymentSignature, 'confirmed');
            
            if (paymentConfirmation.value.err) {
              toast.error('Error paying for NFT. Check your wallet balance.');
              return false;
            }
            
            toast.success(`Payment of ${priceInSol} SOL successful!`);
            
            // После успешной оплаты передаем NFT от прокси-кошелька пользователю
            const success = await transferNftFromProxy(nftId);
            
            if (success) {
              toast.success(`${PROXY_WALLETS[nftId as keyof typeof PROXY_WALLETS].nftName} successfully received!`);
              
              // Обновляем данные о владении NFT
              await checkNFTOwnership();
              
              // Обновляем баллы пользователя через API
              try {
                // Вычисляем баллы на основе типа NFT
                const pointsToAdd = nftId === 'NFT1' ? 10 : nftId === 'NFT2' ? 20 : 50;
                
                const response = await fetch('/api/nft/update-points', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    walletAddress: walletPublicKey.toString(),
                    nftId,
                    points: pointsToAdd
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Points updated:', result);
                } else {
                  console.error('Failed to update points');
                }
              } catch (error) {
                console.error('Error updating points:', error);
              }
              
              return true;
            } else {
              toast.error('Failed to receive NFT. Please try again.');
              return false;
            }
          } catch (err) {
            console.error("Error using Solflare to sign transaction:", err);
          }
        }
        
        // Если ни один из кошельков не доступен
        toast.error('Wallet extension not found. Please install Phantom or Solflare.');
        return false;
      } else {
        // Стандартный путь, когда signTransaction из useWallet доступен
        // Подписываем транзакцию пользователем
        const signedTransaction = await signTransaction(transaction);
        
        // Отправляем транзакцию в сеть
        const paymentSignature = await getConnection().sendRawTransaction(signedTransaction.serialize());
        
        // Ждем подтверждения оплаты
        const paymentConfirmation = await getConnection().confirmTransaction(paymentSignature, 'confirmed');
        
        if (paymentConfirmation.value.err) {
          toast.error('Error paying for NFT. Check your wallet balance.');
          return false;
        }
        
        toast.success(`Payment of ${priceInSol} SOL successful!`);
        
        // После успешной оплаты передаем NFT от прокси-кошелька пользователю
        const success = await transferNftFromProxy(nftId);
        
        if (success) {
          toast.success(`${PROXY_WALLETS[nftId as keyof typeof PROXY_WALLETS].nftName} successfully received!`);
          
          // Обновляем данные о владении NFT
          await checkNFTOwnership();
          
          // Обновляем баллы пользователя через API
          try {
            // Вычисляем баллы на основе типа NFT
            const pointsToAdd = nftId === 'NFT1' ? 10 : nftId === 'NFT2' ? 20 : 50;
            
            const response = await fetch('/api/nft/update-points', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                walletAddress: walletPublicKey.toString(),
                nftId,
                points: pointsToAdd
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Points updated:', result);
            } else {
              console.error('Failed to update points');
            }
          } catch (error) {
            console.error('Error updating points:', error);
          }
          
          return true;
        } else {
          toast.error('Failed to receive NFT. Please try again.');
          return false;
        }
      }
    } catch (error) {
      console.error('Error purchasing NFT:', error);
      toast.error('An error occurred while purchasing NFT');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Обновление NFT
  const refreshNFTs = async () => {
    await checkNFTOwnership();
  };

  // Функция для синхронизации баллов за уже купленные NFT
  const syncPointsForExistingNFTs = async () => {
    if (!publicKey || !connected) return;
    
    try {
      // Сначала обновляем информацию о владении NFT
      await checkNFTOwnership();
      
      console.log('Синхронизация баллов для NFT:', ownedNFTs);
      
      // После обновления данных о NFT отправляем запрос на сервер
      const response = await fetch('/api/nft/sync-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          nfts: {
            NFT1: ownedNFTs.NFT1 || 0,
            NFT2: ownedNFTs.NFT2 || 0, 
            NFT3: ownedNFTs.NFT3 || 0
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Points synchronized:', result);
        
        // Обновляем точки в интерфейсе, если сервер вернул общее количество
        if (result.totalPoints !== undefined) {
          setTotalPoints(result.totalPoints);
        }
      } else {
        // Если ответ не OK, выводим больше информации об ошибке
        const errorData = await response.json();
        console.error('Error synchronizing points:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error synchronizing points:', error);
    }
  };

  // Эффект для проверки NFT при подключении кошелька
  useEffect(() => {
    let mounted = true;
    let nftCheckTimeout: NodeJS.Timeout | null = null;
    let periodicCheckInterval: NodeJS.Timeout | null = null;
    
    const init = async () => {
      if (connected && publicKey) {
        try {
          // Добавляем отладочную информацию
          const walletType = typeof window !== 'undefined' ? window.__WALLET_TYPE__ : 'unknown';
          console.log(`Initializing NFT data for wallet type: ${walletType}`);
          
          // Специальная обработка для Phantom кошельков
          if (walletType === 'phantom') {
            // Проверяем совпадение публичных ключей
            if (window.solana?.publicKey && publicKey.toString() !== window.solana.publicKey.toString()) {
              console.warn('Public key mismatch between useWallet and window.solana', {
                useWallet: publicKey.toString(),
                phantom: window.solana.publicKey.toString()
              });
            }
            
            // Добавляем больше времени на инициализацию для Phantom
            console.log("Waiting for Phantom wallet initialization...");
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Сбрасываем кэш Metaplex для гарантии свежих данных
          metaplexRef.current = null;

          // В случае первого подключения делаем несколько попыток с интервалом
          // чтобы дать время на инициализацию глобальных переменных
          let retryCount = 0;
          const maxRetries = walletType === 'phantom' ? 8 : 5; // Больше попыток для Phantom
          const retryInterval = walletType === 'phantom' ? 3000 : 2000; // Большие интервалы для Phantom
          
          const attemptNftCheck = async () => {
            try {
              console.log(`NFT check attempt ${retryCount + 1}/${maxRetries}`);
              
              // Запускаем проверку с принудительным обновлением
              window.forceNftRefresh = true;
              const successful = await checkNFTOwnership();
              
              // Если проверка успешна и мы получили данные
              if (successful) {
                console.log('Successfully checked NFT ownership');
                
                // После успешной проверки NFT синхронизируем баллы
                if (mounted) {
                  await syncPointsForExistingNFTs();
                }
                
                // Запоминаем время последней успешной проверки
                window.lastSuccessfulNftCheck = Date.now();
                
                // Прекращаем попытки, если операция успешна
                return;
              } else {
                throw new Error('NFT check unsuccessful');
              }
            } catch (error: any) {
              const errorMessage = error?.message || 'Unknown error';
              console.error(`Error in NFT check attempt ${retryCount + 1}:`, errorMessage);
              
              retryCount++;
              if (retryCount < maxRetries && mounted) {
                console.log(`Scheduling retry in ${retryInterval}ms...`);
                // Очищаем предыдущий таймаут, если он существует
                if (nftCheckTimeout) clearTimeout(nftCheckTimeout);
                nftCheckTimeout = setTimeout(attemptNftCheck, retryInterval);
              } else if (retryCount >= maxRetries) {
                console.warn('Maximum NFT check retries reached. Consider refreshing the page if NFT data is not visible.');
              }
            }
          };
          
          // Добавляем небольшую задержку перед первой попыткой для стабилизации соединения
          const initialDelay = walletType === 'phantom' ? 2500 : 1000; // Большая задержка для Phantom
          console.log(`Scheduling initial NFT check in ${initialDelay}ms...`);
          
          nftCheckTimeout = setTimeout(async () => {
            // Принудительно обновляем метаплекс перед первой попыткой
            metaplexRef.current = null;
            
            // Запускаем первую попытку
            await attemptNftCheck();
          }, initialDelay);
          
          // Запускаем периодическое обновление NFT каждые 30 секунд
          // для решения проблемы с отображением NFT для разных кошельков
          periodicCheckInterval = setInterval(async () => {
            if (mounted && connected && publicKey) {
              console.log("Running periodic NFT check...");
              metaplexRef.current = null; // Сброс кэша перед каждой проверкой
              await checkNFTOwnership();
            }
          }, 30000);
        } catch (error: any) {
          console.error('Error initializing NFT data:', error?.message || 'Unknown error');
        }
      } else {
        // Сбрасываем состояние при отключении кошелька
        setNfts([]);
        setOwnedNFTs({});
        setIsNFT3Available(false);
        setTotalPoints(0);
      }
    };
    
    // Запускаем инициализацию
    init();
    
    // Обработчик принудительного обновления NFT
    const handleForceNftUpdate = () => {
      console.log("Force NFT update event received");
      if (connected && publicKey) {
        // Очищаем предыдущий таймаут, если есть
        if (nftCheckTimeout) clearTimeout(nftCheckTimeout);
        
        // Проверяем, был ли этот вызов инициирован Phantom кошельком
        const isPhantomSpecific = window.phantomSpecificUpdate === true;
        if (isPhantomSpecific) {
          console.log("Handling Phantom-specific NFT update");
        }
        
        // Устанавливаем новый таймаут с небольшой задержкой
        // Увеличиваем задержку для Phantom, так как он требует больше времени на инициализацию
        const delay = isPhantomSpecific ? 1000 : 500;
        
        nftCheckTimeout = setTimeout(() => {
          if (mounted) {
            // Сбрасываем кэш Metaplex
            metaplexRef.current = null;
            console.log("Triggering NFT check after forced update");
            
            // Запускаем проверку NFT
            checkNFTOwnership().then(success => {
              if (success && mounted) {
                // Если успешно, обновляем точки
                syncPointsForExistingNFTs();
                console.log("NFT forced update successful");
                // Сбрасываем флаги и счетчики
                window.nftUpdateAttempts = 0;
                window.phantomSpecificUpdate = false;
              } else if (mounted) {
                // Если неуспешно, повторяем через некоторое время
                // Увеличиваем задержку с каждой попыткой
                const retryCount = window.nftUpdateAttempts || 0;
                const retryDelay = Math.min(2000 + (retryCount * 1000), 5000); // Макс. 5 секунд между попытками
                
                console.log(`NFT update attempt failed. Retrying in ${retryDelay}ms...`);
                setTimeout(() => {
                  if (mounted) {
                    console.log(`Retrying forced NFT update (attempt ${retryCount + 1})`);
                    metaplexRef.current = null;
                    window.forceNftRefresh = true;
                    checkNFTOwnership().then(retrySuccess => {
                      if (retrySuccess && mounted) {
                        syncPointsForExistingNFTs();
                        console.log("NFT retry update successful");
                        window.nftUpdateAttempts = 0;
                      } else if (mounted) {
                        console.warn("NFT retry update failed, consider refreshing the page");
                      }
                    });
                  }
                }, retryDelay);
              }
            });
          }
        }, delay);
      }
    };
    
    // Также слушаем событие восстановления состояния кошелька
    const handleWalletStateRestored = (event: CustomEvent) => {
      console.log("Wallet state restored event received:", event.detail);
      if (event.detail?.connected && event.detail?.publicKey) {
        // Даем немного времени для инициализации других компонентов
        if (nftCheckTimeout) clearTimeout(nftCheckTimeout);
        nftCheckTimeout = setTimeout(() => {
          if (mounted) {
            console.log("Triggering NFT check after wallet state restore");
            // Сбрасываем кэш Metaplex
            metaplexRef.current = null;
            // Запускаем проверку NFT с принудительным обновлением
            window.forceNftRefresh = true;
            checkNFTOwnership().then(() => {
              if (mounted) {
                syncPointsForExistingNFTs();
              }
            });
          }
        }, 1000);
      }
    };
    
    // Слушаем события изменения кошелька для обновления NFT
    const handleWalletConnectionChanged = (event: CustomEvent) => {
      console.log("Wallet connection changed event received:", event.detail);
      // Проверяем, подключен ли кошелек и запрошено ли принудительное обновление
      const shouldForceUpdate = event.detail?.forceUpdate === true;
      
      if ((event.detail?.connected && event.detail?.publicKey) || shouldForceUpdate) {
        // Даем небольшую задержку для стабилизации состояния
        if (nftCheckTimeout) clearTimeout(nftCheckTimeout);
        
        // Меньшая задержка при принудительном обновлении
        const delay = shouldForceUpdate ? 100 : 1000;
        
        nftCheckTimeout = setTimeout(() => {
          if (mounted) {
            console.log(`Triggering NFT check after ${shouldForceUpdate ? 'forced update' : 'wallet connection change'}`);
            // Сбрасываем кэш Metaplex
            metaplexRef.current = null;
            // Запускаем проверку NFT с принудительным обновлением
            window.forceNftRefresh = true;
            checkNFTOwnership().then(success => {
              // Если первая попытка не удалась, повторяем через 2 секунды
              if (!success && mounted) {
                // Увеличиваем счетчик попыток
                window.nftUpdateAttempts = (window.nftUpdateAttempts || 0) + 1;
                console.log(`NFT update attempt failed. Total attempts: ${window.nftUpdateAttempts}`);
                
                // Не повторяем бесконечно, максимум 5 попыток
                if ((window.nftUpdateAttempts || 0) < 5) {
                  setTimeout(() => {
                    if (mounted) {
                      console.log(`Retrying NFT check, attempt ${window.nftUpdateAttempts}`);
                      metaplexRef.current = null;
                      window.forceNftRefresh = true;
                      checkNFTOwnership();
                    }
                  }, 2000);
                } else {
                  console.warn('Maximum NFT update attempts reached. Consider refreshing the page.');
                }
              } else if (success) {
                // Сбрасываем счетчик попыток при успехе
                window.nftUpdateAttempts = 0;
              }
            });
          }
        }, delay);
      }
    };
    
    // Обработчик для особого события Phantom кошелька
    const handlePhantomConnected = (event: CustomEvent) => {
      console.log("Phantom-connected event received:", event.detail);
      
      if (mounted && publicKey) {
        // Очищаем предыдущий таймаут
        if (nftCheckTimeout) clearTimeout(nftCheckTimeout);
        
        nftCheckTimeout = setTimeout(() => {
          // Сбрасываем кэш Metaplex
          metaplexRef.current = null;
          
          // Принудительно обновляем NFT с флагом для Phantom
          window.forceNftRefresh = true;
          window.phantomSpecificUpdate = true;
          
          console.log("Starting Phantom-specific NFT update...");
          
          // Запускаем проверку NFT с специальными настройками для Phantom
          checkNFTOwnership().then(success => {
            if (!success && mounted) {
              // Если первая попытка не удалась, пробуем еще раз с большей задержкой
              setTimeout(() => {
                window.forceNftRefresh = true;
                metaplexRef.current = null; // Сбрасываем кэш еще раз
                
                // Последняя попытка - прямое использование Phantom publicKey
                if (window.solana?.publicKey) {
                  console.log("Using direct Phantom publicKey for last attempt");
                  try {
                    const phantomKey = window.solana.publicKey;
                    
                    // Создаем новый Metaplex инстанс специально для Phantom
                    const connection = getConnection();
                    const metaplex = new Metaplex(connection);
                    
                    // Создаем идентификацию для Phantom
                    const phantomIdentity = {
                      publicKey: phantomKey,
                      signMessage: async () => { throw new Error('Not implemented'); },
                      signTransaction: async (tx: Transaction) => {
                        return await window.solana!.signTransaction(tx);
                      },
                      signAllTransactions: async (txs: Transaction[]) => {
                        return await window.solana!.signAllTransactions(txs);
                      }
                    };
                    
                    // Устанавливаем идентификацию
                    // @ts-ignore
                    metaplex.use({ install: (mx: any) => mx.identity(phantomIdentity) });
                    
                    // Сохраняем новый Metaplex
                    metaplexRef.current = metaplex;
                    
                    // Запускаем проверку NFT
                    checkNFTOwnership();
                  } catch (err) {
                    console.error("Final Phantom NFT check attempt failed:", err);
                  }
                }
              }, 3000);
            }
          });
        }, 1000);
      }
    };
    
    // Обработчик для события несоответствия Phantom ключей
    const handlePhantomKeyMismatch = (event: CustomEvent) => {
      console.log("Phantom key mismatch event received:", event.detail);
      
      // Установим флаг принудительного обновления
      window.forceNftRefresh = true;
      
      if (mounted) {
        // Сбрасываем кэш Metaplex
        metaplexRef.current = null;
        
        // Пробуем использовать ключ от Phantom
        if (window.solana?.publicKey) {
          console.log("Attempting to use Phantom's public key for NFT check");
          
          // Создаем новый Metaplex
          const connection = getConnection();
          const metaplex = new Metaplex(connection);
          
          // Создаем идентификацию для Phantom
          const phantomIdentity = {
            publicKey: window.solana.publicKey,
            signMessage: async () => { throw new Error('Not implemented'); },
            signTransaction: async (tx: Transaction) => {
              return await window.solana!.signTransaction(tx);
            },
            signAllTransactions: async (txs: Transaction[]) => {
              return await window.solana!.signAllTransactions(txs);
            }
          };
          
          // Устанавливаем идентификацию
          // @ts-ignore
          metaplex.use({ install: (mx: any) => mx.identity(phantomIdentity) });
          
          // Сохраняем новый Metaplex
          metaplexRef.current = metaplex;
          
          // Запускаем проверку NFT с небольшой задержкой
          setTimeout(() => {
            if (mounted) {
              checkNFTOwnership();
            }
          }, 1000);
        }
      }
    };
    
    // Добавляем обработчики событий
    if (typeof window !== 'undefined') {
      window.addEventListener('walletStateRestored', handleWalletStateRestored as EventListener);
      window.addEventListener('walletConnectionChanged', handleWalletConnectionChanged as EventListener);
      window.addEventListener('wallet-connection-change', handleWalletConnectionChanged as EventListener);
      window.addEventListener('forceNftUpdate', handleForceNftUpdate as EventListener);
      window.addEventListener('phantom-connected', handlePhantomConnected as EventListener);
      window.addEventListener('phantomKeyMismatch', handlePhantomKeyMismatch as EventListener);
    }
    
    // Cleanup функция для useEffect
    return () => {
      mounted = false;
      
      // Очищаем все таймауты и интервалы
      if (nftCheckTimeout) clearTimeout(nftCheckTimeout);
      if (periodicCheckInterval) clearInterval(periodicCheckInterval);
      
      // Удаляем обработчики событий
      if (typeof window !== 'undefined') {
        window.removeEventListener('walletStateRestored', handleWalletStateRestored as EventListener);
        window.removeEventListener('walletConnectionChanged', handleWalletConnectionChanged as EventListener);
        window.removeEventListener('wallet-connection-change', handleWalletConnectionChanged as EventListener);
        window.removeEventListener('forceNftUpdate', handleForceNftUpdate as EventListener);
        window.removeEventListener('phantom-connected', handlePhantomConnected as EventListener);
        window.removeEventListener('phantomKeyMismatch', handlePhantomKeyMismatch as EventListener);
      }
    };
  }, [connected, publicKey]);

  // Реагируем на изменение глобального типа кошелька
  useEffect(() => {
    const handleWalletTypeChange = () => {
      if (connected && publicKey) {
        // Если тип кошелька изменился, сбрасываем кэш Metaplex и обновляем NFT
        console.log("Wallet type changed, refreshing NFT data");
        metaplexRef.current = null;
        checkNFTOwnership();
      }
    };
    
    // Устанавливаем обработчик для отслеживания изменений типа кошелька
    if (typeof window !== 'undefined') {
      const originalSetProperty = Object.getOwnPropertyDescriptor(window, '__WALLET_TYPE__')?.set;
      
      // Заменяем сеттер для __WALLET_TYPE__, чтобы отслеживать изменения
      Object.defineProperty(window, '__WALLET_TYPE__', {
        set: function(value) {
          console.log(`Wallet type changing to: ${value}`);
          // Вызываем оригинальный сеттер
          if (originalSetProperty) {
            originalSetProperty.call(this, value);
          } else {
            this.__wallet_type = value;
          }
          
          // Запускаем обновление NFT
          handleWalletTypeChange();
        },
        get: function() {
          return this.__wallet_type;
        },
        configurable: true
      });
    }
    
    return () => {
      // Восстанавливаем оригинальный сеттер при размонтировании
      if (typeof window !== 'undefined' && Object.getOwnPropertyDescriptor(window, '__WALLET_TYPE__')) {
        Object.defineProperty(window, '__WALLET_TYPE__', {
          value: window.__WALLET_TYPE__,
          writable: true,
          configurable: true
        });
      }
    };
  }, [connected, publicKey]);

  // Значение контекста
  const value = {
    nfts,
    isLoading,
    isNFT3Available,
    ownedNFTs,
    purchaseNFT,
    refreshNFTs,
    totalPoints,
    syncPoints: syncPointsForExistingNFTs,
    forceUpdatePoints: async (points: number) => {
      if (!publicKey || !connected) return;
      
      try {
        // Отправляем запрос на сервер для принудительного обновления баллов
        const response = await fetch('/api/nft/force-update-points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress: publicKey.toString(),
            points
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Points force updated:', result);
          
          // Обновляем точки в интерфейсе
          setTotalPoints(points);
        } else {
          // Если ответ не OK, выводим больше информации об ошибке
          const errorData = await response.json();
          console.error('Error force updating points:', response.status, errorData);
        }
      } catch (error) {
        console.error('Error force updating points:', error);
      }
    }
  };

  return (
    <SolanaNftContext.Provider value={value}>
      {children}
    </SolanaNftContext.Provider>
  );
} 