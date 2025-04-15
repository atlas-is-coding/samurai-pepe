import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET handler for user profile
 * @param request - NextRequest object
 * @returns NextResponse with user profile or error
 */
export async function GET(request: NextRequest) {
  try {
    // Get wallet address from query params
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Пытаемся найти пользователя по адресу кошелька
    const user = await prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          walletAddress,
          nickname: null,
          points: 0,
          joinDate: new Date().toISOString()
        }, 
        { status: 200 }
      );
    }

    // Возвращаем данные пользователя
    return NextResponse.json({
      walletAddress,
      nickname: user.name,
      points: user.points,
      joinDate: user.createdAt.toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating user profile
 * @param request - NextRequest object with request body
 * @returns NextResponse with updated user profile or error
 */
export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { walletAddress, nickname } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!nickname || nickname.trim() === '') {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    // Ищем пользователя по адресу кошелька
    let user = await prisma.user.findUnique({
      where: {
        walletAddress,
      },
    });

    // Если пользователь существует, обновляем его имя
    if (user) {
      user = await prisma.user.update({
        where: {
          walletAddress,
        },
        data: {
          name: nickname,
        },
      });
    } 
    // Если пользователя нет, создаем нового
    else {
      user = await prisma.user.create({
        data: {
          walletAddress,
          name: nickname,
        },
      });
    }

    // Возвращаем обновленные данные пользователя
    return NextResponse.json({
      walletAddress,
      nickname: user.name,
      updated: true,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 