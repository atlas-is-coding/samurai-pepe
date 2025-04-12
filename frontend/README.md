    # Samurai Pepe - NFT Mint Project

Web-приложение для минта NFT на Solana с использованием Next.js и Anchor.

## Технологии

- Next.js 15
- React 19
- Solana Web3.js
- Anchor Framework
- TypeScript
- TailwindCSS

## Основные функции

- Подключение кошельков Solana (Phantom, Solflare)
- Mint NFT на Solana (devnet)
- Трекинг минтов
- Мобильная оптимизация

## Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/your-username/samurai-pepe.git
cd samurai-pepe
```

2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env.local` и укажите необходимые переменные окружения:

```
# Environment variables for Solana NFT
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT="https://api.devnet.solana.com"
NEXT_PUBLIC_SOLANA_NETWORK="devnet"
NEXT_PUBLIC_NFT_PROGRAM_ID="G37UyZuJkHdnF9ko2p8FLUtyPYZSYQ1ihjic9G1RCQRf"
NEXT_PUBLIC_COLLECTION_AUTHORITY="ВАША_ПУБЛИЧНАЯ_СЕТЬ_ЗДЕСЬ"
NEXT_PUBLIC_COLLECTION_DATA_PDA="АДРЕС_ДАННЫХ_КОЛЛЕКЦИИ_ЗДЕСЬ"
```

4. Запустите приложение в режиме разработки:

```bash
npm run dev
```

## Подготовка к деплою NFT программы

Перед использованием функции минтинга вам необходимо развернуть программу Samurai NFT на Solana devnet:

1. Установите Solana CLI:
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
   ```

2. Создайте новый кошелек для деплоя:
   ```bash
   solana-keygen new -o keypair.json
   ```

3. Получите SOL для devnet:
   ```bash
   solana airdrop 2 $(solana-keygen pubkey keypair.json) --url devnet
   ```

4. Перейдите в директорию с программой:
   ```bash
   cd path/to/samurai-nft
   ```

5. Скомпилируйте и задеплойте программу:
   ```bash
   anchor build
   anchor deploy --provider.wallet keypair.json --provider.cluster devnet
   ```

6. Инициализируйте коллекцию:
   ```bash
   ts-node scripts/initialize-collection.ts
   ```

7. Обновите `.env.local` с новыми полученными адресами

## Создание NFT

После настройки программы вы можете использовать минт NFT через интерфейс:

1. Подключите свой Solana кошелек (Phantom или Solflare)
2. Перейдите на страницу Mint
3. Выберите тип NFT и подтвердите транзакцию

## Безопасность

- Все транзакции выполняются на стороне клиента и подписываются кошельком пользователя
- Приватные ключи никогда не хранятся на сервере
- Все транзакции выполняются через безопасные RPC-эндпоинты
