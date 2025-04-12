'use client';

interface JoinInfo {
  time: string;
  username: string;
  inviter: string;
}

interface RecentJoinsProps {
  joins: JoinInfo[];
}

export function RecentJoins({ joins }: RecentJoinsProps) {
  return (
    <div className="recent-joins">
      <h2>Recent Joins</h2>
      <ul className="recent-joins-list">
        {joins.map((join, index) => (
          <li key={index}>
            <span className="join-time">{join.time}</span>
            <span className="join-user">{join.username}</span> invited by
            <span className="inviter">{join.inviter}</span>
          </li>
        ))}
      </ul>
    </div>
  );
} 