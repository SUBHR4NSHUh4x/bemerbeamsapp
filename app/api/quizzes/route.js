import Quiz from '@/app/models/QuizSchema';
import { connectToDB } from '@/libs/mongoDB';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();
    
    // Extract user ID from request body or use a default
    const createdBy = body.createdBy || 'default-user';
    
    // Remove any _id field if present to avoid ObjectId casting issues
    const { _id, ...quizData } = body;
    
    const newQuiz = await Quiz.create({
      ...quizData,
      createdBy,
    });

    return NextResponse.json({
      id: newQuiz._id,
      message: 'The quiz has been created successfully.',
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET() {
  await connectToDB();
  const quizzes = await Quiz.find();
  try {
    return NextResponse.json({ quizzes });
  } catch (error) {
    return NextResponse.json({ message: error });
  }
}

export async function PUT(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const body = await request.json();
    
    const quizToUpdate = await Quiz.findById(id);
    if (!quizToUpdate) {
      return NextResponse.json({ message: 'Quiz not found' }, { status: 404 });
    }

    // Update quiz properties
    Object.keys(body).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        quizToUpdate[key] = body[key];
      }
    });

    await quizToUpdate.save();
    return NextResponse.json({ message: 'Quiz updated successfully' });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const id = request.nextUrl.searchParams.get('id');
  await connectToDB();
  await Quiz.findByIdAndDelete(id);
  return NextResponse.json({ message: 'quiz deleted' });
}
