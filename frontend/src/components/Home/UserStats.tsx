'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuests } from '@/components/Quests/QuestsProvider';
import { useSolanaNft } from '@/context/SolanaNftProvider';

interface UserStatsData {
  points: number;
  referralCount: number;
  questPoints?: number;
}

export function UserStats() {
  const { publicKey, connected } = useWallet();
  const { completedQuests, quests } = useQuests();
  const { totalPoints: nftPoints } = useSolanaNft();
  const [userData, setUserData] = useState<UserStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Получить данные пользователя
  useEffect(() => {
    if (!connected || !publicKey) return;

    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/invite?walletAddress=${publicKey.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to get user data');
        }
        
        const data = await response.json();
        
        // Рассчитываем очки за квесты
        const questPoints = completedQuests.reduce((total, questId) => {
          const quest = quests.find(q => q.id === questId);
          return total + (quest ? quest.points : 0);
        }, 0);
        
        setUserData({
          points: data.points || 0,
          referralCount: data.referralCount || 0,
          questPoints: questPoints
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
    
    // Обновляем данные каждые 60 секунд
    const intervalId = setInterval(fetchUserData, 60000);
    return () => clearInterval(intervalId);
  }, [connected, publicKey, completedQuests, quests]);

  if (!connected || !publicKey) {
    return null;
  }

  // Определить ранг на основе количества очков
  const getRank = (points: number): string => {
    if (points >= 100000) return 'Shōgun';
    if (points >= 50000) return 'Daimyō';
    if (points >= 20000) return 'Kōjō';
    if (points >= 10000) return 'Hatamoto';
    if (points >= 5000) return 'Samurai';
    if (points >= 1000) return 'Ashigaru';
    return 'Ronin';
  };

  // Общее количество очков из всех источников
  // points из API содержит баллы за NFT и рефералы
  const totalPoints = userData?.points || 0;

  return (
    <div>
      <div className="menu-item">
        <span className="menu-title" style={{ color: '#FFD700', fontSize: '20px' }}>Rank:</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className="menu-value" style={{ color: '#51ff00', fontSize: '25px' }}>
            {isLoading ? 'Loading...' : error ? 'Error' : getRank(totalPoints)}
          </span>
        </div>                    
      </div>
      <div className="menu-item">
        <span className="menu-title" style={{ color: '#FFD700', fontSize: '20px' }}>Points:</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className="menu-value points" style={{ color: '#51ff00', fontSize: '25px' }}>
            {isLoading ? 'Loading...' : error ? 'Error' : totalPoints.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="menu-item">
        <span className="menu-title" style={{ color: '#FFD700', fontSize: '20px' }}>Referrals:</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className="menu-value" style={{ color: '#51ff00', fontSize: '25px' }}>
            {isLoading ? 'Loading...' : error ? 'Error' : userData ? userData.referralCount : '0'}
          </span>
        </div>
      </div>
      <div className="menu-item">
        <span className="menu-title" style={{ color: '#FFD700', fontSize: '20px' }}>Quests:</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className="menu-value" style={{ color: '#51ff00', fontSize: '25px' }}>
            {completedQuests.length}/{quests.length}
          </span>
        </div>
      </div>
    </div>
  );
} 