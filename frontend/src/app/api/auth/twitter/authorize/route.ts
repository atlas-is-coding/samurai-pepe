import { NextRequest, NextResponse } from 'next/server';

// Конфигурация Twitter OAuth
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI!;
const TWITTER_OAUTH_URL = process.env.TWITTER_OAUTH_URL || 'https://twitter.com/i/oauth2/authorize';

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
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: TWITTER_REDIRECT_URI,
      scope: 'tweet.read users.read offline.access',
      state: state,
      code_challenge: 'challenge', // Для PKCE Flow можно добавить более сложную реализацию
      code_challenge_method: 'plain'
    });

    // Сохраняем состояние в куки для последующей проверки
    const response = NextResponse.redirect(`${TWITTER_OAUTH_URL}?${params.toString()}`);
    response.cookies.set('twitter_oauth_state', state, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10 // 10 минут
    });

    return response;
  } catch (error) {
    console.error('Error initiating Twitter auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Twitter authentication' },
      { status: 500 }
    );
  }
} 