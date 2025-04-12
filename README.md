# Samurai Pepe - NFT Mint проект на Solana Blockchain

## 1. Общее описание проекта

Samurai Pepe - это веб-приложение для создания (минта) NFT на блокчейне Solana с интеграцией социальных сетей. Проект позволяет пользователям подключать кошельки Solana, минтить NFT разной редкости, выполнять квесты через авторизацию в социальных сетях (Twitter, Discord, Telegram) и отслеживать свои NFT.

Основные функции:
- Подключение кошельков Solana (Phantom, Solflare)
- Минт NFT разной редкости (Common, Rare, Legendary)
- Система квестов с авторизацией в социальных сетях
- Визуализация и отслеживание коллекции NFT
- Поддержка нескольких сетей Solana (devnet, mainnet-beta)

## 2. Требования для запуска

### Для всех платформ (Windows и macOS)

#### Node.js (версия 16 или выше)
- **Что это**: Среда выполнения JavaScript, необходимая для запуска проекта
- **Где скачать**: [https://nodejs.org/](https://nodejs.org/)
- **Проверка установки**: `node --version` в терминале
- **Зачем нужен**: Для запуска веб-приложения и скриптов проекта

#### Solana CLI
- **Что это**: Интерфейс командной строки для взаимодействия с блокчейном Solana
- **Где скачать**: 
  - macOS: `sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"`
  - Windows: Загрузите установщик с [GitHub Solana](https://github.com/solana-labs/solana/releases)
- **Проверка установки**: `solana --version` в терминале
- **Зачем нужен**: Для деплоя смарт-контрактов и взаимодействия с блокчейном Solana

#### Rust
- **Что это**: Язык программирования для разработки Solana смарт-контрактов
- **Где скачать**: [https://www.rust-lang.org/tools/install](https://www.rust-lang.org/tools/install)
- **Проверка установки**: `rustc --version` в терминале
- **Зачем нужен**: Для компиляции Solana смарт-контрактов

#### Anchor Framework
- **Что это**: Фреймворк для разработки Solana смарт-контрактов
- **Установка**: `npm install -g @coral-xyz/anchor`
- **Проверка установки**: `anchor --version` в терминале
- **Зачем нужен**: Для сборки и деплоя смарт-контрактов на Solana

#### Yarn (опционально)
- **Что это**: Менеджер пакетов, альтернатива npm
- **Где скачать**: [https://yarnpkg.com/getting-started/install](https://yarnpkg.com/getting-started/install)
- **Проверка установки**: `yarn --version` в терминале
- **Зачем нужен**: Для управления зависимостями проекта

### Дополнительно для Windows

- **Git Bash**: Для выполнения Unix-команд в Windows
- **Где скачать**: [https://git-scm.com/downloads](https://git-scm.com/downloads)

## 3. Установка зависимостей

### Шаг 1: Клонирование репозитория
```bash
git clone https://github.com/your-username/samurai-pepe.git
cd samurai-pepe
```

### Шаг 2: Установка зависимостей для веб-приложения (frontend)
```bash
cd frontend
npm install
# или если используете yarn
yarn install
```

### Шаг 3: Установка зависимостей для смарт-контракта (nft-part)
```bash
cd ../nft-part
npm install
# или если используете yarn
yarn install
```

### Шаг 4: Проверка установки зависимостей
Убедитесь, что в обеих директориях (`frontend` и `nft-part`) появились папки `node_modules`. Отсутствие ошибок при выполнении команд `npm install` также говорит об успешной установке.

## 4. Настройка окружения

### Шаг 1: Настройка переменных окружения для frontend

Создайте файл `.env.local` в директории `frontend` и заполните его следующим содержимым:

```
# Solana RPC Endpoint
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT="https://api.devnet.solana.com"

# Solana Network (devnet, testnet, mainnet-beta)
NEXT_PUBLIC_SOLANA_NETWORK="devnet"

# База данных
DATABASE_URL="file:./samurai_pepe.db"

# Ключ шифрования для Next.js
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="создайте_свой_секретный_ключ"
SERVER_REFERENCE_MANIFEST_ENCRYPTION_KEY="создайте_свой_секретный_ключ"

# Адрес программы NFT на Solana
NEXT_PUBLIC_NFT_PROGRAM_ID="G37UyZuJkHdnF9ko2p8FLUtyPYZSYQ1ihjic9G1RCQRf"

# Адрес владельца коллекции NFT
NEXT_PUBLIC_COLLECTION_AUTHORITY="адрес_вашего_кошелька_solana"

# Адрес данных о коллекции NFT (PDA)
NEXT_PUBLIC_COLLECTION_DATA_PDA="адрес_данных_коллекции"

# OAuth для социальных сетей
DISCORD_CLIENT_ID="ваш_discord_client_id"
DISCORD_CLIENT_SECRET="ваш_discord_client_secret"
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"
DISCORD_OAUTH_URL="https://discord.com/api/oauth2/authorize"

TWITTER_CLIENT_ID="ваш_twitter_client_id"
TWITTER_CLIENT_SECRET="ваш_twitter_client_secret"
TWITTER_REDIRECT_URI="http://localhost:3000/api/auth/twitter/callback"
TWITTER_OAUTH_URL="https://twitter.com/i/oauth2/authorize"

TELEGRAM_BOT_TOKEN="ваш_telegram_bot_token"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="имя_вашего_бота_без_@"

# URL приложения
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Шаг 2: Настройка Anchor для смарт-контракта

Проверьте и отредактируйте файл `nft-part/Anchor.toml`:

```toml
[toolchain]
anchor_version = "0.29.0"

[features]
seeds = false
skip-lint = false

[programs.devnet]
nft_program = "9uJ8yGTieFKj2f3XixAfuBAdFmavEoVNgCZgkcK56KrJ"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Devnet"
wallet = "/путь/к/вашему/solana/кошельку.json"

[scripts]
client = "yarn run ts-node client/*.ts"
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

## 5. Переключение между сетями Solana

### Что такое сети Solana
- **devnet**: Тестовая сеть с бесплатными тестовыми SOL 
- **testnet**: Тестовая сеть для более масштабного тестирования
- **mainnet-beta**: Основная сеть Solana, где транзакции имеют реальную стоимость

### Настройка сети через Solana CLI

#### Переключение на devnet
```bash
solana config set --url https://api.devnet.solana.com
```

#### Переключение на mainnet-beta
```bash
solana config set --url https://api.mainnet-beta.solana.com
```

#### Проверка текущей сети
```bash
solana config get
```

### Изменение сети в проекте
1. Измените значение `NEXT_PUBLIC_SOLANA_NETWORK` и `NEXT_PUBLIC_SOLANA_RPC_ENDPOINT` в файле `.env.local`
2. Обновите параметр `cluster` в файле `nft-part/Anchor.toml`

## 6. Сборка и деплой смарт-контракта на Solana

### Шаг 1: Создание кошелька для деплоя (если у вас его нет)
```bash
solana-keygen new -o keypair.json
```

### Шаг 2: Получение тестовых SOL (для devnet)
```bash
solana airdrop 2 --url devnet
```

### Шаг 3: Сборка смарт-контракта
```bash
cd nft-part
anchor build
```

### Шаг 4: Получение адреса программы
```bash
solana address -k target/deploy/nft_program-keypair.json
```

### Шаг 5: Обновление ID программы в Anchor.toml
Замените ID программы в `nft-part/Anchor.toml` на полученный адрес:
```toml
[programs.devnet]
nft_program = "полученный_адрес_программы"
```

### Шаг 6: Деплой программы
```bash
anchor deploy
```

### Шаг 7: Проверка успешного деплоя
```bash
solana program show полученный_адрес_программы
```

### Шаг 8: Обновление .env.local
Обновите значение `NEXT_PUBLIC_NFT_PROGRAM_ID` в файле `frontend/.env.local` на адрес вашей программы.

## 7. Настройка OAuth для социальных сетей

### Discord OAuth

#### Шаг 1: Создание приложения Discord
1. Перейдите на [Discord Developer Portal](https://discord.com/developers/applications)
2. Нажмите "New Application" и создайте новое приложение
3. Перейдите в раздел "OAuth2" в меню слева
4. Добавьте редирект URI: `http://localhost:3000/api/auth/discord/callback`
5. Сохраните Client ID и Client Secret

#### Шаг 2: Обновление .env.local
```
DISCORD_CLIENT_ID="ваш_discord_client_id"
DISCORD_CLIENT_SECRET="ваш_discord_client_secret"
DISCORD_REDIRECT_URI="http://localhost:3000/api/auth/discord/callback"
```

### Twitter OAuth

#### Шаг 1: Создание приложения Twitter
1. Перейдите на [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Создайте новый проект и приложение
3. В настройках приложения добавьте редирект URI: `http://localhost:3000/api/auth/twitter/callback`
4. Получите API Key (Client ID) и API Secret (Client Secret)

#### Шаг 2: Обновление .env.local
```
TWITTER_CLIENT_ID="ваш_twitter_client_id"
TWITTER_CLIENT_SECRET="ваш_twitter_client_secret"
TWITTER_REDIRECT_URI="http://localhost:3000/api/auth/twitter/callback"
```

### Telegram Bot

#### Шаг 1: Создание бота в Telegram
1. Откройте чат с [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Сохраните полученный токен бота (API token)

#### Шаг 2: Настройка доменного имени для бота
1. Установите и запустите ngrok для создания туннеля:
   ```bash
   cd frontend
   npm run ngrok
   # или
   yarn ngrok
   ```
2. Скопируйте полученный URL (например, `https://xxxx-xxx-xx-xx-xx.ngrok.io`)
3. Отправьте команду `/setdomain` в чате с @BotFather
4. Выберите вашего бота и укажите URL от ngrok

#### Шаг 3: Обновление .env.local
```
TELEGRAM_BOT_TOKEN="ваш_telegram_bot_token"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="имя_вашего_бота_без_@"
```

## 8. Запуск проекта

### Шаг 1: Запуск веб-приложения
```bash
cd frontend
npm run dev
# или
yarn dev
```

### Шаг 2: Проверка работы приложения
Откройте браузер и перейдите по адресу: `http://localhost:3000`

Вы увидите главную страницу проекта Samurai Pepe с возможностью подключения кошелька Solana.

### Шаг 3: Подключение кошелька
1. Установите расширение Phantom или Solflare для вашего браузера
2. Создайте новый кошелек или импортируйте существующий
3. Нажмите кнопку "Connect Wallet" на сайте

### Шаг 4: Минт NFT
После подключения кошелька вы сможете минтить NFT, выбрав желаемый тип (Common, Rare, Legendary)

## 9. Дополнительные советы

### Отладка смарт-контракта
- Используйте `anchor test` для запуска тестов смарт-контракта
- Логи Solana можно просмотреть с помощью `solana logs`
- При разработке контракта используйте `anchor test --skip-local-validator` для тестов без запуска локального валидатора

### Работа с Solana Explorer
- Для проверки транзакций используйте [Solana Explorer](https://explorer.solana.com/?cluster=devnet)
- Выберите правильную сеть (devnet/mainnet) в верхнем правом углу

### Полезные ресурсы
- [Документация Solana](https://docs.solana.com/)
- [Документация Anchor](https://www.anchor-lang.com/)
- [Discord Solana](https://discord.com/invite/solana)
- [Next.js документация](https://nextjs.org/docs)

## 10. Решение проблем

### Проблемы с установкой Rust
- **Windows**: Убедитесь, что у вас установлен Microsoft Visual Studio C++ build tools
- **macOS**: Установите Xcode Command Line Tools: `xcode-select --install`

### Ошибки при деплое контракта
- **Insufficient funds**: Получите больше SOL через airdrop: `solana airdrop 2`
- **Program already exists**: Используйте новый keypair для программы или обновите существующую

### Проблемы с OAuth
- Убедитесь, что URI редиректа точно соответствует указанному в настройках приложения
- Проверьте, что ваш ngrok туннель активен для Telegram OAuth

### Ошибки при запуске frontend
- **Port already in use**: Закройте программы, использующие порт 3000, или измените порт: `npm run dev -- -p 3001`
- **Module not found**: Проверьте, что все зависимости установлены: `npm install`

### Не удается подключить кошелек Solana
- Убедитесь, что расширение кошелька установлено и разблокировано
- Проверьте, что выбрана правильная сеть в кошельке (devnet/mainnet)