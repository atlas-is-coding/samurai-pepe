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
  const [updateCounter, setUpdateCounter] = useState(0);

  // Список квестов
  const quests: Quest[] = [
    { id: 1, title: 'Twitter Connect', points: 5, icon: '/q1.png' },
    { id: 2, title: 'Discord Connect',  points: 5, icon: '/q2.png' },
    { id: 3, title: 'Telegram Connect', points: 5, icon: '/q3.png' },
  ];

  // При подключении кошелька пытаемся получить данные о выполненных квестах
  useEffect(() => {
    if (!connected || !publicKey) return;
    
    console.log('QuestsProvider: Initializing with wallet', publicKey.toString());
    
    // Получаем данные о выполненных квестах через API
    const fetchCompletedQuests = async () => {
      try {
        const walletAddress = publicKey.toString();
        console.log('QuestsProvider: Fetching completed quests for wallet', walletAddress);
        
        const response = await fetch(`/api/quests?walletAddress=${encodeURIComponent(walletAddress)}`);
        
        console.log('QuestsProvider: Fetch response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('QuestsProvider: Loaded completed quests:', data.completedQuests);
          
          // Reset the state completely before setting new values
          setCompletedQuests([]);
          
          // Set after a small delay to ensure the reset takes effect
          setTimeout(() => {
            setCompletedQuests(data.completedQuests);
            // Increment counter to force re-render
            setUpdateCounter(prev => prev + 1);
          }, 50);
        } else {
          console.error('QuestsProvider: Failed to fetch quests, status:', response.status);
          const errorText = await response.text();
          console.error('QuestsProvider: Error details:', errorText);
        }
      } catch (error) {
        console.error('QuestsProvider: Error fetching completed quests:', error);
      }
    };
    
    fetchCompletedQuests();
    
    // Listen for wallet connection change events to refresh quests
    const handleConnectionChange = () => {
      console.log('QuestsProvider: Connection change detected, refreshing quests');
      fetchCompletedQuests();
    };
    
    // Listen for OAuth completion events to refresh quests
    const handleOAuthComplete = (event: Event) => {
      console.log('QuestsProvider: OAuth completion detected, refreshing quests');
      fetchCompletedQuests();
    };
    
    // Listen for quest completion events
    const handleQuestCompleted = (event: CustomEvent) => {
      console.log('QuestsProvider: Quest completion event detected:', event.detail);
      fetchCompletedQuests();
    };
    
    // Listen for force UI update event
    const handleForceUiUpdate = (event: CustomEvent) => {
      console.log('QuestsProvider: Force UI update event detected:', event.detail);
      
      // Try to get data from localStorage first for immediate UI update
      try {
        const walletAddress = publicKey.toString();
        const storedQuests = localStorage.getItem(`completed_quests_${walletAddress}`);
        
        if (storedQuests) {
          const parsedQuests = JSON.parse(storedQuests);
          console.log('QuestsProvider: Found stored quests in localStorage:', parsedQuests);
          
          // Update state with stored quests
          setCompletedQuests(parsedQuests);
          
          // Increment counter to force re-render
          setUpdateCounter(prev => prev + 1);
        }
      } catch (e) {
        console.error('QuestsProvider: Error reading from localStorage:', e);
      }
      
      // Then fetch from API to ensure we have the latest data
      fetchCompletedQuests();
    };
    
    window.addEventListener('wallet-connection-change', handleConnectionChange);
    window.addEventListener('oauth-complete', handleOAuthComplete);
    window.addEventListener('quest-completed', handleQuestCompleted as EventListener);
    window.addEventListener('force-ui-update', handleForceUiUpdate as EventListener);
    
    // Additional event listener for when coming back from oauth flow
    window.addEventListener('focus', fetchCompletedQuests);
    
    return () => {
      window.removeEventListener('wallet-connection-change', handleConnectionChange);
      window.removeEventListener('oauth-complete', handleOAuthComplete);
      window.removeEventListener('quest-completed', handleQuestCompleted as EventListener);
      window.removeEventListener('force-ui-update', handleForceUiUpdate as EventListener);
      window.removeEventListener('focus', fetchCompletedQuests);
    };
  }, [connected, publicKey, updateCounter]);

  // Обработчик завершения квеста
  const completeQuest = async (questId: number) => {
    if (!publicKey) {
      console.error('QuestsProvider: Cannot complete quest - no wallet connected');
      return;
    }
    
    if (isQuestCompleted(questId)) {
      console.log(`QuestsProvider: Quest ${questId} already completed, skipping`);
      return;
    }
    
    if (!isQuestActive(questId)) {
      console.log(`QuestsProvider: Quest ${questId} not active, skipping`);
      return;
    }
    
    try {
      const walletAddress = publicKey.toString();
      console.log(`QuestsProvider: Completing quest ${questId} for wallet ${walletAddress}`);
      
      // Вместо сразу установки квеста как выполненного, проверяем авторизацию
      // Для этого делаем запрос к API, чтобы убедиться, что квест действительно выполнен
      console.log(`QuestsProvider: Making API request to complete quest ${questId}`);
      const response = await fetch(`/api/quests/complete?questId=${questId}&walletAddress=${walletAddress}`);
      
      console.log(`QuestsProvider: API response status for quest ${questId}:`, response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('QuestsProvider: Quest completion response:', data);
        
        // Display current state before update
        console.log('QuestsProvider: Current completed quests before update:', completedQuests);
        
        // Manually trigger a refresh of the completed quests
        const fetchLatestQuests = async () => {
          try {
            console.log('QuestsProvider: Fetching latest quests after completion');
            const response = await fetch(`/api/quests?walletAddress=${encodeURIComponent(walletAddress)}`);
            
            if (response.ok) {
              const data = await response.json();
              console.log('QuestsProvider: Refreshed completed quests from API:', data.completedQuests);
              
              // Force a state update even if the array looks the same
              setCompletedQuests([...data.completedQuests]);
              
              // Log state after update
              console.log('QuestsProvider: Completed quests after update:', data.completedQuests);
            } else {
              console.error('QuestsProvider: Failed to refresh quests, status:', response.status);
              const errorText = await response.text();
              console.error('QuestsProvider: Error details:', errorText);
            }
          } catch (error) {
            console.error('QuestsProvider: Error refreshing completed quests:', error);
          }
        };
        
        // If the API indicates success, update the state
        if (data.success) {
          console.log(`QuestsProvider: API confirms quest ${questId} completed successfully`);
          
          // Update state immediately for UI responsiveness
          setCompletedQuests(prev => {
            // Only add if not already in the array
            if (!prev.includes(questId)) {
              console.log(`QuestsProvider: Adding quest ${questId} to completed list`);
              const newState = [...prev, questId];
              console.log('QuestsProvider: New state:', newState);
              return newState;
            }
            console.log(`QuestsProvider: Quest ${questId} already in state, not adding again`);
            return prev;
          });
          
          // Then fetch the latest state from the server to ensure consistency
          await fetchLatestQuests();
        } else {
          // If the API returned ok but not success, fetch latest quests anyway
          console.log(`QuestsProvider: API responded OK but success=false for quest ${questId}`);
          await fetchLatestQuests();
        }
      } else {
        console.error(`QuestsProvider: API error completing quest ${questId}, status:`, response.status);
        try {
          const errorText = await response.text();
          console.error('QuestsProvider: Error details:', errorText);
        } catch (e) {
          console.error('QuestsProvider: Could not parse error response');
        }
      }
    } catch (error) {
      console.error('QuestsProvider: Error completing quest:', error);
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

  // Debug log whenever context value changes
  useEffect(() => {
    console.log('QuestsProvider: Context value updated, completed quests:', completedQuests);
  }, [completedQuests]);

  return (
    <QuestsContext.Provider value={contextValue}>
      {children}
    </QuestsContext.Provider>
  );
} 