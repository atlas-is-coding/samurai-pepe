import { PublicKey, Transaction } from '@solana/web3.js';

/**
 * Глобальные типы для доступа к Phantom API, Solflare API и глобальным переменным состояния кошелька.
 * Эти типы используются для интеграции с кошельками Solana и хранения состояния подключения
 * в глобальном контексте window.
 */
declare global {
  interface Window {
    /**
     * Флаг, указывающий, подключен ли кошелек в текущий момент.
     * Устанавливается в true после успешного соединения.
     */
    __WALLET_CONNECTED__?: boolean;
    
    /**
     * Флаг, указывающий, находится ли кошелек в процессе подключения.
     * Используется для управления состоянием UI во время подключения.
     */
    __WALLET_CONNECTING__?: boolean;
    
    /**
     * Публичный ключ подключенного кошелька в виде строки.
     * Null, если кошелек не подключен.
     */
    __WALLET_PUBLIC_KEY__?: string | null;
    
    /**
     * Тип подключенного кошелька (phantom или solflare).
     * undefined, если кошелек не подключен.
     * Используется для API вызовов, требующих информацию о провайдере.
     */
    __WALLET_TYPE__?: "phantom" | "solflare" | undefined;

    /**
     * Временная метка последней успешной проверки NFT.
     * Используется для отслеживания времени последнего обновления данных NFT.
     */
    lastSuccessfulNftCheck?: number;
    
    /**
     * Флаг, указывающий необходимость принудительного обновления NFT.
     * Используется для обхода ограничений по частоте запросов.
     */
    forceNftRefresh?: boolean;
    
    /**
     * Счетчик для отслеживания попыток обновления NFT.
     * Используется для отладки и диагностики проблем.
     */
    nftUpdateAttempts?: number;
    
    /**
     * Флаг, указывающий на специфическое обновление для Phantom кошелька.
     * Используется для обработки особенностей Phantom.
     */
    phantomSpecificUpdate?: boolean;
    
    /**
     * Флаг, указывающий, был ли успешно инициализирован Phantom кошелек.
     * Используется для решения проблем с инициализацией Phantom.
     */
    phantomInitialized?: boolean;

    /**
     * Phantom API интерфейс, доступный через window.solana.
     * Предоставляет методы для взаимодействия с Phantom кошельком.
     */
    solana?: {
      isPhantom?: boolean;
      publicKey?: PublicKey;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      request: (request: any) => Promise<any>;
      
      /**
       * Метод для подписки на события кошелька Phantom.
       * Поддерживаемые события: disconnect, accountChanged.
       */
      on?: (event: 'disconnect' | 'accountChanged', callback: (args?: any) => void) => void;
      
      /**
       * Метод для отписки от событий кошелька Phantom.
       * Поддерживаемые события: disconnect, accountChanged.
       */
      off?: (event: 'disconnect' | 'accountChanged', callback: (args?: any) => void) => void;
      
      /**
       * Свойство, указывающее, инициализирован ли Phantom кошелек.
       * Может отсутствовать в некоторых версиях API.
       */
      isConnected?: boolean;
    };

    /**
     * Solflare API интерфейс, доступный через window.solflare.
     * Предоставляет методы для взаимодействия с Solflare кошельком.
     */
    solflare?: {
      isSolflare?: boolean;
      isConnected?: boolean;
      publicKey?: PublicKey;
      connect: () => Promise<{ publicKey: PublicKey }>;
      disconnect: () => Promise<void>;
      signTransaction: (transaction: Transaction) => Promise<Transaction>;
      signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
      request: (request: any) => Promise<any>;
      
      /**
       * Метод для подписки на события кошелька Solflare.
       * Поддерживаемые события: disconnect, accountChanged.
       */
      on?: (event: 'disconnect' | 'accountChanged', callback: (args?: any) => void) => void;
      
      /**
       * Метод для отписки от событий кошелька Solflare.
       * Поддерживаемые события: disconnect, accountChanged.
       */
      off?: (event: 'disconnect' | 'accountChanged', callback: (args?: any) => void) => void;
    };
  }
} 