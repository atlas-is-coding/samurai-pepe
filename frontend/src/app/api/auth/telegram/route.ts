import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Получаем параметры из URL
    const searchParams = request.nextUrl.searchParams;
    const telegramData = Object.fromEntries(searchParams.entries());
    
    // Логируем полные данные для отладки
    console.log('Полученные данные от Telegram:', telegramData);
    
    // Данные, которые нужно проверить на подлинность
    const { hash, ...dataToCheck } = telegramData;
    
    if (!hash) {
      return NextResponse.json({ error: 'Hash parameter is missing' }, { status: 400 });
    }
    
    // Проверка хеша для подтверждения, что данные пришли от Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({ error: 'Telegram bot token not configured' }, { status: 500 });
    }
    
    // Создаем строку данных для проверки
    const dataCheckString = Object.keys(dataToCheck)
      .sort()
      .map(key => `${key}=${dataToCheck[key]}`)
      .join('\n');
    
    // Создаем хеш на основе данных и токена бота
    const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const calculatedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    // Проверяем хеш
    if (calculatedHash !== hash) {
      return NextResponse.json({ error: 'Data is not from Telegram' }, { status: 403 });
    }
    
    // Получаем id пользователя Telegram
    const telegramId = dataToCheck.id;
    // В Telegram OAuth данные пользователя приходят в поле id
    // Дополнительно можем получать эти данные из полей auth_date, first_name, last_name, username, photo_url
    
    if (!telegramId) {
      return NextResponse.json({ error: 'Telegram ID is missing' }, { status: 400 });
    }
    
    // Получаем адрес кошелька из URL параметров (если есть)
    const walletAddress = searchParams.get('wallet');
    
    // Ищем существующего пользователя по telegramId
    let user = await prisma.user.findUnique({
      where: { telegramId }
    });
    
    if (user) {
      // Если пользователь найден, обновляем его данные
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          telegramUsername: dataToCheck.username || undefined,
          name: dataToCheck.first_name || undefined,
          walletAddress: walletAddress || user.walletAddress,
          // В Telegram OAuth поле id это и есть user_id
          telegramUserId: telegramId
        }
      });
    } else {
      // Если пользователь с таким telegramId не найден, создаем нового
      user = await prisma.user.create({
        data: {
          telegramId,
          telegramUsername: dataToCheck.username || undefined,
          name: dataToCheck.first_name || undefined,
          walletAddress,
          telegramUserId: telegramId
        }
      });
    }
    
    // Обновляем статус квеста
    try {
      // Используем новый API для выполнения квеста
      const questResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quests/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: user.walletAddress,
          questId: 3 // Telegram квест
        })
      });
      
      const questResult = await questResponse.json();
      console.log('Результат выполнения Telegram квеста:', questResult);
    } catch (error) {
      console.error('Ошибка при выполнении Telegram квеста:', error);
      // Продолжаем выполнение даже в случае ошибки, чтобы не блокировать пользователя
    }
    
    // Возвращаем успех и перенаправляем пользователя
    return NextResponse.redirect(
      new URL(`/?success=true&telegram_connected=true`, request.url)
    );
  } catch (error) {
    console.error('Error during Telegram authentication:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 