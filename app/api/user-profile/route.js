import UserProfile from '@/app/models/UserProfileSchema';
import { connectToDB } from '@/libs/mongoDB';
import { NextResponse } from 'next/server';

export async function POST(request) {
  await connectToDB();

  try {
    const { clerkUserId, email, firstName, lastName, role = 'student' } = await request.json();
    
    // Check if user profile already exists
    const existingProfile = await UserProfile.findOne({ clerkUserId });
    
    if (existingProfile) {
      return NextResponse.json({
        message: 'User profile already exists',
        userProfile: existingProfile,
      });
    }

    // Create new user profile
    const newUserProfile = await UserProfile.create({
      clerkUserId,
      email,
      firstName,
      lastName,
      role,
    });

    return NextResponse.json({
      message: 'User profile created successfully',
      userProfile: newUserProfile,
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to create user profile' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  await connectToDB();

  try {
    const { searchParams } = new URL(request.url);
    const clerkUserId = searchParams.get('clerkUserId');

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'clerkUserId is required' },
        { status: 400 }
      );
    }

    const userProfile = await UserProfile.findOne({ clerkUserId });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  await connectToDB();

  try {
    const { searchParams } = new URL(request.url);
    const clerkUserId = searchParams.get('clerkUserId');
    const updateData = await request.json();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'clerkUserId is required' },
        { status: 400 }
      );
    }

    const userProfile = await UserProfile.findOneAndUpdate(
      { clerkUserId },
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'User profile updated successfully',
      userProfile,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
} 