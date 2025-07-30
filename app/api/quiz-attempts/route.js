import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';

export async function GET(request) {
  await connectToDB();
  try {
    const { searchParams } = request.nextUrl;
    const quizId = searchParams.get('quizId');
    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }
    const attempts = await QuizAttempt.find({ quizId }).sort({ endTime: -1 });
    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('QuizAttempts API error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
}