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
  getAssociatedTokenAddress, 
  getAccount,
  createTransferInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import * as fs from 'fs';
import * as path from 'path';

// Загрузка IDL из локального файла
const idlPath = path.resolve(__dirname, '../target/idl/nft_program.json');
const idlFile = fs.readFileSync(idlPath, 'utf8');
const idl = JSON.parse(idlFile);

// ID программы
const PROGRAM_ID = new PublicKey('9uJ8yGTieFKj2f3XixAfuBAdFmavEoVNgCZgkcK56KrJ');

// Путь к файлу ключа кошелька
const WALLET_PATH = path.resolve(process.env.HOME!, '.config/solana/id.json');

// Директория с сохраненными прокси кошельками
const WALLETS_DIR = path.resolve(__dirname, '../wallets');

async function main() {
  // Подключение к Solana Devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
  // Загрузка основного keypair из файла
  const mainKeypair = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_PATH, 'utf8')))
  );
  
  console.log('Основной адрес:', mainKeypair.publicKey.toString());
  
  // Проверка баланса основного кошелька
  const mainBalance = await connection.getBalance(mainKeypair.publicKey);
  console.log(`Баланс основного кошелька: ${mainBalance / LAMPORTS_PER_SOL} SOL`);
  
  // Получение списка сохраненных прокси кошельков
  const walletFiles = fs.readdirSync(WALLETS_DIR).filter(file => file.startsWith('proxy_wallet_'));
  
  if (walletFiles.length === 0) {
    console.error('Не найдены сохраненные прокси-кошельки. Сначала запустите скрипт mint-deploy-nft.ts');
    process.exit(1);
  }
  
  console.log(`Найдено ${walletFiles.length} прокси-кошельков`);
  
  // Настройка провайдера Anchor для основного кошелька
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(mainKeypair),
    { commitment: 'confirmed' }
  );
  anchor.setProvider(provider);
  
  // Создание экземпляра программы с локальным IDL
  const program = new anchor.Program(idl, PROGRAM_ID, provider);
  
  // Функция для проверки NFT в прокси-кошельке
  async function checkProxyNft(walletFile: string) {
    const walletPath = path.resolve(WALLETS_DIR, walletFile);
    const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
    
    // Восстановление прокси-кошелька из сохраненных данных
    const proxyKeypair = Keypair.fromSecretKey(
      Uint8Array.from(walletData.secretKey)
    );
    
    const nftMint = new PublicKey(walletData.nftMint);
    const nftName = walletData.nftName;
    const nftSupply = walletData.nftSupply || 1; // Если не указано, считаем что 1
    
    console.log(`\nПроверка NFT "${nftName}" в прокси-кошельке: ${proxyKeypair.publicKey.toString()}`);
    console.log(`Адрес NFT mint: ${nftMint.toString()}`);
    console.log(`Ожидаемое количество токенов: ${nftSupply}`);
    
    // Проверка баланса прокси-кошелька
    try {
      const proxyBalance = await connection.getBalance(proxyKeypair.publicKey);
      console.log(`Баланс прокси-кошелька: ${proxyBalance / LAMPORTS_PER_SOL} SOL`);
      
      // Получение адреса token account
      const tokenAccountAddress = await getAssociatedTokenAddress(
        nftMint,
        proxyKeypair.publicKey
      );
      
      console.log(`Адрес token account: ${tokenAccountAddress.toString()}`);
      
      // Проверка существования token account
      try {
        const tokenAccount = await getAccount(connection, tokenAccountAddress);
        console.log(`Количество токенов NFT: ${tokenAccount.amount}`);
        console.log(`Токен найден! NFT "${nftName}" успешно заминчен через прокси.`);
        
        return {
          proxyKeypair,
          nftMint,
          nftName,
          tokenAccountAddress,
          tokenAmount: tokenAccount.amount
        };
      } catch (error) {
        console.error(`Ошибка при получении информации о token account: ${error}`);
        return null;
      }
    } catch (error) {
      console.error(`Ошибка при проверке прокси-кошелька: ${error}`);
      return null;
    }
  }
  
  // Функция для передачи одного токена от прокси к основному кошельку
  async function transferNftFromProxy(
    proxyKeypair: Keypair,
    nftMint: PublicKey,
    nftName: string
  ) {
    try {
      console.log(`\nПередача одного NFT "${nftName}" от прокси к основному кошельку...`);
      
      // Получение адресов token account
      const proxyTokenAccount = await getAssociatedTokenAddress(
        nftMint,
        proxyKeypair.publicKey
      );
      
      const mainTokenAccount = await getAssociatedTokenAddress(
        nftMint,
        mainKeypair.publicKey
      );
      
      console.log(`Адрес token account отправителя: ${proxyTokenAccount.toString()}`);
      console.log(`Адрес token account получателя: ${mainTokenAccount.toString()}`);
      
      // Проверяем существование token account получателя
      let mainTokenAccountExists = true;
      try {
        await getAccount(connection, mainTokenAccount);
      } catch (error) {
        mainTokenAccountExists = false;
      }
      
      // Если token account получателя не существует, создаем его
      if (!mainTokenAccountExists) {
        console.log('Token account получателя не существует, создаем...');
        
        // Создаем ассоциированный токен-аккаунт с правильными инструкциями
        const createAtaIx = createAssociatedTokenAccountInstruction(
          proxyKeypair.publicKey, // плательщик
          mainTokenAccount,        // ассоциированный токен-аккаунт
          mainKeypair.publicKey,   // владелец
          nftMint                  // монета
        );
        
        // Сначала создаем аккаунт, затем переводим токен
        const tx = new Transaction().add(createAtaIx);
        
        const signature = await sendAndConfirmTransaction(
          connection,
          tx,
          [proxyKeypair],
          { commitment: 'confirmed' }
        );
        
        console.log(`Токен-аккаунт успешно создан! Транзакция: ${signature}`);
        
        // Теперь отдельно переводим токен
        const transferIx = createTransferInstruction(
          proxyTokenAccount,
          mainTokenAccount,
          proxyKeypair.publicKey,
          BigInt(1),
          [proxyKeypair]
        );
        
        const transferTx = new Transaction().add(transferIx);
        
        const transferSignature = await sendAndConfirmTransaction(
          connection,
          transferTx,
          [proxyKeypair],
          { commitment: 'confirmed' }
        );
        
        console.log(`Токен успешно передан! Транзакция: ${transferSignature}`);
      } else {
        // Если token account получателя существует, просто переводим токен
        const transferIx = createTransferInstruction(
          proxyTokenAccount,
          mainTokenAccount,
          proxyKeypair.publicKey,
          BigInt(1),  // Передаем только 1 токен
          [proxyKeypair]
        );
        
        const tx = new Transaction().add(transferIx);
        
        const signature = await sendAndConfirmTransaction(
          connection,
          tx,
          [proxyKeypair],
          { commitment: 'confirmed' }
        );
        
        console.log(`Токен успешно передан! Транзакция: ${signature}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Ошибка при передаче токена: ${error}`);
      return false;
    }
  }
  
  // Запуск тестов
  try {
    // Проверяем все прокси-кошельки
    console.log('=== Проверка NFT в прокси-кошельках ===');
    const proxyResults = [];
    
    for (const walletFile of walletFiles) {
      const result = await checkProxyNft(walletFile);
      if (result) {
        proxyResults.push(result);
      }
    }
    
    if (proxyResults.length === 0) {
      console.error('Не найдены валидные NFT в прокси-кошельках');
      return;
    }
    
    console.log(`\n=== Найдено ${proxyResults.length} валидных NFT в прокси-кошельках ===`);
    
    // Выбор действия
    console.log('\nВыберите действие:');
    console.log('1 - Проверить баланс определенного NFT');
    console.log('2 - Передать один токен из прокси-кошелька на основной');
    console.log('3 - Выйти');
    
    const choice = await new Promise<string>(resolve => {
      process.stdin.once('data', data => {
        resolve(data.toString().trim());
      });
    });
    
    switch (choice) {
      case '1':
        // Показываем список NFT для выбора
        console.log('\nВыберите NFT для проверки:');
        proxyResults.forEach((result, index) => {
          console.log(`${index + 1} - ${result.nftName}`);
        });
        
        const nftIndex = await new Promise<number>(resolve => {
          process.stdin.once('data', data => {
            const index = parseInt(data.toString().trim(), 10) - 1;
            resolve(index >= 0 && index < proxyResults.length ? index : 0);
          });
        });
        
        const selectedNft = proxyResults[nftIndex];
        console.log(`\n=== Детальная информация о NFT "${selectedNft.nftName}" ===`);
        console.log(`Адрес mint: ${selectedNft.nftMint.toString()}`);
        console.log(`Количество токенов: ${selectedNft.tokenAmount}`);
        console.log(`Прокси-кошелек: ${selectedNft.proxyKeypair.publicKey.toString()}`);
        break;
      
      case '2':
        // Берем первый результат для передачи токена
        const firstResult = proxyResults[0];
        await transferNftFromProxy(
          firstResult.proxyKeypair,
          firstResult.nftMint,
          firstResult.nftName
        );
        break;
      
      case '3':
      default:
        console.log('Выход из программы...');
        break;
    }
    
    console.log('\nТест прокси-минтинга завершен!');
  } catch (error) {
    console.error('Ошибка при выполнении теста:', error);
  }
}

// Запуск скрипта
main().then(() => {
  console.log('Скрипт тестирования завершен');
  process.exit(0);
}).catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
}); 