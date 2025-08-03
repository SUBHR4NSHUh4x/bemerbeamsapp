import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';

export async function GET() {
  try {
    console.log('Testing Vercel deployment...');
    
    // Test database connection
    await connectToDB();
    console.log('Database connection successful');
    
    // Test a simple query
    const attemptCount = await QuizAttempt.countDocuments();
    console.log('Attempt count:', attemptCount);
    
    // Test creating a sample attempt (for testing purposes)
    const sampleAttempt = new QuizAttempt({
      quizId: new (await import('mongoose')).Types.ObjectId(),
      userId: 'test-user',
      userName: 'Test User',
      userEmail: 'test@example.com',
      storeName: 'Test Store',
      score: 85,
      passed: true,
      startTime: new Date(),
      endTime: new Date(),
      duration: 300,
      answers: [
        {
          questionText: 'Test Question',
          studentAnswer: 'Test Answer',
          correctAnswer: 'Test Answer',
          points: 10,
          isCorrect: true
        }
      ]
    });
    
    // Validate the attempt (this will test our schema)
    const validationError = sampleAttempt.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return NextResponse.json({
        status: 'validation_failed',
        error: validationError.message,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
    
    console.log('Sample attempt validation successful');
    
    return NextResponse.json({
      status: 'success',
      message: 'Vercel deployment test passed',
      database: 'connected',
      attemptCount,
      validation: 'passed',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
    
  } catch (error) {
    console.error('Vercel test failed:', error);
    
    return NextResponse.json({
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }, { status: 500 });
  }
} 