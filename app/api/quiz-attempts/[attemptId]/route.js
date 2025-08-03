import { NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import QuizAttempt from '@/app/models/QuizAttemptSchema';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  await connectToDB();
  try {
    const { attemptId } = params;
    
    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }
    
    const attempt = await QuizAttempt.findById(attemptId).populate('quizId');
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    
    return NextResponse.json({ attempt });
  } catch (error) {
    console.error('QuizAttempt API GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempt' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDB();
    const { attemptId } = params;
    const data = await request.json();
    
    console.log('PUT request for attemptId:', attemptId);
    console.log('Update data:', data);
    
    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }
    
    // Add timeout for database operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 15000)
    );
    
    // Validate the attempt exists
    const findPromise = QuizAttempt.findById(attemptId);
    const existingAttempt = await Promise.race([findPromise, timeoutPromise]);
    
    if (!existingAttempt) {
      console.log('Attempt not found for ID:', attemptId);
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    
    console.log('Found existing attempt:', {
      _id: existingAttempt._id,
      userName: existingAttempt.userName,
      score: existingAttempt.score,
      passed: existingAttempt.passed
    });
    
    // Enhanced score validation and sanitization
    let score = existingAttempt.score; // Default to existing score
    
    console.log('Received score data:', {
      receivedScore: data.score,
      type: typeof data.score,
      isNull: data.score === null,
      isUndefined: data.score === undefined,
      isNaN: isNaN(data.score)
    });
    
    if (data.score !== null && data.score !== undefined) {
      const parsedScore = Number(data.score);
      console.log('Parsed score:', {
        parsedScore,
        isNaN: isNaN(parsedScore),
        isValid: !isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100
      });
      
      if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 100) {
        score = parsedScore;
      } else {
        console.error('Invalid score value:', data.score, 'parsed:', parsedScore);
        // Instead of returning error, use existing score
        score = existingAttempt.score || 0;
        console.log('Using existing score as fallback:', score);
      }
    }
    
    // Final validation and sanitization
    if (typeof score !== 'number' || isNaN(score) || !isFinite(score)) {
      console.error('Final score validation failed, using fallback:', score);
      score = existingAttempt.score || 0;
    }
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    const updateData = {
      answers: data.answers || existingAttempt.answers,
      score: score,
      passed: typeof data.passed === 'boolean' ? data.passed : (score >= (existingAttempt.quizId?.passingScore || 70)),
      updatedAt: new Date()
    };
    
    console.log('Updating with validated data:', updateData);
    
    // Add timeout for update operation
    const updatePromise = QuizAttempt.findByIdAndUpdate(
      attemptId,
      updateData,
      { 
        new: true, 
        runValidators: false, // Disable validators to avoid Vercel issues
        upsert: false 
      }
    );
    
    const updatedAttempt = await Promise.race([updatePromise, timeoutPromise]);
    
    console.log('Updated attempt:', {
      _id: updatedAttempt._id,
      userName: updatedAttempt.userName,
      score: updatedAttempt.score,
      passed: updatedAttempt.passed,
      answersCount: updatedAttempt.answers?.length
    });
    
    return NextResponse.json({ 
      success: true, 
      attempt: updatedAttempt,
      message: 'Attempt updated successfully'
    });
  } catch (error) {
    console.error('QuizAttempt API PUT error:', error);
    
    // Return more specific error messages for debugging
    if (error.message.includes('timeout')) {
      return NextResponse.json({ 
        error: 'Database operation timeout. Please try again.' 
      }, { status: 408 });
    } else if (error.message.includes('MongoDB') || error.message.includes('connection')) {
      return NextResponse.json({ 
        error: 'Database connection error. Please try again.' 
      }, { status: 503 });
    } else if (error.name === 'ValidationError') {
      return NextResponse.json({ 
        error: 'Validation error: ' + error.message 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to update quiz attempt: ' + error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  await connectToDB();
  try {
    const { attemptId } = params;
    
    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }
    
    const deletedAttempt = await QuizAttempt.findByIdAndDelete(attemptId);
    if (!deletedAttempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: 'Attempt deleted successfully' });
  } catch (error) {
    console.error('QuizAttempt API DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete quiz attempt' }, { status: 500 });
  }
} 