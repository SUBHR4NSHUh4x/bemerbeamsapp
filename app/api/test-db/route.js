import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';
import Quiz from '@/app/models/QuizSchema';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectToDB();
    
    console.log('Testing database connection...');
    
    // Check if we can connect to the database
    const dbName = mongoose.connection.db.databaseName;
    console.log('Connected to database:', dbName);
    
    // Count total attempts
    const attemptsCount = await QuizAttempt.countDocuments({});
    console.log('Total attempts in database:', attemptsCount);
    
    // Get a sample attempt
    const sampleAttempt = await QuizAttempt.findOne({});
    console.log('Sample attempt:', sampleAttempt);
    
    // Count total quizzes
    const quizzesCount = await Quiz.countDocuments({});
    console.log('Total quizzes in database:', quizzesCount);
    
    // Get a sample quiz
    const sampleQuiz = await Quiz.findOne({});
    console.log('Sample quiz:', sampleQuiz);
    
    return NextResponse.json({
      success: true,
      dbName,
      attemptsCount,
      quizzesCount,
      sampleAttempt: sampleAttempt ? {
        _id: sampleAttempt._id,
        userName: sampleAttempt.userName,
        score: sampleAttempt.score,
        quizId: sampleAttempt.quizId
      } : null,
      sampleQuiz: sampleQuiz ? {
        _id: sampleQuiz._id,
        quizTitle: sampleQuiz.quizTitle
      } : null
    });
  } catch (error) {
    console.error('Test DB API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 