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
  await connectToDB();
  try {
    const { attemptId } = params;
    const data = await request.json();
    
    console.log('PUT request for attemptId:', attemptId);
    console.log('Update data:', data);
    
    if (!attemptId) {
      return NextResponse.json({ error: 'attemptId is required' }, { status: 400 });
    }
    
    // Validate the attempt exists
    const existingAttempt = await QuizAttempt.findById(attemptId);
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
    
    // Update the attempt with new data
    const updateData = {
      answers: data.answers,
      score: data.score,
      passed: data.passed,
      updatedAt: new Date()
    };
    
    console.log('Updating with data:', updateData);
    
    const updatedAttempt = await QuizAttempt.findByIdAndUpdate(
      attemptId,
      updateData,
      { new: true, runValidators: true }
    );
    
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