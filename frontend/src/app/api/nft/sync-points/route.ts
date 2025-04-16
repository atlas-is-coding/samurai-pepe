import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Определение баллов для каждого типа NFT
const NFT_POINTS = {
  'NFT1': 100,  // Kōjō (Common)
  'NFT2': 500,  // Daimyō (Rare)
  'NFT3': 2500  // Shōgun (Legendary)
};

// POST /api/nft/sync-points
// Обновляет баллы пользователя на основе уже имеющихся NFT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, nfts } = body;
    
    console.log('Получен запрос на синхронизацию баллов:', { walletAddress, nfts });
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address not specified' }, 
        { status: 400 }
      );
    }
    
    if (!nfts) {
      return NextResponse.json(
        { error: 'NFT ownership data must be specified' }, 
        { status: 400 }
      );
    }
    
    // Рассчитываем общее количество баллов на основе владения NFT
    const nft1Points = (nfts.NFT1 || 0) * NFT_POINTS.NFT1;
    const nft2Points = (nfts.NFT2 || 0) * NFT_POINTS.NFT2;
    const nft3Points = (nfts.NFT3 || 0) * NFT_POINTS.NFT3;
    const totalNftPoints = nft1Points + nft2Points + nft3Points;
    
    // Проверяем, есть ли NFT вообще
    const hasAnyNft = nfts.NFT1 > 0 || nfts.NFT2 > 0 || nfts.NFT3 > 0;
    
    if (!hasAnyNft) {
      console.log(`У пользователя ${walletAddress} нет NFT, синхронизация не требуется`);
      
      // Получаем текущие баллы пользователя из других источников
      const existingUser = await prisma.user.findUnique({
        where: { walletAddress }
      });
      
      return NextResponse.json({
        success: true,
        walletAddress,
        message: 'No NFTs found, keeping existing points',
        totalPoints: existingUser?.points || 0
      });
    }
    
    // Ищем существующего пользователя
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    if (!user) {
      // Если пользователь не существует, создаем его с баллами за NFT
      user = await prisma.user.create({
        data: {
          walletAddress,
          hasPurchasedNft: true,
          points: totalNftPoints
        }
      });
      
      console.log(`Создан новый пользователь ${walletAddress} с ${totalNftPoints} баллами (синхронизация)`);
      
      // Записываем данные о владении NFT для всех имеющихся токенов
      for (let i = 0; i < (nfts.NFT1 || 0); i++) {
        await prisma.nftPurchase.create({
          data: {
            userId: user.id,
            nftId: 'NFT1',
            pointsAwarded: NFT_POINTS.NFT1
          }
        });
      }
      
      for (let i = 0; i < (nfts.NFT2 || 0); i++) {
        await prisma.nftPurchase.create({
          data: {
            userId: user.id,
            nftId: 'NFT2',
            pointsAwarded: NFT_POINTS.NFT2
          }
        });
      }
      
      for (let i = 0; i < (nfts.NFT3 || 0); i++) {
        await prisma.nftPurchase.create({
          data: {
            userId: user.id,
            nftId: 'NFT3',
            pointsAwarded: NFT_POINTS.NFT3
          }
        });
      }
    } else {
      // Для существующего пользователя - сохраняем текущие баллы
      // и добавляем только баллы за новые NFT
      
      // Получаем текущие записи о NFT
      const existingPurchases = await prisma.nftPurchase.findMany({
        where: { userId: user.id }
      });
      
      // Считаем, сколько каких NFT уже записано
      const existingNfts = {
        NFT1: 0,
        NFT2: 0,
        NFT3: 0
      };
      
      existingPurchases.forEach(p => {
        if (p.nftId === 'NFT1') existingNfts.NFT1++;
        if (p.nftId === 'NFT2') existingNfts.NFT2++;
        if (p.nftId === 'NFT3') existingNfts.NFT3++;
      });
      
      // Рассчитываем баллы за существующие NFT
      const existingNftPoints = 
        existingNfts.NFT1 * NFT_POINTS.NFT1 + 
        existingNfts.NFT2 * NFT_POINTS.NFT2 + 
        existingNfts.NFT3 * NFT_POINTS.NFT3;
      
      // Рассчитываем баллы за новые NFT
      const newNft1 = Math.max(0, (nfts.NFT1 || 0) - existingNfts.NFT1);
      const newNft2 = Math.max(0, (nfts.NFT2 || 0) - existingNfts.NFT2);
      const newNft3 = Math.max(0, (nfts.NFT3 || 0) - existingNfts.NFT3);
      
      const newNftPoints = 
        newNft1 * NFT_POINTS.NFT1 + 
        newNft2 * NFT_POINTS.NFT2 + 
        newNft3 * NFT_POINTS.NFT3;
      
      console.log(`Обнаружены новые NFT: ${newNft1}x NFT1, ${newNft2}x NFT2, ${newNft3}x NFT3`);
      console.log(`Баллы за новые NFT: ${newNftPoints}`);
      
      if (newNftPoints > 0) {
        // Обновляем только если есть новые NFT, добавляя баллы к существующим
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            hasPurchasedNft: true,
            points: { increment: newNftPoints }
          }
        });
        
        console.log(`Добавлено ${newNftPoints} баллов пользователю ${walletAddress}`);
        
        // Добавляем записи о новых NFT
        for (let i = 0; i < newNft1; i++) {
          await prisma.nftPurchase.create({
            data: {
              userId: user.id,
              nftId: 'NFT1',
              pointsAwarded: NFT_POINTS.NFT1
            }
          });
        }
        
        for (let i = 0; i < newNft2; i++) {
          await prisma.nftPurchase.create({
            data: {
              userId: user.id,
              nftId: 'NFT2',
              pointsAwarded: NFT_POINTS.NFT2
            }
          });
        }
        
        for (let i = 0; i < newNft3; i++) {
          await prisma.nftPurchase.create({
            data: {
              userId: user.id,
              nftId: 'NFT3',
              pointsAwarded: NFT_POINTS.NFT3
            }
          });
        }
      } else {
        console.log(`У пользователя ${walletAddress} нет новых NFT, баллы не изменены`);
      }
    }
    
    // Возвращаем обновленную информацию
    const updatedUser = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    return NextResponse.json({
      success: true,
      walletAddress,
      totalPoints: updatedUser?.points || 0
    });
    
  } catch (error) {
    console.error('Error syncing user points:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message }, 
      { status: 500 }
    );
  }
} 