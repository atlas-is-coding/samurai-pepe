import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/joins - Get recent referrals/joins
export async function GET(request: NextRequest) {
  try {
    // Get limit query parameter (default to 15 if not provided)
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 15;
    
    // Fetch recent user referrals
    const recentReferrals = await prisma.userReferral.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            walletAddress: true,
          },
        },
      },
    });
    
    // Format the data for the frontend
    const formattedJoins = await Promise.all(
      recentReferrals.map(async (referral) => {
        // Get the referred user data
        const referredUser = await prisma.user.findFirst({
          where: {
            walletAddress: referral.referredAddress,
          },
          select: {
            walletAddress: true,
            createdAt: true,
          },
        });
        
        // Calculate time since join
        const minutesSinceJoin = referredUser
          ? Math.floor((Date.now() - new Date(referredUser.createdAt).getTime()) / (1000 * 60))
          : 0;
        
        let timeDisplay = '';
        if (minutesSinceJoin < 60) {
          timeDisplay = `${minutesSinceJoin} mins ago`;
        } else if (minutesSinceJoin < 1440) { // Less than a day
          timeDisplay = `${Math.floor(minutesSinceJoin / 60)} hours ago`;
        } else {
          timeDisplay = `${Math.floor(minutesSinceJoin / 1440)} days ago`;
        }
        
        return {
          time: timeDisplay,
          username: referral.referredAddress, // Can be replaced with real username if available
          inviter: referral.user.walletAddress, // Can be replaced with real username if available
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      joins: formattedJoins,
    });
    
  } catch (error) {
    console.error('Error fetching recent joins data:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 