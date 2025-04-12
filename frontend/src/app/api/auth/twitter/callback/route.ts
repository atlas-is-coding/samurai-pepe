import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Конфигурация Twitter OAuth
const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID!;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!;
const TWITTER_REDIRECT_URI = process.env.TWITTER_REDIRECT_URI!;
const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Интерфейсы для типизации ответов от Twitter API
interface TwitterTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  scope: string;
  refresh_token?: string;
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
}

/**
 * Извлечение адреса кошелька из state параметра
 */
function extractWalletFromState(state: string): string | null {
  try {
    // Проверяем, содержит ли state информацию о кошельке
    if (state.includes(':')) {
      const [_, walletData] = state.split(':');
      // Декодируем данные из base64
      return Buffer.from(walletData, 'base64').toString();
    }
    return null;
  } catch (error) {
    console.error('Error extracting wallet address from state:', error);
    return null;
  }
}

/**
 * Получение токена доступа от Twitter API
 */
async function getTwitterOAuthToken(code: string): Promise<TwitterTokenResponse | null> {
  try {
    // Создаем Basic Auth токен из ClientID и Secret
    const BasicAuthToken = Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString('base64');
    
    // Параметры для запроса токена
    const tokenParams = {
      code,
      grant_type: 'authorization_code',
      client_id: TWITTER_CLIENT_ID,
      redirect_uri: TWITTER_REDIRECT_URI,
      code_verifier: 'challenge' // Должно соответствовать challenge из authorize запроса
    };

    // Запрос к Twitter API для получения токена
    const response = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${BasicAuthToken}`
      },
      body: new URLSearchParams(tokenParams).toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twitter token error:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Twitter OAuth token:', error);
    return null;
  }
}

/**
 * Получение данных пользователя Twitter с помощью токена доступа
 */
async function getTwitterUser(accessToken: string): Promise<TwitterUser | null> {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twitter user error:', errorData);
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting Twitter user:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Получаем код и состояние из URL-параметров
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    // Получаем состояние из куки для проверки CSRF
    const savedState = request.cookies.get('twitter_oauth_state')?.value;

    // Если нет кода, состояния или они не совпадают - возвращаем ошибку
    if (!code || !state || !savedState || state !== savedState) {
      return NextResponse.redirect(`${CLIENT_URL}?error=invalid_state`);
    }

    // Получаем токен от Twitter
    const tokenResponse = await getTwitterOAuthToken(code);
    if (!tokenResponse || !tokenResponse.access_token) {
      return NextResponse.redirect(`${CLIENT_URL}?error=token_error`);
    }

    // Получаем данные пользователя Twitter
    const twitterUser = await getTwitterUser(tokenResponse.access_token);
    if (!twitterUser) {
      return NextResponse.redirect(`${CLIENT_URL}?error=user_error`);
    }

    // Извлекаем адрес кошелька из состояния
    const walletAddress = extractWalletFromState(state);
    
    if (walletAddress) {
      // Находим пользователя по адресу кошелька
      let user = await prisma.user.findUnique({ where: { walletAddress } });
      
      if (user) {
        // Обновляем имя пользователя Twitter
        await prisma.user.update({
          where: { id: user.id },
          data: { twitterUsername: twitterUser.username }
        });
        
        // Используем новый API для выполнения квеста
        try {
          const questCompletionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/quests/complete`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              walletAddress,
              questId: 1 // Twitter квест
            })
          });
          
          const questResult = await questCompletionResponse.json();
          console.log('Результат выполнения Twitter квеста:', questResult);
        } catch (error) {
          console.error('Ошибка при выполнении Twitter квеста:', error);
        }
      }
    }

    // Создаем редирект обратно на клиент с параметрами успеха
    const redirectURL = new URL(CLIENT_URL);
    redirectURL.searchParams.set('twitter_connected', 'true');
    redirectURL.searchParams.set('twitter_username', twitterUser.username);
    
    // Удаляем куки состояния
    const response = NextResponse.redirect(redirectURL.toString());
    response.cookies.delete('twitter_oauth_state');
    
    return response;
  } catch (error) {
    console.error('Error in Twitter OAuth callback:', error);
    return NextResponse.redirect(`${CLIENT_URL}?error=server_error`);
  }
} 