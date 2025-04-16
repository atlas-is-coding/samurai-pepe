'use client';

import { useState } from 'react';
import TelegramAuthButton from './TelegramAuthButton';

// Имитация сервисов для квестов
export const QuestServices = {
  // Реальная авторизация в Twitter с использованием OAuth 2.0
  connectTwitter: async (): Promise<{success: boolean, twitterUsername?: string}> => {
    try {
      // Получаем адрес кошелька из localStorage
      const walletAddress = localStorage.getItem('walletAddress');
      
      // Если адреса кошелька нет, возвращаем ошибку
      if (!walletAddress) {
        console.error('No wallet address found in localStorage');
        return { success: false };
      }
      
      // Формируем URL для авторизации с учетом кошелька
      let authorizeUrl = `/api/auth/twitter/authorize?wallet=${encodeURIComponent(walletAddress)}`;
      
      // Открываем новое окно с URL для авторизации
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        authorizeUrl,
        'Twitter Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Ждем завершения авторизации
      return new Promise((resolve) => {
        // Функция для проверки URL окна авторизации
        const checkRedirect = setInterval(() => {
          try {
            // Если окно закрыто или недоступно
            if (!authWindow || authWindow.closed) {
              clearInterval(checkRedirect);
              resolve({ success: false });
              return;
            }
            
            // Проверяем URL окна
            const currentUrl = authWindow.location.href;
            
            // Если URL содержит параметры успешной авторизации
            if (currentUrl.includes('twitter_connected=true')) {
              clearInterval(checkRedirect);
              
              // Извлекаем имя пользователя Twitter из URL
              const urlParams = new URLSearchParams(new URL(currentUrl).search);
              const twitterUsername = urlParams.get('twitter_username');
              
              // Закрываем окно авторизации
              authWindow.close();
              
              // После успешной авторизации, делаем проверку завершения квеста
              // и запрашиваем обновление состояния квестов
              QuestServices.saveCompletedQuest(walletAddress, 1, twitterUsername || undefined)
                .then(success => {
                  if (success) {
                    // Dispatch event to notify components that OAuth is complete
                    window.dispatchEvent(new CustomEvent('oauth-complete', {
                      detail: { questId: 1, walletAddress }
                    }));
                  }
                })
                .catch(err => console.error('Error saving Twitter quest completion:', err));
              
              // Возвращаем успешный результат
              resolve({ 
                success: true, 
                twitterUsername: twitterUsername || undefined 
              });
            }
            
            // Если URL содержит параметр ошибки
            if (currentUrl.includes('error=')) {
              clearInterval(checkRedirect);
              authWindow.close();
              resolve({ success: false });
            }
          } catch (e) {
            // Ошибки кросс-домена при проверке URL можно игнорировать
            // Они возникают при редиректе на домен Twitter
          }
        }, 500);
        
        // Таймаут для авторизации (2 минуты)
        setTimeout(() => {
          clearInterval(checkRedirect);
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          resolve({ success: false });
        }, 120000);
      });
    } catch (error) {
      console.error('Error in Twitter auth:', error);
      return { success: false };
    }
  },
  
  // Реальная авторизация в Discord с использованием OAuth 2.0
  connectDiscord: async (): Promise<{success: boolean}> => {
    try {
      // Получаем адрес кошелька из localStorage
      const walletAddress = localStorage.getItem('walletAddress');
      
      // Если адреса кошелька нет, возвращаем ошибку
      if (!walletAddress) {
        console.error('No wallet address found in localStorage');
        return { success: false };
      }
      
      // Формируем URL для авторизации с учетом кошелька
      let authorizeUrl = `/api/auth/discord/authorize?wallet=${encodeURIComponent(walletAddress)}`;
      
      // Открываем новое окно с URL для авторизации
      const width = 600;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        authorizeUrl,
        'Discord Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Ждем завершения авторизации
      return new Promise((resolve) => {
        // Функция для проверки URL окна авторизации
        const checkRedirect = setInterval(() => {
          try {
            // Если окно закрыто или недоступно
            if (!authWindow || authWindow.closed) {
              clearInterval(checkRedirect);
              resolve({ success: false });
              return;
            }
            
            // Проверяем URL окна
            const currentUrl = authWindow.location.href;
            
            // Если URL содержит параметры успешной авторизации
            if (currentUrl.includes('discord_connected=true')) {
              clearInterval(checkRedirect);
              
              // Закрываем окно авторизации
              authWindow.close();
              
              // После успешной авторизации, делаем проверку завершения квеста
              // и запрашиваем обновление состояния квестов
              QuestServices.saveCompletedQuest(walletAddress, 2)
                .then(success => {
                  if (success) {
                    // Dispatch event to notify components that OAuth is complete
                    window.dispatchEvent(new CustomEvent('oauth-complete', {
                      detail: { questId: 2, walletAddress }
                    }));
                  }
                })
                .catch(err => console.error('Error saving Discord quest completion:', err));
              
              // Возвращаем успешный результат
              resolve({ success: true });
            }
            
            // Если URL содержит параметр ошибки
            if (currentUrl.includes('error=')) {
              clearInterval(checkRedirect);
              authWindow.close();
              resolve({ success: false });
            }
          } catch (e) {
            // Ошибки кросс-домена при проверке URL можно игнорировать
            // Они возникают при редиректе на домен Discord
          }
        }, 500);
        
        // Таймаут для авторизации (2 минуты)
        setTimeout(() => {
          clearInterval(checkRedirect);
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          resolve({ success: false });
        }, 120000);
      });
    } catch (error) {
      console.error('Error in Discord auth:', error);
      return { success: false };
    }
  },
  
  // Реальная авторизация в Telegram с использованием OAuth
  connectTelegram: async (): Promise<{success: boolean}> => {
    try {
      // Получаем адрес кошелька из localStorage
      const walletAddress = localStorage.getItem('walletAddress');
      
      // Если адреса кошелька нет, возвращаем ошибку
      if (!walletAddress) {
        console.error('No wallet address found in localStorage');
        return { success: false };
      }
      
      // Получаем имя бота из окружения
      const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
      
      if (!botUsername) {
        console.error('Telegram bot username not configured');
        return { success: false };
      }
      
      // Формируем URL для авторизации с учетом кошелька
      const origin = window.location.origin;
      const redirectUrl = `${origin}/api/auth/telegram?wallet=${encodeURIComponent(walletAddress)}`;
      
      // Открываем новое окно с URL для авторизации
      const width = 550;
      const height = 470;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      // Используем правильный формат URL для Telegram Login Widget
      const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${botUsername}&origin=${encodeURIComponent(origin)}&return_to=${encodeURIComponent(redirectUrl)}`;
      
      const authWindow = window.open(
        telegramAuthUrl,
        'Telegram Auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Ждем завершения авторизации
      return new Promise((resolve) => {
        // Функция для проверки URL окна авторизации
        const checkRedirect = setInterval(() => {
          try {
            // Если окно закрыто или недоступно
            if (!authWindow || authWindow.closed) {
              clearInterval(checkRedirect);
              
              // Делаем дополнительную проверку завершения через API
              fetch(`/api/quests/complete?questId=3&walletAddress=${encodeURIComponent(walletAddress)}`)
                .then(res => res.json())
                .then(data => {
                  if (data.success || data.completed) {
                    // After successful authorization, save quest completion
                    QuestServices.saveCompletedQuest(walletAddress, 3)
                      .then(success => {
                        if (success) {
                          // Dispatch event to notify components that OAuth is complete
                          window.dispatchEvent(new CustomEvent('oauth-complete', {
                            detail: { questId: 3, walletAddress }
                          }));
                        }
                      })
                      .catch(err => console.error('Error saving Telegram quest completion:', err));
                    
                    resolve({ success: true });
                  } else {
                    resolve({ success: false });
                  }
                })
                .catch(() => {
                  resolve({ success: false });
                });
              
              return;
            }
            
            // Проверяем URL окна
            const currentUrl = authWindow.location.href;
            
            // Если URL содержит параметры успешной авторизации
            if (currentUrl.includes('success=true')) {
              clearInterval(checkRedirect);
              
              // Закрываем окно авторизации
              authWindow.close();
              
              // После успешной авторизации, делаем проверку завершения квеста
              // и запрашиваем обновление состояния квестов
              QuestServices.saveCompletedQuest(walletAddress, 3)
                .then(success => {
                  if (success) {
                    // Dispatch event to notify components that OAuth is complete
                    window.dispatchEvent(new CustomEvent('oauth-complete', {
                      detail: { questId: 3, walletAddress }
                    }));
                  }
                })
                .catch(err => console.error('Error saving Telegram quest completion:', err));
              
              // Возвращаем успешный результат
              resolve({ success: true });
            }
            
            // Если URL содержит параметр ошибки
            if (currentUrl.includes('error=')) {
              clearInterval(checkRedirect);
              authWindow.close();
              resolve({ success: false });
            }
          } catch (e) {
            // Ошибки кросс-домена при проверке URL можно игнорировать
            // Они возникают при редиректе на домен Telegram
          }
        }, 500);
        
        // Таймаут для авторизации (2 минуты)
        setTimeout(() => {
          clearInterval(checkRedirect);
          if (authWindow && !authWindow.closed) {
            authWindow.close();
          }
          resolve({ success: false });
        }, 120000);
      });
    } catch (error) {
      console.error('Error in Telegram auth:', error);
      return { success: false };
    }
  },
  
  // Получение списка выполненных квестов для пользователя
  getCompletedQuests: async (walletAddress: string): Promise<number[]> => {
    try {
      // Запрос в API для получения выполненных квестов
      const response = await fetch(`/api/quests?walletAddress=${walletAddress}`);
      
      if (!response.ok) {
        throw new Error('Failed to get completed quests');
      }
      
      const data = await response.json();
      return data.completedQuests || [];
    } catch (error) {
      console.error('Error getting completed quests:', error);
      
      // Fallback к localStorage в случае ошибки
      const savedQuests = localStorage.getItem(`completed_quests_${walletAddress}`);
      return savedQuests ? JSON.parse(savedQuests) : [];
    }
  },
  
  // Сохранение выполненного квеста
  saveCompletedQuest: async (walletAddress: string, questId: number, twitterUsername?: string): Promise<boolean> => {
    try {
      console.log(`QuestServices: Saving completed quest ${questId} for wallet ${walletAddress}`);
      
      // Запрос в API для сохранения выполненного квеста
      const response = await fetch('/api/quests/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          questId,
          twitterUsername: questId === 1 ? twitterUsername : undefined // Сохраняем имя Twitter только для квеста #1
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`QuestServices: Failed to save quest ${questId}:`, errorText);
        throw new Error(`Failed to save completed quest: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`QuestServices: Quest ${questId} completion result:`, data);
      
      if (data.success) {
        console.log(`QuestServices: Successfully completed quest ${questId}, dispatching events...`);
        
        // Dispatch multiple events to ensure all components are notified
        // 1. quest-completed event
        window.dispatchEvent(new CustomEvent('quest-completed', {
          detail: { questId, walletAddress }
        }));
        
        // 2. oauth-complete event for components listening to that
        window.dispatchEvent(new CustomEvent('oauth-complete', {
          detail: { questId, walletAddress }
        }));
        
        // 3. A direct call to refresh completed quests
        try {
          console.log(`QuestServices: Explicitly refreshing quests after completion...`);
          const refreshResponse = await fetch(`/api/quests?walletAddress=${encodeURIComponent(walletAddress)}`);
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log(`QuestServices: Latest completed quests:`, refreshData.completedQuests);
            
            // Store in localStorage as a backup
            localStorage.setItem(
              `completed_quests_${walletAddress}`,
              JSON.stringify(refreshData.completedQuests)
            );
          }
        } catch (refreshError) {
          console.error('QuestServices: Error refreshing quests:', refreshError);
        }
        
        // 4. Force UI update by dispatching a custom event
        setTimeout(() => {
          console.log(`QuestServices: Dispatching delayed UI update event`);
          window.dispatchEvent(new CustomEvent('force-ui-update', {
            detail: { questId, walletAddress, timestamp: Date.now() }
          }));
        }, 1000);
        
        return true;
      } else if (data.message === 'Quest already completed') {
        console.log(`QuestServices: Quest ${questId} was already completed`);
        
        // Even if already completed, dispatch events to refresh UI
        window.dispatchEvent(new CustomEvent('quest-completed', {
          detail: { questId, walletAddress }
        }));
        
        return true;
      }
      
      console.error(`QuestServices: API returned success=false for quest ${questId}`);
      return false;
    } catch (error) {
      console.error('QuestServices: Error saving completed quest:', error);
      
      // Fallback к localStorage в случае ошибки
      try {
        // Получаем текущие выполненные квесты
        const completedQuests = await QuestServices.getCompletedQuests(walletAddress);
        
        // Если квест уже выполнен, не добавляем повторно
        if (completedQuests.includes(questId)) {
          console.log(`QuestServices: Quest ${questId} already exists in localStorage`);
          return true;
        }
        
        // Добавляем новый выполненный квест
        const updatedQuests = [...completedQuests, questId];
        console.log(`QuestServices: Saving to localStorage:`, updatedQuests);
        
        // Сохраняем в localStorage (в качестве резервного варианта)
        localStorage.setItem(
          `completed_quests_${walletAddress}`,
          JSON.stringify(updatedQuests)
        );
        
        // Отправляем событие о выполнении квеста даже при использовании fallback
        console.log(`QuestServices: Dispatching events from localStorage fallback`);
        window.dispatchEvent(new CustomEvent('quest-completed', {
          detail: { questId, walletAddress }
        }));
        
        return true;
      } catch (localError) {
        console.error('QuestServices: Error with localStorage fallback:', localError);
        return false;
      }
    }
  }
}; 