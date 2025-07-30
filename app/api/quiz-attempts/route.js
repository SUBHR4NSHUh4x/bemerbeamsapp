import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';
import mongoose from 'mongoose';

export async function GET(request) {
  await connectToDB();
  try {
    const { searchParams } = request.nextUrl;
    const quizId = searchParams.get('quizId');
    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }
    // Convert quizId to ObjectId for query
    const attempts = await QuizAttempt.find({ quizId: new mongoose.Types.ObjectId(quizId) }).sort({ endTime: -1 });
    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('QuizAttempts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
}

export async function POST(request) {
  await connectToDB();
  try {
    const data = await request.json();
    data.quizId = new mongoose.Types.ObjectId(data.quizId);
    const attempt = await QuizAttempt.create(data);
    return NextResponse.json({ success: true, attempt });
  } catch (error) {
    console.error('QuizAttempts API POST error:', error);
    return NextResponse.json({ error: 'Failed to save quiz attempt' }, { status: 500 });
  }
}