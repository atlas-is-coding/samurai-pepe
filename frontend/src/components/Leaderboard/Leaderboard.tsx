'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { UserRank } from './UserRank';
import { RecentJoins } from './RecentJoins';
import { useWallet } from '@solana/wallet-adapter-react';
import './Leaderboard.css';

interface User {
  walletAddress: string;
  points: number;
  invitedBy: string | null;
  referralCount: number;
  twitterUsername: string | null;
}

interface JoinInfo {
  time: string;
  username: string;
  inviter: string;
}

function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function Leaderboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [recentJoins, setRecentJoins] = useState<JoinInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { publicKey, connected } = useWallet();

  // Создаем базовый объект пользователя для случая, когда данные еще не загружены
  const baseCurrentUser = useMemo(() => {
    if (!connected || !publicKey) return null;
    
    const walletAddress = publicKey.toString();
    return {
      walletAddress,
      points: 0,
      invitedBy: null,
      referralCount: 0,
      twitterUsername: null
    };
  }, [connected, publicKey]);

  // Function to fetch leaderboard data
  const fetchLeaderboardData = async () => {
    try {
      setIsLoading(true);
      
      // Запрашиваем таблицу лидеров с указанием адреса кошелька текущего пользователя
      let url = '/api/leaderboard';
      let walletAddress = '';
      
      // Если кошелек подключен, добавляем адрес в запрос
      if (connected && publicKey) {
        walletAddress = publicKey.toString();
        url = `/api/leaderboard?walletAddress=${walletAddress}`;
        
        // Сразу устанавливаем базовый объект текущего пользователя
        // Это гарантирует, что пользователь будет отображаться даже до загрузки данных
        setCurrentUser(baseCurrentUser);
      } else {
        // Если кошелек не подключен, сбрасываем данные текущего пользователя
        setCurrentUser(null);
        setCurrentUserRank(null);
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        
        // Если кошелек подключен, обрабатываем информацию о текущем пользователе
        if (connected && publicKey && walletAddress) {
          // Получаем ранг пользователя из ответа API
          setCurrentUserRank(data.userRank || null);
          
          // Находим информацию о текущем пользователе в списке пользователей
          const userFromList = data.users.find(
            (user: User) => user.walletAddress.toLowerCase() === walletAddress.toLowerCase()
          );
          
          if (userFromList) {
            setCurrentUser(userFromList);
            console.log('Current user found:', userFromList);
          } else {
            console.log('Current user not found in list, using base user');
            // Используем базовый объект пользователя, если он не найден в списке
            setCurrentUser(baseCurrentUser);
          }
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError('Failed to load leaderboard data');
      
      // При ошибке сохраняем базовый объект пользователя, если кошелек подключен
      if (connected && publicKey) {
        setCurrentUser(baseCurrentUser);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch recent joins data
  const fetchRecentJoins = async () => {
    try {
      const response = await fetch('/api/joins');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent joins data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRecentJoins(data.joins);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error loading recent joins:', err);
      // We don't set the main error state here to avoid blocking leaderboard display
    }
  };

  // Обновляем текущего пользователя при изменении состояния подключения кошелька
  useEffect(() => {
    console.log("Wallet state:", connected ? "Connected" : "Not connected", publicKey?.toString());
    
    // Если кошелек подключен, сразу устанавливаем базовый объект пользователя
    if (connected && publicKey) {
      setCurrentUser(baseCurrentUser);
    } else {
      // Если кошелек отключен, сбрасываем данные пользователя
      setCurrentUser(null);
      setCurrentUserRank(null);
    }
    
    // Загружаем актуальные данные
    fetchLeaderboardData();
    fetchRecentJoins();
    
    // Set up polling for updates
    const leaderboardInterval = setInterval(fetchLeaderboardData, 60000); // every 1 minute
    const joinsInterval = setInterval(fetchRecentJoins, 30000); // every 30 seconds
    
    return () => {
      clearInterval(leaderboardInterval);
      clearInterval(joinsInterval);
    };
  }, [connected, publicKey, baseCurrentUser]);

  // Отладочный вывод состояния текущего пользователя
  useEffect(() => {
    console.log("Current user state:", currentUser, "Rank:", currentUserRank);
  }, [currentUser, currentUserRank]);

  // Определяем, нужно ли отображать строку текущего пользователя
  const shouldShowCurrentUser = Boolean(connected && publicKey);

  return (
    <div className="leaderboard-container">
      <div className="nav-buttons">
        <Link href="/" className="back-button">
          Back Samurai Pepe
        </Link>
        <span className="current-page">Leaderboard</span>
      </div>

      <div className="leaderboard-header">
        <h1>Leaderboard</h1>
        <p>Bridge, use Dapps, & invite friends to rank up</p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading leaderboard data...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={fetchLeaderboardData} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <div className="table-container">
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th className="address-column">Address</th>
                  <th>Invite Code Used</th>
                  <th className="points-column">Points</th>
                </tr>
              </thead>
              <tbody>
                {/* Текущий пользователь всегда отображается первым, если кошелек подключен */}
                {shouldShowCurrentUser && (
                  <tr className="current-user-row">
                    <td className="user-rank">
                      {currentUserRank !== null ? currentUserRank : '?'}
                      <span className="current-badge">You</span>
                    </td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar current-user-avatar">
                          @
                        </div>
                        <div className="user-name">
                          {currentUser?.twitterUsername 
                            ? `@${currentUser.twitterUsername}` 
                            : publicKey ? shortenAddress(publicKey.toString()) : 'Unknown'}
                          <span className="current-user-label"> (You)</span>
                        </div>
                      </div>
                    </td>
                    <td>{currentUser?.invitedBy || 'N/A'}</td>
                    <td className="points-column">
                      {currentUser?.points !== undefined ? currentUser.points.toLocaleString() : '0'}
                    </td>
                  </tr>
                )}
                
                {/* Топ пользователи из API, включая текущего пользователя */}
                {users
                  .slice(0, 100)
                  .map((user, index) => {
                    // Определяем класс для первых трех мест
                    let placeClass = '';
                    if (index === 0) {
                      placeClass = 'first-place';
                    } else if (index === 1) {
                      placeClass = 'second-place';
                    } else if (index === 2) {
                      placeClass = 'third-place';
                    }
                    
                    return (
                      <tr key={user.walletAddress} className={placeClass}>
                        <td className="user-rank">{index + 1}</td>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.twitterUsername 
                                ? '@' 
                                : user.walletAddress.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-name">
                              {user.twitterUsername 
                                ? `@${user.twitterUsername}` 
                                : shortenAddress(user.walletAddress)}
                            </div>
                          </div>
                        </td>
                        <td>{user.invitedBy || 'N/A'}</td>
                        <td className="points-column">
                          {user.points.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="no-data">
                      No users found. Be the first to join!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <RecentJoins joins={recentJoins} />
        </div>
      )}
      
      {/* Глобальные стили для скрытия wallet-header на мобильных экранах */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .wallet-header {
            display: none !important;
          }
          
          /* Убедимся, что столбец Address видим */
          .address-column,
          .leaderboard-table td:nth-child(2) {
            display: table-cell !important;
          }
        }
      `}</style>
    </div>
  );
}