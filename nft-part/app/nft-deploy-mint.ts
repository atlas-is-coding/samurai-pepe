import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  Keypair,
  PublicKey,
  Connection,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { 
  createAssociatedTokenAccountInstruction, 
  getAssociatedTokenAddress,
  createAssociatedTokenAccount,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Загрузка IDL из локального файла
const idlPath = path.resolve(__dirname, '../target/idl/nft_program.json');
const idlFile = fs.readFileSync(idlPath, 'utf8');
const idl = JSON.parse(idlFile);

// Данные коллекции и NFT
const COLLECTION_CONFIG = {
  name: 'Samurai Collection',
  symbol: 'SAM',
  uri: 'https://blush-defensive-anglerfish-127.mypinata.cloud/ipfs/bafkreihhsdavk7doczza7mgkqyvixo7yjvb3j4zwz7kbb6gv2lpnayx4xy',
  price: 0,
};

// Конфигурация для большой коллекции NFT
const LARGE_COLLECTION_CONFIG = {
  name: 'Samurai Large Collection',
  symbol: 'SAML',
  uri: 'https://blush-defensive-anglerfish-127.mypinata.cloud/ipfs/bafkreihhsdavk7doczza7mgkqyvixo7yjvb3j4zwz7kbb6gv2lpnayx4xy',
  price: 0,
  supply: 10000, // Количество токенов для минта
};

const NFT_CONFIGS = [
  {
    name: 'Kojo (Common)',
    symbol: 'SAM',
    uri: 'https://blush-defensive-anglerfish-127.mypinata.cloud/ipfs/bafkreifjglef3hxqc37ryvi4v4fb45uieietqjagqugskkv7clf5j7rdxm',
    price: 0.5,
    supply: 5000, // Добавляем количество токенов для этого типа NFT
  },
  {
    name: 'Daimyo (Rare)',
    symbol: 'SAM',
    uri: 'https://blush-defensive-anglerfish-127.mypinata.cloud/ipfs/bafkreiejg3orncrnt2w4mkiwvb6jfbkre5vfzjrzjoyh23nxvvyfm2uqua',
    price: 1,
    supply: 3000, // Добавляем количество токенов для этого типа NFT
  },
  {
    name: 'Shogun (Legendary)',
    symbol: 'SAM',
    uri: 'https://blush-defensive-anglerfish-127.mypinata.cloud/ipfs/bafkreichpdjmt6z7rpw5jucd4vyc5mwe2lcmle77vgqwgphpicsek5ie7q',
    price: 2,
    supply: 2000, // Добавляем количество токенов для этого типа NFT
  },
];

// ID программы - используем ID из Anchor.toml
const PROGRAM_ID = new PublicKey('9uJ8yGTieFKj2f3XixAfuBAdFmavEoVNgCZgkcK56KrJ');

// Путь к файлу ключа кошелька
const WALLET_PATH = path.resolve(process.env.HOME!, '.config/solana/id.json');

// Используем случайный ID для коллекции, чтобы избежать конфликтов
const COLLECTION_ID = Math.floor(Math.random() * 1000000) + 100;

// Основная функция
async function main() {
  // Подключение к Solana Devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Загрузка keypair из файла
  const walletKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8')))
  );
  
  console.log('Используемый адрес:', walletKeypair.publicKey.toString());
  
  // Проверка баланса кошелька
  const balance = await connection.getBalance(walletKeypair.publicKey);
  console.log(`Баланс: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < LAMPORTS_PER_SOL) {
    console.log('Предупреждение: Низкий баланс кошелька. Рекомендуется пополнить кошелек для транзакций.');
    const airdropSignature = await connection.requestAirdrop(walletKeypair.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(airdropSignature);
    console.log('Получен аирдроп 2 SOL');
  }
  
  // Настройка провайдера Anchor
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(walletKeypair),
    { commitment: 'confirmed' }
  );
  anchor.setProvider(provider);
  
  // Создание экземпляра программы с локальным IDL
  console.log('Инициализация программы с ID:', PROGRAM_ID.toString());
  const program = new anchor.Program(idl, PROGRAM_ID, provider);
  console.log('Программа успешно инициализирована');
  
  // Функция для получения адреса mint на основе ID
  function getMintAddress(id: number) {
    const [mintAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint'), Buffer.from(new anchor.BN(id).toArray('le', 8))],
      program.programId
    );
    return mintAddress;
  }
  
  // Функция для проверки существования аккаунта
  async function checkAccountExists(pubkey: PublicKey) {
    try {
      const accountInfo = await connection.getAccountInfo(pubkey);
      return accountInfo !== null;
    } catch (error) {
      console.error('Ошибка при проверке аккаунта:', error);
      return false;
    }
  }
  
  // Функция для поиска свободного ID
  async function findAvailableCollectionId() {
    let id = COLLECTION_ID;
    let mintAddress = getMintAddress(id);
    
    while (await checkAccountExists(mintAddress)) {
      console.log(`ID ${id} уже используется, пробуем следующий...`);
      id++;
      mintAddress = getMintAddress(id);
    }
    
    console.log(`Найден свободный ID для коллекции: ${id}`);
    return id;
  }
  
  // Функция для создания коллекции
  async function createCollection() {
    const collectionId = await findAvailableCollectionId(); // Используем свободный ID
    
    console.log(`Создание коллекции "${COLLECTION_CONFIG.name}" с ID: ${collectionId}...`);
    
    // Получение адреса mint для коллекции
    const collectionMint = getMintAddress(collectionId);
    
    console.log('Адрес коллекции mint:', collectionMint.toString());
    
    // Получение адреса token account
    const tokenAccount = await getAssociatedTokenAddress(
      collectionMint,
      walletKeypair.publicKey
    );
    
    console.log('Адрес token account:', tokenAccount.toString());
    
    // Получение адреса metadata account и master edition
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        collectionMint.toBuffer(),
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    
    const [masterEditionAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        collectionMint.toBuffer(),
        Buffer.from('edition'),
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    
    console.log('Адрес metadata account:', metadataAccount.toString());
    console.log('Адрес master edition account:', masterEditionAccount.toString());
    
    try {
      console.log('Вызов метода createSingleNft...');
      
      // Создание коллекции
      const tx = await program.methods
        .createSingleNft(
          new anchor.BN(collectionId),
          COLLECTION_CONFIG.name,
          COLLECTION_CONFIG.symbol,
          COLLECTION_CONFIG.uri,
          COLLECTION_CONFIG.price,
          new anchor.BN(0)
        )
        .accounts({
          authority: walletKeypair.publicKey,
          payer: walletKeypair.publicKey,
          mint: collectionMint,
          tokenAccount: tokenAccount,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
          masterEditionAccount: masterEditionAccount,
          nftMetadata: metadataAccount,
        })
        .signers([walletKeypair])
        .rpc();
      
      console.log(`Коллекция успешно создана. Транзакция: ${tx}`);
      console.log(`Адрес коллекции: ${collectionMint.toString()}`);
      
      return { collectionMint, collectionId };
    } catch (error) {
      console.error('Ошибка при создании коллекции:', error);
      throw error;
    }
  }
  
  // Функция для создания большой коллекции NFT без Master Edition
  async function createLargeNftCollection() {
    const collectionId = await findAvailableCollectionId(); // Используем свободный ID
    
    console.log(`Создание большой коллекции "${LARGE_COLLECTION_CONFIG.name}" с ID: ${collectionId}...`);
    
    // Получение адреса mint для коллекции
    const collectionMint = getMintAddress(collectionId);
    
    console.log('Адрес коллекции mint:', collectionMint.toString());
    
    // Получение адреса token account
    const tokenAccount = await getAssociatedTokenAddress(
      collectionMint,
      walletKeypair.publicKey
    );
    
    console.log('Адрес token account:', tokenAccount.toString());
    
    // Получение адреса metadata account
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        collectionMint.toBuffer(),
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    
    // Master Edition не нужен для большой коллекции
    const [masterEditionAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        collectionMint.toBuffer(),
        Buffer.from('edition'),
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    
    console.log('Адрес metadata account:', metadataAccount.toString());
    
    try {
      console.log('Вызов метода createLargeNftCollection...');
      
      // Создание большой коллекции NFT
      const tx = await program.methods
        .createLargeNftCollection(
          new anchor.BN(collectionId),
          LARGE_COLLECTION_CONFIG.name,
          LARGE_COLLECTION_CONFIG.symbol,
          LARGE_COLLECTION_CONFIG.uri,
          LARGE_COLLECTION_CONFIG.price,
          new anchor.BN(LARGE_COLLECTION_CONFIG.supply)
        )
        .accounts({
          authority: walletKeypair.publicKey,
          payer: walletKeypair.publicKey,
          mint: collectionMint,
          tokenAccount: tokenAccount,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
          masterEditionAccount: masterEditionAccount,
          nftMetadata: metadataAccount,
        })
        .signers([walletKeypair])
        .rpc();
      
      console.log(`Большая коллекция NFT успешно создана. Транзакция: ${tx}`);
      console.log(`Адрес коллекции: ${collectionMint.toString()}`);
      console.log(`Количество выпущенных токенов: ${LARGE_COLLECTION_CONFIG.supply}`);
      
      return { collectionMint, collectionId };
    } catch (error) {
      console.error('Ошибка при создании большой коллекции NFT:', error);
      throw error;
    }
  }
  
  // Функция для минта большого количества NFT
  async function mintLargeNftCollection(
    collectionId: number,
    nftConfig: typeof NFT_CONFIGS[0],
    nftId: number,
    proxyMint = false
  ) {
    const uniqueNftId = collectionId * 1000 + nftId; // Уникальный ID для NFT
    console.log(`Минтинг большой коллекции NFT "${nftConfig.name}" (ID: ${uniqueNftId}, Supply: ${nftConfig.supply})...`);
    
    // Определение кошелька для минтинга
    const proxyKeypair = proxyMint ? Keypair.generate() : walletKeypair;
    
    // Если используем proxy-минтинг, нужно отправить SOL промежуточному кошельку
    if (proxyMint) {
      console.log(`Используем прокси-минтинг через адрес: ${proxyKeypair.publicKey.toString()}`);
      
      // Проверяем минимальный баланс для аренды
      const rentExemption = await connection.getMinimumBalanceForRentExemption(165);
      
      // Отправляем достаточно SOL для всех операций и поддержания аккаунтов
      const neededSol = LAMPORTS_PER_SOL * 0.5; // Увеличиваем до 0.5 SOL
      
      console.log(`Минимальный баланс для rent exemption: ${rentExemption / LAMPORTS_PER_SOL} SOL`);
      console.log(`Отправляем ${neededSol / LAMPORTS_PER_SOL} SOL на прокси-кошелек`);
      
      const transferTx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletKeypair.publicKey,
          toPubkey: proxyKeypair.publicKey,
          lamports: neededSol,
        })
      );
      
      await sendAndConfirmTransaction(connection, transferTx, [walletKeypair]);
      console.log(`Отправлено ${neededSol / LAMPORTS_PER_SOL} SOL на прокси-кошелек`);
      
      // Проверяем баланс прокси-кошелька
      const proxyBalance = await connection.getBalance(proxyKeypair.publicKey);
      console.log(`Баланс прокси-кошелька: ${proxyBalance / LAMPORTS_PER_SOL} SOL`);
    }
    
    // Получение адреса mint для NFT
    const [nftMint] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('mint'),
        Buffer.from(new anchor.BN(uniqueNftId).toArray('le', 8)),
      ],
      program.programId
    );
    
    console.log('Адрес NFT mint:', nftMint.toString());
    
    // Получение адреса token account
    const tokenAccount = await getAssociatedTokenAddress(
      nftMint,
      proxyKeypair.publicKey
    );
    
    console.log('Адрес token account:', tokenAccount.toString());
    
    // Получение адреса metadata account
    const [metadataAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        nftMint.toBuffer(),
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    
    // Master Edition не нужен, но для совместимости с API
    const [masterEditionAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
        nftMint.toBuffer(),
        Buffer.from('edition'),
      ],
      new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
    );
    
    console.log('Адрес metadata account:', metadataAccount.toString());
    
    try {
      console.log('Вызов метода createLargeNftCollection...');
      
      const tx = await program.methods
        .createLargeNftCollection(
          new anchor.BN(uniqueNftId),
          nftConfig.name,
          nftConfig.symbol,
          nftConfig.uri,
          nftConfig.price,
          new anchor.BN(nftConfig.supply)
        )
        .accounts({
          authority: proxyKeypair.publicKey,
          payer: proxyKeypair.publicKey,
          mint: nftMint,
          tokenAccount: tokenAccount,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
          masterEditionAccount: masterEditionAccount,
          nftMetadata: metadataAccount,
        })
        .signers(proxyMint ? [proxyKeypair] : [walletKeypair])
        .rpc({ commitment: 'confirmed' });
      
      console.log(`NFT с ${nftConfig.supply} токенами успешно создан. Транзакция: ${tx}`);
      console.log(`Адрес NFT: ${nftMint.toString()}`);
      
      if (proxyMint) {
        // Сохраняем данные прокси-кошелька в файл для будущего доступа
        const walletData = {
          publicKey: proxyKeypair.publicKey.toString(),
          secretKey: Array.from(proxyKeypair.secretKey),
          nftMint: nftMint.toString(),
          nftName: nftConfig.name,
          nftSupply: nftConfig.supply,
          createdAt: new Date().toISOString()
        };
        
        const walletDir = path.resolve(__dirname, '../wallets');
        if (!fs.existsSync(walletDir)) {
          fs.mkdirSync(walletDir, { recursive: true });
        }
        
        const walletFilePath = path.resolve(walletDir, `proxy_wallet_${nftConfig.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
        fs.writeFileSync(walletFilePath, JSON.stringify(walletData, null, 2));
        
        console.log(`Данные прокси-кошелька сохранены в файл: ${walletFilePath}`);
      }
      
      return { nftMint, nftId: uniqueNftId, proxyKeypair: proxyMint ? proxyKeypair : null };
    } catch (error) {
      console.error(`Ошибка при минтинге NFT ${nftConfig.name}:`, error);
      throw error;
    }
  }
  
  // Запуск процесса
  try {
    // Создаем коллекцию для использования ее в качестве коллекции для NFT
    const { collectionMint, collectionId } = await createCollection();
    console.log(`Создана коллекция: ${collectionMint.toString()}`);
    
    // Минтинг каждого типа NFT с большим количеством токенов
    for (let i = 0; i < NFT_CONFIGS.length; i++) {
      // Минтим NFT с большим количеством токенов
      await mintLargeNftCollection(collectionId, NFT_CONFIGS[i], i + 1, true);
      
      // Добавляем паузу между минтами
      if (i < NFT_CONFIGS.length - 1) {
        console.log('Пауза 2 секунды перед следующим минтом...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('Все NFT успешно созданы с большим количеством токенов!');
  } catch (error) {
    console.error('Ошибка при выполнении скрипта:', error);
  }
}

// Запуск скрипта
main().then(() => {
  console.log('Скрипт завершен');
  process.exit(0);
}).catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
}); 