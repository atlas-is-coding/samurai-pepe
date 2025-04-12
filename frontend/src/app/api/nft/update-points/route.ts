import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/nft/update-points
// Обновляет баллы пользователя после покупки NFT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, nftId, points } = body;
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address not specified' }, 
        { status: 400 }
      );
    }
    
    if (!nftId || !points) {
      return NextResponse.json(
        { error: 'NFT ID and points must be specified' }, 
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
    
    return NextResponse.json({
      success: true,
      walletAddress,
      nftId,
      pointsAdded: points,
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