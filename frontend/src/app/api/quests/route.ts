import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Получаем адрес кошелька из параметров запроса
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Находим пользователя по адресу кошелька
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        completedQuests: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { completedQuests: [] },
        { status: 200 }
      );
    }

    // Преобразуем данные о выполненных квестах в массив ID
    const completedQuestIds = user.completedQuests.map(quest => quest.questId);

    return NextResponse.json(
      { completedQuests: completedQuestIds },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving completed quests:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve completed quests' },
      { status: 500 }
    );
  }
} 