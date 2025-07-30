import User from '@/app/models/UserSchema';

import { connectToDB } from '@/libs/mongoDB';
import { NextResponse } from 'next/server';

export async function POST(request) {
  await connectToDB();

  try {
    // Count the number of documents in the User collection
    const countUsers = await User.countDocuments();

    if (countUsers > 0) {
      // If at least one user exists, find the first user
      const findUser = await User.findOne();

      // Return the first user to the client
      return NextResponse.json({
        message: 'User already exists',
        user: findUser,
      });
    }

    const { name, isLogged } = await request.json();
    const newUser = await User.create({ name, isLogged });
    return NextResponse.json({
      user: newUser,
    });
  } catch (error) {
    return NextResponse.json({ message: error });
  }
}

export async function PUT(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    let userUpdate = await User.findById(id);

    const { updateUser } = await request.json();
    userUpdate.isLogged = updateUser.isLogged;

    await userUpdate.save();
    return NextResponse.json({ message: 'user saved' });
  } catch (error) {
    console.log(error);
  }
}
