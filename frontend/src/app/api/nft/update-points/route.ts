import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Определение баллов для каждого типа NFT
const NFT_POINTS = {
  'NFT1': 100,  // Kōjō (Common)
  'NFT2': 500,  // Daimyō (Rare)
  'NFT3': 2500  // Shōgun (Legendary)
};

// POST /api/nft/update-points
// Обновляет баллы пользователя после покупки NFT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, nftId } = body;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address not specified' }, 
        { status: 400 }
      );
    }
    
    if (!nftId) {
      return NextResponse.json(
        { error: 'NFT ID must be specified' }, 
        { status: 400 }
      );
    }
    
    // Определяем количество баллов на основе типа NFT
    const points = NFT_POINTS[nftId as keyof typeof NFT_POINTS] || 0;
    
    if (points === 0) {
      return NextResponse.json(
        { error: 'Invalid NFT ID specified' }, 
        { status: 400 }
      );
    }
    
    // Ищем существующего пользователя
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    if (!user) {
      // Если пользователь не существует, создаем его
      user = await prisma.user.create({
        data: {
          walletAddress,
          hasPurchasedNft: true,
          points: points
        }
      });
      
      console.log(`Создан новый пользователь ${walletAddress} с ${points} баллами`);
    } else {
      // Если пользователь существует, обновляем количество баллов и статус NFT
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          hasPurchasedNft: true,
          points: {
            increment: points
          }
        }
      });
      
      console.log(`Обновлены баллы пользователя ${walletAddress}, добавлено: ${points}`);
    }
    
    // Записываем в лог покупку NFT
    await prisma.nftPurchase.create({
      data: {
        userId: user.id,
        nftId,
        pointsAwarded: points
      }
    });
    
    console.log(`Записана покупка NFT ${nftId} пользователем ${walletAddress}`);
    
    // Обновляем статус рефералов, если они есть
    await updateReferralStatus(user.id, walletAddress);
    
    return NextResponse.json({
      success: true,
      walletAddress,
      nftId,
      pointsAwarded: points,
      totalPoints: user.points
    });
    
  } catch (error) {
    console.error('Error updating user points:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message }, 
      { status: 500 }
    );
  }
}

// Обновляет статус рефералов при покупке NFT
async function updateReferralStatus(userId: string, walletAddress: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredBy: true }
    });
    
    if (!user?.referredBy) {
      console.log(`У пользователя ${walletAddress} нет реферера`);
      return;
    }
    
    // Обновляем статус реферального лога
    await prisma.referralLog.updateMany({
      where: {
        userAddress: walletAddress,
        status: 'pending'
      },
      data: {
        status: 'completed'
      }
    });
    
    console.log(`Обновлен статус реферала для пользователя ${walletAddress}`);
    
  } catch (error) {
    console.error('Error updating referral status:', error);
  }
} 