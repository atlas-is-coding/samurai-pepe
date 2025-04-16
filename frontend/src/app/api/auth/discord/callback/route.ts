import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Конфигурация Discord OAuth
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;
const CLIENT_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pepesamurai.com';

// Интерфейсы для типизации ответов от Discord API
interface DiscordTokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
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
 * Получение токена доступа от Discord API
 */
async function getDiscordOAuthToken(code: string): Promise<DiscordTokenResponse | null> {
  try {
    // Параметры для запроса токена
    const tokenParams = {
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
    };

    // Запрос к Discord API для получения токена
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams).toString()
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Discord token error:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Discord OAuth token:', error);
    return null;
  }
}

/**
 * Получение данных пользователя Discord с помощью токена доступа
 */
async function getDiscordUser(accessToken: string): Promise<DiscordUser | null> {
  try {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Discord user error:', errorData);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Discord user:', error);
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
    const savedState = request.cookies.get('discord_oauth_state')?.value;

    // Если нет кода, состояния или они не совпадают - возвращаем ошибку
    if (!code || !state || !savedState || state !== savedState) {
      return NextResponse.redirect(`${CLIENT_URL}?error=invalid_state`);
    }

    // Получаем токен от Discord
    const tokenResponse = await getDiscordOAuthToken(code);
    if (!tokenResponse || !tokenResponse.access_token) {
      return NextResponse.redirect(`${CLIENT_URL}?error=token_error`);
    }

    // Получаем данные пользователя Discord
    const discordUser = await getDiscordUser(tokenResponse.access_token);
    if (!discordUser) {
      return NextResponse.redirect(`${CLIENT_URL}?error=user_error`);
    }

    // Извлекаем адрес кошелька из состояния
    const walletAddress = extractWalletFromState(state);
    
    if (walletAddress) {
      try {
        // Вместо прямого взаимодействия с базой данных используем созданный API
        // для добавления выполненного квеста
        const questCompletionResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/quests/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress,
            questId: 2 // Discord квест
          })
        });
        
        if (!questCompletionResponse.ok) {
          const errorText = await questCompletionResponse.text();
          console.error('Failed to complete Discord quest:', errorText);
          throw new Error(`Failed to complete quest: ${questCompletionResponse.status}`);
        }
        
        const questResult = await questCompletionResponse.json();
        console.log('Результат выполнения Discord квеста:', questResult);
      } catch (error) {
        console.error('Ошибка при выполнении Discord квеста:', error);
      }
    } else {
      console.log('Адрес кошелька не найден в state');
    }

    // Создаем редирект обратно на клиент с параметрами успеха
    const redirectURL = new URL(CLIENT_URL);
    redirectURL.searchParams.set('discord_connected', 'true');
    
    // Удаляем куки состояния
    const response = NextResponse.redirect(redirectURL.toString());
    response.cookies.delete('discord_oauth_state');
    
    return response;
  } catch (error) {
    console.error('Error in Discord OAuth callback:', error);
    return NextResponse.redirect(`${CLIENT_URL}?error=server_error`);
  }
} 