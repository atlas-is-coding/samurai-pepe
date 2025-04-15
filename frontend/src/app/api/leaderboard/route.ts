import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/leaderboard - Get top 100 users by points
export async function GET(request: NextRequest) {
  try {
    // Get limit query parameter (default to 100 if not provided)
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    
    // Get user's wallet address if provided
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');
    
    // Fetch top users by points
    const topUsers = await prisma.user.findMany({
      take: limit,
      orderBy: {
        points: 'desc',
      },
      select: {
        id: true,
        walletAddress: true,
        points: true,
        referredBy: true,
        twitterUsername: true,
        userReferrals: {
          select: {
            referredAddress: true,
          },
        },
      },
    });
    
    // Get the user rank if wallet address is provided
    let userRank = null;
    if (walletAddress) {
      const userCount = await prisma.user.count({
        where: {
          points: {
            gt: (await prisma.user.findUnique({
              where: { walletAddress },
              select: { points: true },
            }))?.points || 0,
          },
        },
      });
      userRank = userCount + 1; // Rank is count of users with more points + 1
    }
    
    // Получаем все коды приглашений для пользователей-приглашателей
    const inviterCodes = new Map<string, string>();
    
    // Собираем все уникальные адреса приглашающих пользователей
    const referrerAddresses = topUsers
      .filter(user => user.referredBy)
      .map(user => user.referredBy as string);
    
    if (referrerAddresses.length > 0) {
      // Получаем коды приглашений для всех приглашающих пользователей
      const referrers = await prisma.user.findMany({
        where: {
          walletAddress: {
            in: referrerAddresses
          }
        },
        select: {
          walletAddress: true,
          inviteCode: true
        }
      });
      
      // Создаем map адрес -> код приглашения
      for (const referrer of referrers) {
        if (referrer.walletAddress && referrer.inviteCode) {
          inviterCodes.set(referrer.walletAddress, referrer.inviteCode);
        }
      }
    }
    
    // Map the data to include referral count and simplify structure
    const formattedUsers = topUsers.map(user => {
      // Если у пользователя есть приглашающий, получаем его код приглашения
      let inviteCodeUsed = null;
      if (user.referredBy) {
        inviteCodeUsed = inviterCodes.get(user.referredBy) || user.referredBy;
      }
      
      return {
        walletAddress: user.walletAddress,
        points: user.points,
        invitedBy: inviteCodeUsed, // Используем код приглашения, а не адрес
        referralCount: user.userReferrals.length,
        twitterUsername: user.twitterUsername || null,
      };
    });
    
    return NextResponse.json({
      success: true,
      users: formattedUsers,
      userRank,
      totalUsers: await prisma.user.count(),
    });
    
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 