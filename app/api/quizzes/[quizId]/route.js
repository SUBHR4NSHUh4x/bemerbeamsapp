import Quiz from '@/app/models/QuizSchema';
import { connectToDB } from '@/libs/mongoDB';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    await connectToDB();
    const { quizId } = params;
    
    if (!quizId) {
      return NextResponse.json(
        { error: 'Quiz ID is required' },
        { status: 400 }
      );
    }
    
    // Add timeout for the database query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 20000)
    );
    
    // Execute the query with a timeout
    let quiz;
    try {
      const queryPromise = Quiz.findById(quizId).lean();
      quiz = await Promise.race([queryPromise, timeoutPromise]);
    } catch (queryError) {
      console.error('Query execution error:', queryError);
      if (queryError.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Database query timeout. Please try again.' },
          { status: 408 }
        );
      }
      throw queryError;
    }
    
    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }
    
    // Sanitize and validate the data
    const sanitizedQuiz = {
      ...quiz,
      _id: quiz._id.toString()
    };
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json(sanitizedQuiz);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error fetching quiz:', error);
    
    if (error.message.includes('timeout')) {
      return NextResponse.json(
        { error: 'Database query timeout. Please try again.' },
        { status: 408 }
      );
    } else if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json(
        { error: 'Database error. Please try again.' },
        { status: 503 }
      );
    } else if (error.message.includes('MongoDB') || error.message.includes('connection')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again.' },
        { status: 503 }
      );
    } else if (error.name === 'CastError') {
      return NextResponse.json(
        { error: 'Invalid quiz ID format' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch quiz: ' + error.message },
      { status: 500 }
    );
  }
}