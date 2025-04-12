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
    { id: 1, title: 'Connect Twitter', points: 5, icon: '/q1.png' },
    { id: 2, title: 'Connect Discord', points: 5, icon: '/q2.png' },
    { id: 3, title: 'Connect Telegram', points: 5, icon: '/q3.png' },
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
  const completeQuest = (questId: number) => {
    if (!isQuestActive(questId) || isQuestCompleted(questId)) return;
    setCompletedQuests(prev => [...prev, questId]);
    
    // Дополнительно можно сделать запрос к API для обновления квестов,
    // но это не обязательно, так как квест уже сохранен через API при выполнении
  };

  // Проверка, активен ли квест (должны выполняться последовательно)
  const isQuestActive = (questId: number): boolean => {
    if (questId === 1) return true;
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