import { NextRequest, NextResponse } from 'next/server';

// Конфигурация Discord OAuth
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;
const DISCORD_OAUTH_URL = process.env.DISCORD_OAUTH_URL || 'https://discord.com/api/oauth2/authorize';

// Состояние для предотвращения CSRF
const generateState = (walletAddress?: string) => {
  // Базовый рандомный идентификатор
  const randomId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  
  // Если есть адрес кошелька, включаем его в состояние
  if (walletAddress) {
    // Кодируем данные в base64 для безопасности и совместимости
    const walletData = Buffer.from(walletAddress).toString('base64');
    return `${randomId}:${walletData}`;
  }
  
  return randomId;
};

export async function GET(request: NextRequest) {
  try {
    // Получаем адрес кошелька из query параметра, если он есть
    const walletAddress = request.nextUrl.searchParams.get('wallet');
    
    // Создаем состояние для защиты от CSRF, включая данные кошелька
    const state = generateState(walletAddress || undefined);
    
    // Кодируем URL-параметры
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: DISCORD_CLIENT_ID,
      redirect_uri: DISCORD_REDIRECT_URI,
      scope: 'identify email',
      state: state,
    });

    // Сохраняем состояние в куки для последующей проверки
    const response = NextResponse.redirect(`${DISCORD_OAUTH_URL}?${params.toString()}`);
    response.cookies.set('discord_oauth_state', state, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10 // 10 минут
    });

    return response;
  } catch (error) {
    console.error('Error initiating Discord auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Discord authentication' },
      { status: 500 }
    );
  }
} 