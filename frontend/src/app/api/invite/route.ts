import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Schema for validating referral link generation request
const generateLinkSchema = z.object({
  walletAddress: z.string().min(1)
});

// Schema for validating referral processing request
const trackReferralSchema = z.object({
  walletAddress: z.string().min(1),
  referrerAddress: z.string().min(1)
});

// Schema for validating invite code processing
const trackInviteCodeSchema = z.object({
  walletAddress: z.string().min(1),
  inviteCode: z.string().length(6)
});

// Очки за приглашение
const REFERRAL_POINTS = {
  referrer: 10, // Приглашающий получает 10 очков
  invitee: 5    // Приглашенный получает 5 очков
};

// Function to generate a random 6-digit code
function generateRandomCode(): string {
  // Generate a random 6-digit number
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to check if a code is already in use
async function isCodeUnique(code: string): Promise<boolean> {
  // Используем where с кастом к Prisma.UserWhereInput
  const whereInput: Prisma.UserWhereInput = {
    inviteCode: code
  };
  
  const existingUser = await prisma.user.findFirst({
    where: whereInput
  });
  
  return !existingUser;
}

// Function to generate a unique 6-digit code
async function generateUniqueInviteCode(): Promise<string> {
  let isUnique = false;
  let code = '';
  
  // Keep generating codes until we find a unique one
  while (!isUnique) {
    code = generateRandomCode();
    isUnique = await isCodeUnique(code);
  }
  
  return code;
}

// GET /api/invite?walletAddress=<wallet_address>
// Checks if the user owns an NFT and exists in the database
export async function GET(request: NextRequest) {
  try {
    const walletAddress = request.nextUrl.searchParams.get('walletAddress');
    
    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address not specified' }, 
        { status: 400 }
      );
    }
    
    // Check NFT ownership (emulated - in a real application, this would be a blockchain query)
    const hasPurchasedNft = true;
    
    // Look for the user in the database
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        userReferrals: true,
      }
    });
    
    // If the user doesn't exist, create them
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          hasPurchasedNft,
          points: 0,
        },
        include: {
          userReferrals: true,
        }
      });
    }
    
    return NextResponse.json({
      canGenerateLink: hasPurchasedNft,
      referralCount: user.userReferrals.length,
      points: user.points,
      inviteCode: user.inviteCode || null,
    });
    
  } catch (error) {
    console.error('Error checking eligibility for referral link creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST /api/invite - Generate referral link/invite code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = generateLinkSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid data format' }, 
        { status: 400 }
      );
    }
    
    const { walletAddress } = validation.data;
    
    // Check NFT ownership (emulated - in a real application, this would be a blockchain query)
    const hasPurchasedNft = true;
    
    if (!hasPurchasedNft) {
      return NextResponse.json(
        { error: 'You must own an NFT to create a referral link' }, 
        { status: 403 }
      );
    }
    
    // Find or create the user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        userReferrals: true,
      }
    });
    
    // Generate a unique 6-digit invite code
    const inviteCode = await generateUniqueInviteCode();
    
    if (!user) {
      // Create user with invite code
      user = await prisma.user.create({
        data: {
          walletAddress,
          hasPurchasedNft,
          points: 0,
          inviteCode,
        },
        include: {
          userReferrals: true,
        }
      });
    } else {
      // If user exists but doesn't have an invite code yet, or we need to update it
      if (!user.inviteCode) {
        // Update user with invite code using cast to Prisma.UserUpdateInput
        const updateData: Prisma.UserUpdateInput = { 
          hasPurchasedNft,
          inviteCode,
        };
        
        await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
        
        // Fetch user again with updated data
        user = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            userReferrals: true,
          }
        }) as any;
      } else if (user.hasPurchasedNft !== hasPurchasedNft) {
        // Just update NFT ownership status if it changed
        await prisma.user.update({
          where: { id: user.id },
          data: { hasPurchasedNft },
        });
      }
    }
    
    // Make sure user is not null at this point
    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create or retrieve user' }, 
        { status: 500 }
      );
    }
    
    // Generate referral link using the invite code
    const host = request.headers.get('host') || 'pepesamurai.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const referralLink = `${protocol}://${host}/ref/${user.inviteCode}`;
    
    return NextResponse.json({
      referralLink,
      inviteCode: user.inviteCode,
      referralCount: user.userReferrals.length,
      points: user.points,
    });
    
  } catch (error) {
    console.error('Error generating referral link:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// PUT /api/invite - Register referral
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if we're processing a referral address or an invite code
    let referrerAddress: string;
    let validation;
    
    if (body.inviteCode) {
      // Processing using invite code
      validation = trackInviteCodeSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid data format' }, 
          { status: 400 }
        );
      }
      
      const { walletAddress, inviteCode } = validation.data;
      
      // Find the referrer by invite code using where with type cast
      const whereInput: Prisma.UserWhereInput = {
        inviteCode
      };
      
      const referrer = await prisma.user.findFirst({
        where: whereInput,
      });
      
      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid invite code' }, 
          { status: 404 }
        );
      }
      
      if (!referrer.walletAddress) {
        return NextResponse.json(
          { error: 'Inviting user has invalid wallet address' }, 
          { status: 400 }
        );
      }
      
      referrerAddress = referrer.walletAddress;
      
      // Check that user is not trying to invite themselves
      if (walletAddress === referrerAddress) {
        return NextResponse.json(
          { error: 'You cannot invite yourself' }, 
          { status: 400 }
        );
      }
    } else {
      // Processing using referrer address
      validation = trackReferralSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid data format' }, 
          { status: 400 }
        );
      }
      
      const { walletAddress, referrerAddress: refAddr } = validation.data;
      referrerAddress = refAddr;
      
      // Check that user is not trying to invite themselves
      if (walletAddress === referrerAddress) {
        return NextResponse.json(
          { error: 'You cannot invite yourself' }, 
          { status: 400 }
        );
      }
    }
    
    // At this point we have the walletAddress and referrerAddress, continue with common logic
    const walletAddress = body.walletAddress;
    
    // Check if the referrer (inviting user) exists
    const referrer = await prisma.user.findUnique({
      where: { walletAddress: referrerAddress },
    });
    
    if (!referrer) {
      return NextResponse.json(
        { error: 'Inviting user not found' }, 
        { status: 404 }
      );
    }
    
    // Check if referrer owns an NFT
    if (!referrer.hasPurchasedNft) {
      return NextResponse.json(
        { error: 'The inviting user does not have permission for the referral program' }, 
        { status: 403 }
      );
    }
    
    // Find or create the invited user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          hasPurchasedNft: false,
          points: 0,
          referredBy: referrerAddress,
        },
      });
    } else if (user.referredBy) {
      return NextResponse.json(
        { error: 'User has already been invited by another user' }, 
        { status: 400 }
      );
    } else {
      // Update information about the inviter
      await prisma.user.update({
        where: { id: user.id },
        data: { referredBy: referrerAddress },
      });
    }
    
    // Check if a referral record already exists
    const existingReferral = await prisma.userReferral.findFirst({
      where: {
        userId: referrer.id,
        referredAddress: walletAddress,
      },
    });
    
    if (existingReferral) {
      return NextResponse.json(
        { error: 'This user has already been invited' }, 
        { status: 400 }
      );
    }
    
    // Create referral record
    await prisma.userReferral.create({
      data: {
        userId: referrer.id,
        referredAddress: walletAddress,
      },
    });

    // Create referral log entry
    await prisma.referralLog.create({
      data: {
        referrerAddress,
        userAddress: walletAddress,
        pointsAwarded: REFERRAL_POINTS.referrer, // Referrer gets 10 points
        status: 'pending', // Status "pending" until NFT purchase
      },
    });

    // Award 5 points to the invited user
    await prisma.user.update({
      where: { id: user.id },
      data: { points: { increment: REFERRAL_POINTS.invitee } },
    });

    // Award 10 points to the referrer
    await prisma.user.update({
      where: { id: referrer.id },
      data: { points: { increment: REFERRAL_POINTS.referrer } },
    });
    
    // Update referrer statistics
    const updatedReferrer = await prisma.user.findUnique({
      where: { id: referrer.id },
      include: {
        userReferrals: true,
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Referral successfully registered',
      referralCount: updatedReferrer?.userReferrals.length || 0,
      referrerPoints: updatedReferrer?.points || 0,
      userPoints: user.points + 5,
    });
    
  } catch (error) {
    console.error('Error registering referral:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 