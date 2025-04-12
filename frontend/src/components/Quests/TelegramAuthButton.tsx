import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuests } from './QuestsProvider';

interface TelegramAuthButtonProps {
  botUsername: string;
  onSuccess?: (userData: any) => void;
  onError?: (error: any) => void;
  questId?: number;
}

const TelegramAuthButton: React.FC<TelegramAuthButtonProps> = ({
  botUsername,
  onSuccess,
  onError,
  questId = 3
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { publicKey } = useWallet();
  const { completeQuest } = useQuests();

  const handleAuth = async () => {
    try {
      setIsAuthenticating(true);

      const origin = window.location.origin;
      const redirectUrl = `${origin}/api/auth/telegram?questId=${questId}`;
      
      // Открываем Telegram OAuth в новом окне
      const width = 550;
      const height = 470;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      // Используем правильный формат URL для Telegram Login Widget
      const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${encodeURIComponent(origin)}&return_to=${encodeURIComponent(redirectUrl)}`;
      
      const authWindow = window.open(
        telegramAuthUrl,
        'Telegram Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Функция для проверки закрытия окна
      const checkWindowClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkWindowClosed);
          setIsAuthenticating(false);
          
          // Проверяем результат аутентификации используя POST метод вместо GET
          if (publicKey) {
            const walletAddress = publicKey.toString();
            
            fetch('/api/quests/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                walletAddress,
                questId
              })
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                toast.success('Аутентификация через Telegram успешна!');
                // Обновляем состояние UI, вызывая completeQuest из контекста
                completeQuest(questId);
                onSuccess?.(data);
              } else if (data.message === 'Quest already completed') {
                toast.info('Этот квест уже выполнен');
                // Даже если квест уже выполнен, обновляем UI
                completeQuest(questId);
                onSuccess?.(data);
              } else {
                throw new Error(data.error || 'Ошибка выполнения квеста');
              }
            })
            .catch(error => {
              console.error('Ошибка выполнения квеста:', error);
              onError?.(error);
            });
          } else {
            toast.error('Для выполнения квеста необходимо подключить кошелек');
            onError?.(new Error('Wallet not connected'));
          }
        }
      }, 500);
      
    } catch (error) {
      console.error('Ошибка при аутентификации через Telegram:', error);
      setIsAuthenticating(false);
      toast.error('Ошибка при аутентификации через Telegram');
      onError?.(error);
    }
  };

  return (
    <Button
      onClick={handleAuth}
      disabled={isAuthenticating}
      className="bg-[#0088cc] hover:bg-[#0077b5] text-white"
    >
      {isAuthenticating ? 'Выполняется...' : 'Подключить Telegram'}
    </Button>
  );
};

export default TelegramAuthButton; 