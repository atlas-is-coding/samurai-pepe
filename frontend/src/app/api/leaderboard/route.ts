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
    
    // Map the data to include referral count and simplify structure
    const formattedUsers = topUsers.map(user => ({
      walletAddress: user.walletAddress,
      points: user.points,
      invitedBy: user.referredBy || null,
      referralCount: user.userReferrals.length,
      twitterUsername: user.twitterUsername || null,
    }));
    
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