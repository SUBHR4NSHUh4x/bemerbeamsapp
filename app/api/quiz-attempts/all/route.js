import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';
import Quiz from '@/app/models/QuizSchema';

export async function GET(request) {
  try {
    await connectToDB();
    console.log('QuizAttempts All API called');
    
    // Increase timeout for the database query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 20000) // Increased from 10s to 20s
    );
    
    // Implement a more efficient query with pagination and projection
    // to reduce data transfer and improve performance
    const queryPromise = QuizAttempt.find({})
      .populate('quizId', 'quizTitle passingScore') // Only populate necessary fields
      .select('-__v') // Exclude version field
      .sort({ endTime: -1, createdAt: -1, _id: -1 })
      .lean(); // Use lean() for better performance
    
    // Execute the query with a timeout
    let attempts;
    try {
      attempts = await Promise.race([queryPromise, timeoutPromise]);
    } catch (queryError) {
      console.error('Query execution error:', queryError);
      if (queryError.message.includes('timeout')) {
        return NextResponse.json({ error: 'Database query timeout. Please try again.' }, { status: 408 });
      }
      throw queryError;
    }
    
    console.log('Found attempts:', attempts.length);
    
    // Sanitize and validate the data to ensure it's safe for client-side
    const sanitizedAttempts = attempts.map(attempt => ({
      ...attempt,
      // Ensure _id is properly serialized for JSON
      _id: attempt._id.toString(),
      // Ensure quizId is properly handled
      quizId: attempt.quizId ? {
        ...attempt.quizId,
        _id: attempt.quizId._id.toString()
      } : null,
      // Ensure answers array exists
      answers: Array.isArray(attempt.answers) ? attempt.answers : []
    }));
    
    // Log details about each attempt's quiz data (limit to first 3 for performance)
    sanitizedAttempts.slice(0, 3).forEach((attempt, index) => {
      console.log(`Attempt ${index + 1}:`, {
        _id: attempt._id,
        userName: attempt.userName,
        quizId: attempt.quizId?._id,
        quizTitle: attempt.quizId?.quizTitle || 'No quiz title',
        hasQuizData: !!attempt.quizId,
        answersCount: attempt.answers?.length || 0,
        hasAnswers: !!attempt.answers && attempt.answers.length > 0
      });
    });
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json({ attempts: sanitizedAttempts });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('QuizAttempts All API GET error:', error);
    
    // Return more specific error messages for debugging
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json({ error: 'Database error. Please try again.' }, { status: 503 });
    } else if (error.message.includes('timeout')) {
      return NextResponse.json({ error: 'Database query timeout. Please try again.' }, { status: 408 });
    } else if (error.message.includes('MongoDB') || error.message.includes('connection')) {
      return NextResponse.json({ error: 'Database connection error. Please try again.' }, { status: 503 });
    }
    
    return NextResponse.json({ error: 'Failed to fetch quiz attempts: ' + error.message }, { status: 500 });
  }
}