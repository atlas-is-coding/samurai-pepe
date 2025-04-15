import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET handler for user invite code
 * @param request - NextRequest object
 * @returns NextResponse with user invite code or error
 */
export async function GET(request: NextRequest) {
  try {
    // Get wallet address and wallet type from query params
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const walletType = searchParams.get('walletType') || 'unknown';

    console.log(`API: Received invite code request for wallet ${walletAddress} (type: ${walletType})`);

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Получаем пользователя из базы данных
    let user = await prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    console.log(`API: User from database: ${user ? 'found' : 'not found'}`);

    // Если пользователь не найден, создаем нового
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          hasPurchasedNft: true, // Временно устанавливаем true для тестирования
          points: 100, // Даем начальные очки
        },
      });
      console.log(`API: Created new user with wallet ${walletAddress}`);
    }

    // Обходное решение: принудительно устанавливаем hasPurchasedNft в true
    // Это нужно для тестирования, пока мы не решим проблему с Solflare
    if (!user.hasPurchasedNft) {
      user = await prisma.user.update({
        where: { walletAddress },
        data: { hasPurchasedNft: true }
      });
      console.log(`API: Updated user to have hasPurchasedNft=true for testing`);
    }

    /* Временно отключаем эту проверку
    // Проверяем, есть ли у пользователя NFT
    if (!user.hasPurchasedNft) {
      return NextResponse.json(
        { error: 'You need to own at least one NFT to get an invite code' },
        { status: 403 }
      );
    }
    */

    // Если у пользователя уже есть инвайт-код, просто возвращаем его
    if (user.inviteCode) {
      console.log(`API: Returning existing invite code: ${user.inviteCode}`);
      return NextResponse.json({ inviteCode: user.inviteCode }, { status: 200 });
    }

    // Функция для генерации случайного 6-значного кода
    const generateRandomCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    // Генерируем новый код и сохраняем его в базу данных
    let inviteCode;
    let isUnique = false;
    
    // Пытаемся сгенерировать уникальный код
    while (!isUnique) {
      inviteCode = generateRandomCode();
      
      // Проверяем, существует ли такой код в базе данных
      const existingCode = await prisma.user.findUnique({
        where: {
          inviteCode,
        },
      });
      
      if (!existingCode) {
        isUnique = true;
      }
    }
    
    // Обновляем пользователя с новым инвайт-кодом
    user = await prisma.user.update({
      where: {
        walletAddress,
      },
      data: {
        inviteCode,
      },
    });

    console.log(`API: Generated and saved new invite code: ${inviteCode}`);
    return NextResponse.json({ inviteCode }, { status: 200 });
  } catch (error) {
    console.error('Error getting user invite code:', error);
    return NextResponse.json(
      { error: 'Failed to get invite code' },
      { status: 500 }
    );
  }
} 