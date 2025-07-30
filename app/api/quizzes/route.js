import Quiz from '@/app/models/QuizSchema';
import { connectToDB } from '@/libs/mongoDB';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectToDB();
    const body = await request.json();
    
    // Extract user ID from request body or use a default
    const createdBy = body.createdBy || 'default-user';
    
    // Validate required fields
    if (!body.quizTitle || body.quizTitle.trim() === '') {
      return NextResponse.json({ 
        message: 'Quiz title is required' 
      }, { status: 400 });
    }

    if (!body.quizQuestions || body.quizQuestions.length === 0) {
      return NextResponse.json({ 
        message: 'At least one question is required' 
      }, { status: 400 });
    }

    if (!body.icon) {
      return NextResponse.json({ 
        message: 'Quiz icon is required' 
      }, { status: 400 });
    }
    
    // Remove any _id field if present to avoid ObjectId casting issues
    const { _id, ...quizData } = body;
    
    // Ensure icon is a string
    let iconString = body.icon;
    if (typeof body.icon === 'object') {
      // If icon is an object, try to extract iconName or use default
      if (body.icon.iconName) {
        iconString = `fa${body.icon.iconName.charAt(0).toUpperCase() + body.icon.iconName.slice(1)}`;
      } else {
        iconString = 'faQuestion'; // Default fallback
      }
    }
    
    console.log('Creating quiz with data:', { ...quizData, icon: iconString, createdBy });
    
    const newQuiz = await Quiz.create({
      ...quizData,
      icon: iconString,
      createdBy,
    });

    console.log('Quiz created successfully:', newQuiz._id);

    return NextResponse.json({
      id: newQuiz._id,
      message: 'The quiz has been created successfully.',
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ 
        message: `Validation error: ${validationErrors.join(', ')}` 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: error.message || 'Failed to create quiz' 
    }, { status: 500 });
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

    // Ensure icon is a string if it's being updated
    if (body.icon && typeof body.icon === 'object') {
      if (body.icon.iconName) {
        body.icon = `fa${body.icon.iconName.charAt(0).toUpperCase() + body.icon.iconName.slice(1)}`;
      } else {
        body.icon = 'faQuestion'; // Default fallback
      }
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
