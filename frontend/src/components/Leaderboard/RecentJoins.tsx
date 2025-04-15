'use client';

interface JoinInfo {
  time: string;
  username: string;
  inviter: string;
}

interface RecentJoinsProps {
  joins: JoinInfo[];
}

// Функция для форматирования времени в формат "X минут/часов/дней назад"
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // Проверяем валидность даты
  if (isNaN(date.getTime())) {
    return dateString; // Возвращаем исходную строку, если не можем распарсить
  }
  
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Различные временные интервалы
  const intervals = {
    год: 31536000,
    месяц: 2592000,
    неделя: 604800,
    день: 86400,
    час: 3600,
    минута: 60
  };
  
  // Определяем подходящий интервал
  let counter;
  let interval: keyof typeof intervals;
  
  for (interval in intervals) {
    counter = Math.floor(seconds / intervals[interval]);
    if (counter > 0) {
      // Правильное склонение для русского языка
      if (interval === 'год') {
        return counter === 1 ? `${counter} год назад` : 
               counter < 5 ? `${counter} года назад` : `${counter} лет назад`;
      } else if (interval === 'месяц') {
        return counter === 1 ? `${counter} месяц назад` : 
               counter < 5 ? `${counter} месяца назад` : `${counter} месяцев назад`;
      } else if (interval === 'неделя') {
        return counter === 1 ? `${counter} неделю назад` : 
               counter < 5 ? `${counter} недели назад` : `${counter} недель назад`;
      } else if (interval === 'день') {
        return counter === 1 ? `${counter} день назад` : 
               counter < 5 ? `${counter} дня назад` : `${counter} дней назад`;
      } else if (interval === 'час') {
        return counter === 1 ? `${counter} час назад` : 
               counter < 5 ? `${counter} часа назад` : `${counter} часов назад`;
      } else if (interval === 'минута') {
        return counter === 1 ? `${counter} минуту назад` : 
               counter < 5 ? `${counter} минуты назад` : `${counter} минут назад`;
      }
    }
  }
  
  return 'только что';
}

export function RecentJoins({ joins }: RecentJoinsProps) {
  return (
    <div className="recent-joins">
      <h2>Recent Joins</h2>
      <ul className="recent-joins-list">
        {joins.map((join, index) => (
          <li key={index}>
            <span className="join-time">{timeAgo(join.time)}</span>
            <span className="join-user">{join.username}</span> invited by
            <span className="inviter">{join.inviter}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 