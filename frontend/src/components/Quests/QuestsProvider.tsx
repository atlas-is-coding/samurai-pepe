'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface Quest {
  id: number;
  title: string;
  points: number;
  icon: string;
}

interface QuestsContextProps {
  completedQuests: number[];
  completeQuest: (questId: number) => void;
  isQuestActive: (questId: number) => boolean;
  isQuestCompleted: (questId: number) => boolean;
  quests: Quest[];
}

const QuestsContext = createContext<QuestsContextProps>({
  completedQuests: [],
  completeQuest: () => {},
  isQuestActive: () => false,
  isQuestCompleted: () => false,
  quests: []
});

export function useQuests() {
  return useContext(QuestsContext);
}

interface QuestsProviderProps {
  children: ReactNode;
}

export function QuestsProvider({ children }: QuestsProviderProps) {
  const { connected, publicKey } = useWallet();
  const [completedQuests, setCompletedQuests] = useState<number[]>([]);

  // Список квестов
  const quests: Quest[] = [
    { id: 1, title: 'Twitter Connect', points: 5, icon: '/q1.png' },
    { id: 2, title: 'Discord Connect',  points: 5, icon: '/q2.png' },
    { id: 3, title: 'Telegram Connect', points: 5, icon: '/q3.png' },
  ];

  // При подключении кошелька пытаемся получить данные о выполненных квестах
  useEffect(() => {
    if (!connected || !publicKey) return;
    
    // Получаем данные о выполненных квестах через API
    const fetchCompletedQuests = async () => {
      try {
        const walletAddress = publicKey.toString();
        const response = await fetch(`/api/quests?walletAddress=${encodeURIComponent(walletAddress)}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Загруженные выполненные квесты:', data.completedQuests);
          setCompletedQuests(data.completedQuests);
        }
      } catch (error) {
        console.error('Ошибка при загрузке выполненных квестов:', error);
      }
    };
    
    fetchCompletedQuests();
    
    // Listen for wallet connection change events to refresh quests
    const handleConnectionChange = () => {
      console.log('Connection change detected, refreshing quests');
      fetchCompletedQuests();
    };
    
    // Listen for OAuth completion events to refresh quests
    const handleOAuthComplete = (event: Event) => {
      console.log('OAuth completion detected, refreshing quests');
      fetchCompletedQuests();
    };
    
    window.addEventListener('wallet-connection-change', handleConnectionChange);
    window.addEventListener('oauth-complete', handleOAuthComplete);
    
    // Additional event listener for when coming back from oauth flow
    window.addEventListener('focus', fetchCompletedQuests);
    
    return () => {
      window.removeEventListener('wallet-connection-change', handleConnectionChange);
      window.removeEventListener('oauth-complete', handleOAuthComplete);
      window.removeEventListener('focus', fetchCompletedQuests);
    };
  }, [connected, publicKey]);

  // Обработчик завершения квеста
  const completeQuest = async (questId: number) => {
    if (!isQuestActive(questId) || isQuestCompleted(questId) || !publicKey) return;
    
    try {
      console.log(`Completing quest ${questId} for wallet ${publicKey.toString()}`);
      
      // Вместо сразу установки квеста как выполненного, проверяем авторизацию
      // Для этого делаем запрос к API, чтобы убедиться, что квест действительно выполнен
      const response = await fetch(`/api/quests/complete?questId=${questId}&walletAddress=${publicKey.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Quest completion response:', data);
        
        // Manually trigger a refresh of the completed quests
        const fetchLatestQuests = async () => {
          try {
            const walletAddress = publicKey.toString();
            const response = await fetch(`/api/quests?walletAddress=${encodeURIComponent(walletAddress)}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log('Refreshed completed quests:', data.completedQuests);
              setCompletedQuests(data.completedQuests);
            }
          } catch (error) {
            console.error('Error refreshing completed quests:', error);
          }
        };
        
        // If the API indicates success, update the state
        if (data.success) {
          // Update state immediately for UI responsiveness
          setCompletedQuests(prev => {
            if (!prev.includes(questId)) {
              return [...prev, questId];
            }
            return prev;
          });
          
          // Then fetch the latest state from the server to ensure consistency
          fetchLatestQuests();
        } else {
          // If the API returned ok but not success, fetch latest quests anyway
          fetchLatestQuests();
        }
      }
    } catch (error) {
      console.error('Ошибка при выполнении квеста:', error);
    }
  };

  // Проверка, активен ли квест (должны выполняться последовательно)
  const isQuestActive = (questId: number): boolean => {
    // Первый квест всегда активен
    if (questId === 1) return true;
    
    // Для следующих квестов, проверяем, выполнен ли предыдущий
    // Для квеста 2 (Discord) должен быть выполнен квест 1 (Twitter)
    // Для квеста 3 (Telegram) должен быть выполнен квест 2 (Discord)
    return completedQuests.includes(questId - 1);
  };

  // Проверка, выполнен ли квест
  const isQuestCompleted = (questId: number): boolean => {
    return completedQuests.includes(questId);
  };

  const contextValue = {
    completedQuests,
    completeQuest,
    isQuestActive,
    isQuestCompleted,
    quests
  };

  return (
    <QuestsContext.Provider value={contextValue}>
      {children}
    </QuestsContext.Provider>
  );
} 