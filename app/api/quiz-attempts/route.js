import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';
import mongoose from 'mongoose';

export async function GET(request) {
  await connectToDB();
  try {
    const { searchParams } = request.nextUrl;
    const quizId = searchParams.get('quizId');
    console.log('Fetching attempts for quizId:', quizId);
    
    if (!quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }
    
    // Convert quizId to ObjectId for query
    const attempts = await QuizAttempt.find({ quizId: new mongoose.Types.ObjectId(quizId) }).sort({ endTime: -1 });
    console.log('Found attempts:', attempts.length);
    
    return NextResponse.json({ attempts });
  } catch (error) {
    console.error('QuizAttempts API GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
}

export async function POST(request) {
  await connectToDB();
  try {
    const data = await request.json();
    console.log('Received attempt data:', data);
    
    // Validate required fields
    if (!data.quizId) {
      return NextResponse.json({ error: 'quizId is required' }, { status: 400 });
    }
    
    if (!data.userName) {
      return NextResponse.json({ error: 'userName is required' }, { status: 400 });
    }
    
    if (!data.answers || !Array.isArray(data.answers)) {
      return NextResponse.json({ error: 'answers array is required' }, { status: 400 });
    }
    
    console.log('Converting quizId to ObjectId:', data.quizId);
    data.quizId = new mongoose.Types.ObjectId(data.quizId);
    
    console.log('Creating quiz attempt with data:', data);
    const attempt = await QuizAttempt.create(data);
    console.log('Attempt saved successfully:', attempt._id);
    console.log('Full saved attempt:', attempt);
    
    return NextResponse.json({ success: true, attempt });
  } catch (error) {
    console.error('QuizAttempts API POST error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ 
        error: `Validation error: ${validationErrors.join(', ')}` 
      }, { status: 400 });
    }
    
    // Handle ObjectId errors
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return NextResponse.json({ 
        error: 'Invalid quiz ID format' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to save quiz attempt: ' + error.message 
    }, { status: 500 });
  }
}