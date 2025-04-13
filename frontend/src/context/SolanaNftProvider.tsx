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

// Candy Machine адрес
export const CANDY_MACHINE_ADDRESS = 'FJZPK92GWTCMLkSwzbwA5k2UGC9rmYAZo9ZsZgqWoG79';

// Информация о прокси-кошельках для NFT
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
      metaplexRef.current = new Metaplex(getConnection());
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
      signTransaction: signTransaction || ((tx: any) => Promise.resolve(tx)),
      signAllTransactions: signAllTransactions || ((txs: any) => Promise.resolve(txs)),
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

  // Функция для проверки владения NFT
  const checkNFTOwnership = async () => {
    if (!publicKey || !connected) return;
    
    const now = Date.now();
    // Ограничиваем запросы до одного в 10 секунд
    const MIN_REFRESH_INTERVAL = 10000; // 10 секунд
    
    if (now - lastRefreshTime.current < MIN_REFRESH_INTERVAL) {
      console.log('Too frequent requests to RPC, skipping update');
      return;
    }
    
    setIsLoading(true);
    try {
      lastRefreshTime.current = now;
      
      const metaplex = getMetaplex();
      
      // Получаем все NFT пользователя
      const userNFTs = await metaplex.nfts().findAllByOwner({ owner: publicKey });
      
      console.log('Found NFTs for user:', userNFTs.length);
      
      // Выводим в лог все NFT для отладки
      userNFTs.forEach((nft, index) => {
        console.log(`NFT #${index}:`, {
          name: nft.name,
          address: nft.address.toBase58(),
          collection: nft.collection?.address.toBase58() || 'no collection',
          symbol: nft.symbol,
          uri: nft.uri
        });
      });
      
      // Проверяем наличие конкретных NFT с более гибкими критериями
      const nft1Count = userNFTs.filter(nft => 
        (nft.collection?.address.toBase58() === NFT_ADDRESSES.NFT1 || 
         nft.address.toBase58() === NFT_ADDRESSES.NFT1 ||
         (nft.name && nft.name.toLowerCase().includes('kōjō') || nft.name?.toLowerCase().includes('kojo')))
      ).length;
      
      const nft2Count = userNFTs.filter(nft => 
        (nft.collection?.address.toBase58() === NFT_ADDRESSES.NFT2 || 
         nft.address.toBase58() === NFT_ADDRESSES.NFT2 ||
         (nft.name && nft.name.toLowerCase().includes('daimyō') || nft.name?.toLowerCase().includes('daimyo')))
      ).length;
      
      const nft3Count = userNFTs.filter(nft => 
        (nft.collection?.address.toBase58() === NFT_ADDRESSES.NFT3 || 
         nft.address.toBase58() === NFT_ADDRESSES.NFT3 ||
         (nft.name && nft.name.toLowerCase().includes('shōgun') || nft.name?.toLowerCase().includes('shogun')))
      ).length;
      
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
          image: '/nft/nft1.svg', // Обновлен путь к SVG изображению
          count: nft1Count
        },
        {
          mint: NFT_ADDRESSES.NFT2,
          name: 'Daimyō (Rare)',
          image: '/nft/nft2.svg', // Обновлен путь к SVG изображению
          count: nft2Count
        },
        {
          mint: NFT_ADDRESSES.NFT3,
          name: 'Shōgun (Legendary)',
          image: '/nft/nft3.svg', // Обновлен путь к SVG изображению
          count: nft3Count
        }
      ];
      
      // Фильтруем только NFT, которые есть у пользователя
      const filteredNFTs = availableNFTs.filter(nft => nft.count > 0);
      
      setNfts(filteredNFTs);
    } catch (error) {
      console.error('Error checking NFT:', error);
    } finally {
      setIsLoading(false);
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
      
      // Устанавливаем недавний blockhash и fee payer
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
        // Пробуем получить метод подписи через Phantom API (для случаев, когда useWallet не работает)
        if (typeof window !== 'undefined' && window.solana && window.solana.signTransaction) {
          console.log("Attempting to sign transaction using window.solana.signTransaction");
          try {
            // @ts-ignore - Используем Phantom API напрямую
            const signedTransaction = await window.solana.signTransaction(transaction);
            
            // Отправляем транзакцию в сеть
            const paymentSignature = await getConnection().sendRawTransaction(signedTransaction.serialize());
            
            // Продолжаем как обычно...
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
            console.error("Error using window.solana.signTransaction:", err);
            toast.error('Failed to sign transaction. Try refreshing the page.');
            return false;
          }
        } else {
          toast.error('Wallet adapter не поддерживает подписание транзакций');
          return false;
        }
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
    
    const init = async () => {
      if (connected && publicKey) {
        try {
          // Сначала проверяем NFT
          await checkNFTOwnership();
          
          // Теперь, когда у нас есть информация о NFT, синхронизируем баллы
          if (mounted) {
            await syncPointsForExistingNFTs();
          }
        } catch (error) {
          console.error('Error initializing NFT data:', error);
        }
      } else {
        // Сбрасываем состояние при отключении кошелька
        setNfts([]);
        setOwnedNFTs({});
        setIsNFT3Available(false);
        setTotalPoints(0);
      }
    };
    
    init();
    
    // Cleanup функция для useEffect
    return () => {
      mounted = false;
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