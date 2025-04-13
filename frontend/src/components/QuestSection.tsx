import { toast } from "react-hot-toast";

// Функция для выполнения квеста через API
const completeQuest = async (questId: number, walletAddress: string, refreshUserData?: () => void) => {
  if (!walletAddress) {
    toast.error('First connect your wallet');
    return;
  }
  
  try {
    const response = await fetch('/api/quests/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        walletAddress,
        questId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      toast.success(`Quest completed! +${result.pointsAdded} points`);
      // Обновляем данные пользователя, если нужно
      if (refreshUserData) {
        refreshUserData();
      }
    } else {
      if (result.message === 'Quest already completed') {
        toast.success('This quest is already completed');
      } else {
        toast.error(result.error || 'Failed to complete quest');
      }
    }
  } catch (error) {
    console.error('Error completing quest:', error);
    toast.error('An error occurred while completing the quest');
  }
}; 