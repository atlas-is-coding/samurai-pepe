'use client';

import { Leaderboard } from '@/components/Leaderboard/Leaderboard';
import dynamic from 'next/dynamic';
import '@/components/Leaderboard/Leaderboard.css';

// Динамически импортируем WalletConnectionProvider без SSR
const WalletConnectionProvider = dynamic(
  () => import('@/components/ui/WalletProvider').then(mod => mod.WalletConnectionProvider),
  { ssr: false }
);

export default function LeaderboardPage() {
  return (
    <WalletConnectionProvider isPulse={false}>
      <Leaderboard />
    </WalletConnectionProvider>
  );
} 