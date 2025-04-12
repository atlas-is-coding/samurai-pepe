import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/nft/force-update-points
// Принудительно обновляет баллы пользователя без проверки владения NFT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, points } = body;
    
    console.log('Принудительное обновление баллов:', { walletAddress, points });
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address not specified' }, 
        { status: 400 }
      );
    }
    
    if (typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Points must be a number' }, 
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
      
      console.log(`Создан новый пользователь ${walletAddress} с ${points} баллами (force update)`);
    } else {
      // Обновляем баллы пользователя
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          hasPurchasedNft: true,
          points: points
        }
      });
      
      console.log(`Обновлены баллы пользователя ${walletAddress}, установлено: ${points}`);
    }
    
    return NextResponse.json({
      success: true,
      walletAddress,
      points: user.points
    });
    
  } catch (error) {
    console.error('Error updating user points:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message }, 
      { status: 500 }
    );
  }
} 