import Quiz from '@/app/models/QuizSchema';
import { connectToDB } from '@/libs/mongoDB';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Connect to MongoDB with better error handling
    await connectToDB();
    
    const body = await request.json();
    
    // Extract user ID from request body or use a default
    const createdBy = body.createdBy || 'default-user';
    
    // Validate required fields
    if (!body.quizTitle || body.quizTitle.trim() === '') {
      return NextResponse.json({ 
        message: 'Test title is required' 
      }, { status: 400 });
    }

    if (!body.quizQuestions || body.quizQuestions.length === 0) {
      return NextResponse.json({ 
        message: 'At least one question is required' 
      }, { status: 400 });
    }

    if (!body.icon) {
      return NextResponse.json({ 
        message: 'Test icon is required' 
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
    
    console.log('Creating test with data:', { ...quizData, icon: iconString, createdBy });
    
    const newQuiz = await Quiz.create({
      ...quizData,
      icon: iconString,
      createdBy,
    });

    console.log('Test created successfully:', newQuiz._id);

    return NextResponse.json({
      id: newQuiz._id,
      message: 'The test has been created successfully.',
    });
  } catch (error) {
    console.error('Error creating test:', error);
    
    // Handle MongoDB connection errors
    if (error.message.includes('MongoDB connection string')) {
      return NextResponse.json({ 
        message: 'Database connection error. Please check your environment variables.' 
      }, { status: 500 });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json({ 
        message: `Validation error: ${validationErrors.join(', ')}` 
      }, { status: 400 });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json({ 
        message: 'A test with this title already exists. Please choose a different title.' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: error.message || 'Failed to create test. Please try again.' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDB();
    console.log('Quizzes GET API called');
    
    // Add timeout for the database query
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database query timeout')), 20000)
    );
    
    // Implement a more efficient query with projection
    const queryPromise = Quiz.find({})
      .select('-__v') // Exclude version field
      .sort({ createdAt: -1, _id: -1 })
      .lean(); // Use lean() for better performance
    
    // Execute the query with a timeout
    let quizzes;
    try {
      quizzes = await Promise.race([queryPromise, timeoutPromise]);
    } catch (queryError) {
      console.error('Query execution error:', queryError);
      if (queryError.message.includes('timeout')) {
        return NextResponse.json({ 
          message: 'Database query timeout. Please try again.' 
        }, { status: 408 });
      }
      throw queryError;
    }
    
    console.log('Found quizzes:', quizzes.length);
    
    // Sanitize and validate the data to ensure it's safe for client-side
    const sanitizedQuizzes = quizzes.map(quiz => ({
      ...quiz,
      // Ensure _id is properly serialized for JSON
      _id: quiz._id.toString()
    }));
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json({ quizzes: sanitizedQuizzes });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching tests:', error);
    
    if (error.message.includes('timeout')) {
      return NextResponse.json({ 
        message: 'Database query timeout. Please try again.' 
      }, { status: 408 });
    } else if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json({ 
        message: 'Database error. Please try again.' 
      }, { status: 503 });
    } else if (error.message.includes('MongoDB') || error.message.includes('connection')) {
      return NextResponse.json({ 
        message: 'Database connection error. Please try again.' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ 
      message: 'Failed to fetch tests: ' + error.message 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDB();
    const id = request.nextUrl.searchParams.get('id');
    const body = await request.json();
    
    const quizToUpdate = await Quiz.findById(id);
    if (!quizToUpdate) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
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
    return NextResponse.json({ message: 'Test updated successfully' });
  } catch (error) {
    console.error('Error updating test:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to update test' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDB();
    const id = request.nextUrl.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ 
        message: 'Quiz ID is required' 
      }, { status: 400 });
    }
    
    // Add timeout for the database operation
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 20000)
    );
    
    // Delete the quiz with error handling
    let deletedQuiz;
    try {
      const deletePromise = Quiz.findByIdAndDelete(id);
      deletedQuiz = await Promise.race([deletePromise, timeoutPromise]);
    } catch (deleteError) {
      console.error('Delete quiz error:', deleteError);
      if (deleteError.message.includes('timeout')) {
        return NextResponse.json({ 
          message: 'Database delete timeout. Please try again.' 
        }, { status: 408 });
      }
      throw deleteError;
    }
    
    if (!deletedQuiz) {
      return NextResponse.json({ 
        message: 'Test not found' 
      }, { status: 404 });
    }
    
    console.log('Deleted quiz:', {
      _id: deletedQuiz._id,
      quizTitle: deletedQuiz.quizTitle
    });
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json({ message: 'Test deleted successfully' });
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error deleting test:', error);
    
    if (error.message.includes('timeout')) {
      return NextResponse.json({ 
        message: 'Database operation timeout. Please try again.' 
      }, { status: 408 });
    } else if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return NextResponse.json({ 
        message: 'Database error. Please try again.' 
      }, { status: 503 });
    } else if (error.message.includes('MongoDB') || error.message.includes('connection')) {
      return NextResponse.json({ 
        message: 'Database connection error. Please try again.' 
      }, { status: 503 });
    } else if (error.name === 'CastError') {
      return NextResponse.json({ 
        message: 'Invalid ID format' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      message: 'Failed to delete test: ' + error.message 
    }, { status: 500 });
  }
}
