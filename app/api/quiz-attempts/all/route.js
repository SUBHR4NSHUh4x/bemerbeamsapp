import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';

export async function GET(request) {
  await connectToDB();
  try {
    // Fetch all attempts with quiz data populated
    const attempts = await QuizAttempt.find({})
      .populate('quizId', 'quizTitle passingScore')
      .sort({ endTime: -1 });
    
    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('QuizAttempts All API GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
} 