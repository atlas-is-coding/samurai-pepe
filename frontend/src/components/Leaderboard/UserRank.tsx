'use client';

interface UserRankProps {
  rank: number;
  username: string;
  invitedBy: string;
  points: number;
  isCurrentUser?: boolean;
}

export function UserRank({ rank, username, invitedBy, points, isCurrentUser = false }: UserRankProps) {
  // Определяем класс для первых трех мест
  let placeClass = '';
  if (rank === 1) {
    placeClass = 'first-place';
  } else if (rank === 2) {
    placeClass = 'second-place';
  } else if (rank === 3) {
    placeClass = 'third-place';
  }
  
  // Добавляем класс текущего пользователя, если это нужно
  const rowClass = `${placeClass} ${isCurrentUser ? 'current-user-row' : ''}`.trim();
  
  // Получаем первую букву имени пользователя для аватара
  const avatarLetter = username.charAt(0).toUpperCase();
  
  return (
    <tr className={rowClass}>
      <td className="user-rank">
        {rank}
        {isCurrentUser && <span className="current-badge">You</span>}
      </td>
      <td>
        <div className="user-info">
          <div className={`user-avatar ${isCurrentUser ? 'current-user-avatar' : ''}`}>
            {isCurrentUser ? '@' : avatarLetter}
          </div>
          <div className="user-name">
            {username}
            {isCurrentUser && <span className="current-user-label"> (You)</span>}
          </div>
        </div>
      </td>
      <td>{invitedBy}</td>
      <td className="points-column">
        {points.toLocaleString()}
      </td>
    </tr>
  );
} 