import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';
import Quiz from '@/app/models/QuizSchema';

export async function GET(request) {
  await connectToDB();
  try {
    console.log('QuizAttempts All API called');
    
    // Fetch all attempts with quiz data populated, sorted by most recent first
    const attempts = await QuizAttempt.find({})
      .populate('quizId', 'quizTitle passingScore')
      .sort({ endTime: -1, createdAt: -1, _id: -1 })
      .lean(); // Use lean() for better performance
    
    console.log('Found attempts:', attempts.length);
    
    // Log details about each attempt's quiz data (limit to first 5 for performance)
    attempts.slice(0, 5).forEach((attempt, index) => {
      console.log(`Attempt ${index + 1}:`, {
        _id: attempt._id,
        userName: attempt.userName,
        quizId: attempt.quizId,
        quizTitle: attempt.quizId?.quizTitle || 'No quiz title',
        hasQuizData: !!attempt.quizId,
        endTime: attempt.endTime,
        createdAt: attempt.createdAt,
        answersCount: attempt.answers?.length || 0,
        hasAnswers: !!attempt.answers && attempt.answers.length > 0
      });
    });
    
    // Log a sample attempt with answers
    if (attempts.length > 0) {
      const sampleAttempt = attempts[0];
      console.log('Sample attempt with answers:', {
        _id: sampleAttempt._id,
        userName: sampleAttempt.userName,
        answers: sampleAttempt.answers,
        answersLength: sampleAttempt.answers?.length
      });
    }
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json({ attempts });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('QuizAttempts All API GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
} 