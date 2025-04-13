import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * API для добавления выполненного квеста
 * POST /api/quests/complete
 * Body: { walletAddress: string, questId: number }
 * 
 * GET /api/quests/complete?questId=X&walletAddress=Y
 * Query: questId, walletAddress
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем данные из запроса
    const { walletAddress, questId } = await request.json();
    
    // Проверяем обязательные поля
    if (!walletAddress || !questId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    return await completeQuest(walletAddress, Number(questId));
  } catch (error) {
    console.error('Error completing quest:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Обработчик GET-запроса для совместимости
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем параметры из URL
    const { searchParams } = new URL(request.url);
    const questId = searchParams.get('questId');
    const walletAddress = searchParams.get('walletAddress');
    
    // Проверяем обязательные поля
    if (!walletAddress || !questId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    return await completeQuest(walletAddress, Number(questId));
  } catch (error) {
    console.error('Error completing quest (GET):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Общая функция для выполнения квеста
 */
async function completeQuest(walletAddress: string, questId: number) {
  console.log(`Добавление квеста ${questId} для кошелька ${walletAddress}`);
  
  // Находим пользователя по адресу кошелька
  const user = await prisma.user.findUnique({ where: { walletAddress } });
  
  if (!user) {
    console.log(`Пользователь с адресом ${walletAddress} не найден`);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  
  console.log(`Найден пользователь: ${user.id}`);
  
  // Проверяем, не выполнен ли уже квест
  const existingQuest = await prisma.questCompletion.findFirst({
    where: {
      userId: user.id,
      questId: questId
    }
  });
  
  if (existingQuest) {
    console.log(`Квест уже выполнен: ${existingQuest.id}`);
    return NextResponse.json({ 
      message: 'Quest already completed',
      questId,
      userId: user.id
    });
  }
  
  // Определяем количество очков за разные типы квестов
  let pointsToAdd = 5; // По умолчанию 5 очков
  let questName = '';
  
  switch (questId) {
    case 1:
      questName = 'Twitter';
      break;
    case 2:
      questName = 'Discord';
      break;
    case 3:
      questName = 'Telegram';
      break;
    default:
      questName = `Квест #${questId}`;
  }
  
  // Добавляем запись о выполненном квесте
  try {
    const newQuest = await prisma.questCompletion.create({
      data: {
        userId: user.id,
        questId: questId
      }
    });
    
    console.log(`Квест ${questName} добавлен: ${newQuest.id}`);
    
    // Обновляем количество очков пользователя
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        points: {
          increment: pointsToAdd
        }
      }
    });
    
    console.log(`Очки обновлены: ${updatedUser.points}`);
    
    return NextResponse.json({ 
      success: true, 
      questId,
      questName,
      userId: user.id,
      pointsAdded: pointsToAdd,
      totalPoints: updatedUser.points
    });
  } catch (error) {
    console.error(`Ошибка при добавлении квеста ${questName}:`, error);
    return NextResponse.json({ 
      error: 'Failed to save quest completion', 
      details: (error as Error).message 
    }, { status: 500 });
  }
} 