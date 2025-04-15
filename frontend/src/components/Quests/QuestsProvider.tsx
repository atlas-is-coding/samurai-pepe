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
  }, [connected, publicKey]);

  // Обработчик завершения квеста
  const completeQuest = async (questId: number) => {
    if (!isQuestActive(questId) || isQuestCompleted(questId) || !publicKey) return;
    
    try {
      // Вместо сразу установки квеста как выполненного, проверяем авторизацию
      // Для этого делаем запрос к API, чтобы убедиться, что квест действительно выполнен
      const response = await fetch(`/api/quests/complete?questId=${questId}&walletAddress=${publicKey.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompletedQuests(prev => [...prev, questId]);
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