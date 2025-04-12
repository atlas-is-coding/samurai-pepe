import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/user-status?walletAddress=<wallet_address>
// Возвращает информацию о статусе пользователя, включая поле referredBy
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address not specified' }, 
        { status: 400 }
      );
    }
    
    // Найти пользователя в базе данных
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        walletAddress: true,
        points: true,
        referredBy: true,
        hasPurchasedNft: true,
        inviteCode: true,
        userReferrals: {
          select: {
            id: true,
          }
        }
      }
    });
    
    // Если пользователь не существует, вернуть пустой ответ
    if (!user) {
      return NextResponse.json({
        walletAddress,
        exists: false,
        referredBy: null,
        hasPurchasedNft: false,
        inviteCode: null,
        referralCount: 0,
        points: 0
      });
    }
    
    // Вернуть информацию о пользователе
    return NextResponse.json({
      exists: true,
      walletAddress: user.walletAddress,
      referredBy: user.referredBy,
      hasPurchasedNft: user.hasPurchasedNft,
      inviteCode: user.inviteCode,
      referralCount: user.userReferrals.length,
      points: user.points
    });
    
  } catch (error) {
    console.error('Error getting user status:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 