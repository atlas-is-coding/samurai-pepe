import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    const nft1Points = (nfts.NFT1 || 0) * 10;
    const nft2Points = (nfts.NFT2 || 0) * 20;
    const nft3Points = (nfts.NFT3 || 0) * 50;
    const totalPoints = nft1Points + nft2Points + nft3Points;
    
    // Проверяем, есть ли NFT вообще
    const hasAnyNft = nfts.NFT1 > 0 || nfts.NFT2 > 0 || nfts.NFT3 > 0;
    
    if (!hasAnyNft) {
      console.log(`У пользователя ${walletAddress} нет NFT, синхронизация не требуется`);
      return NextResponse.json({
        success: true,
        walletAddress,
        message: 'No NFTs found, sync not needed',
        totalPoints: 0
      });
    }
    
    // Ищем существующего пользователя
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    // Упрощенная логика для демонстрации - просто обновляем баллы на основе текущего владения NFT
    // Полная логика через проверку предыдущих покупок создает слишком много сложностей
    
    if (!user) {
      // Если пользователь не существует, создаем его со всеми баллами
      user = await prisma.user.create({
        data: {
          walletAddress,
          hasPurchasedNft: true,
          points: totalPoints
        }
      });
      
      console.log(`Создан новый пользователь ${walletAddress} с ${totalPoints} баллами (синхронизация)`);
      
      // Записываем данные о владении NFT для всех имеющихся токенов
      for (let i = 0; i < (nfts.NFT1 || 0); i++) {
        await prisma.nftPurchase.create({
          data: {
            userId: user.id,
            nftId: 'NFT1',
            pointsAwarded: 10
          }
        });
      }
      
      for (let i = 0; i < (nfts.NFT2 || 0); i++) {
        await prisma.nftPurchase.create({
          data: {
            userId: user.id,
            nftId: 'NFT2',
            pointsAwarded: 20
          }
        });
      }
      
      for (let i = 0; i < (nfts.NFT3 || 0); i++) {
        await prisma.nftPurchase.create({
          data: {
            userId: user.id,
            nftId: 'NFT3',
            pointsAwarded: 50
          }
        });
      }
    } else {
      // Если у пользователя уже есть баллы, проверяем сколько у него должно быть всего
      // по всем имеющимся NFT, и если текущих меньше, добавляем разницу
      
      // Сначала проверяем существующие покупки
      const expectedTotal = totalPoints;
      
      // Проверяем текущее количество баллов
      const currentPoints = user.points || 0;
      
      // Если у пользователя меньше баллов, чем должно быть, добавляем разницу
      if (currentPoints < expectedTotal) {
        const pointsToAdd = expectedTotal - currentPoints;
        
        user = await prisma.user.update({
          where: { id: user.id },
          data: { 
            hasPurchasedNft: true,
            points: expectedTotal
          }
        });
        
        console.log(`Обновлены баллы пользователя ${walletAddress}, установлено: ${expectedTotal} (было ${currentPoints})`);
        
        // Обновляем информацию о покупках NFT в базе данных
        // Получаем текущие записи
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
        
        // Добавляем записи о недостающих NFT
        for (let i = existingNfts.NFT1; i < (nfts.NFT1 || 0); i++) {
          await prisma.nftPurchase.create({
            data: {
              userId: user.id,
              nftId: 'NFT1',
              pointsAwarded: 10
            }
          });
        }
        
        for (let i = existingNfts.NFT2; i < (nfts.NFT2 || 0); i++) {
          await prisma.nftPurchase.create({
            data: {
              userId: user.id,
              nftId: 'NFT2',
              pointsAwarded: 20
            }
          });
        }
        
        for (let i = existingNfts.NFT3; i < (nfts.NFT3 || 0); i++) {
          await prisma.nftPurchase.create({
            data: {
              userId: user.id,
              nftId: 'NFT3',
              pointsAwarded: 50
            }
          });
        }
      } else {
        console.log(`У пользователя ${walletAddress} уже достаточно баллов: ${currentPoints}`);
      }
    }
    
    // Возвращаем обновленную информацию
    const updatedUser = await prisma.user.findUnique({
      where: { walletAddress }
    });
    
    return NextResponse.json({
      success: true,
      walletAddress,
      totalPoints: updatedUser?.points || totalPoints
    });
    
  } catch (error) {
    console.error('Error syncing user points:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message }, 
      { status: 500 }
    );
  }
} 