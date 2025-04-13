import { Metadata } from 'next';
import { ReferralClient } from './ReferralClient';

export const metadata: Metadata = {
  title: 'Referral Program | Samurai Pepe',
  description: 'Join Samurai Pepe via referral and earn bonus points'
};

export default async function ReferralPage({
  params,
}: {
  params: Promise<{ referralId: string }>;
}) {
  const { referralId } = await params;
  return <ReferralClient inviteCode={referralId} />;
} 