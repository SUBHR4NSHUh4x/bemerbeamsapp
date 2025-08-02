import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';

export async function GET(request) {
  await connectToDB();
  try {
    console.log('QuizAttempts All API called');
    
    // Fetch all attempts with quiz data populated
    const attempts = await QuizAttempt.find({})
      .populate('quizId', 'quizTitle passingScore')
      .sort({ endTime: -1 });
    
    console.log('Found attempts:', attempts.length);
    console.log('Attempts data:', attempts);
    
    // Log details about each attempt's quiz data
    attempts.forEach((attempt, index) => {
      console.log(`Attempt ${index + 1}:`, {
        _id: attempt._id,
        userName: attempt.userName,
        quizId: attempt.quizId,
        quizTitle: attempt.quizId?.quizTitle || 'No quiz title',
        hasQuizData: !!attempt.quizId
      });
    });
    
    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('QuizAttempts All API GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
} 