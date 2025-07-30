import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/libs/mongoDB';
import Quiz from '@/app/models/QuizSchema';
import * as XLSX from 'xlsx';

export async function POST(request) {
  await connectToDB();

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const quizId = formData.get('quizId');
    const quizTitle = formData.get('quizTitle');
    const category = formData.get('category') || 'General';
    const difficulty = formData.get('difficulty') || 'medium';
    const createdBy = formData.get('createdBy');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate quizTitle for new quizzes
    if (!quizId && (!quizTitle || quizTitle.trim() === '')) {
      return NextResponse.json(
        { error: 'Quiz title is required for new quizzes' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel/CSV file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        { error: 'No data found in file' },
        { status: 400 }
      );
    }

    // Validate and transform data
    const questions = [];
    const errors = [];

    data.forEach((row, index) => {
      try {
        // Expected columns: Question, Type, Choices, CorrectAnswer, Explanation, Points, TimeLimit
        const question = {
          type: row.Type?.toLowerCase() || 'mcq',
          question: row.Question?.trim(),
          correctAnswer: row.CorrectAnswer?.toString().trim(),
          explanation: row.Explanation?.trim() || '',
          points: parseInt(row.Points) || 1,
          timeLimit: parseInt(row.TimeLimit) || 30,
          choices: [],
          answeredResult: -1,
          statistics: {
            totalAttempts: 0,
            correctAttempts: 0,
            incorrectAttempts: 0,
          },
        };

        // Validate required fields
        if (!question.question) {
          errors.push(`Row ${index + 1}: Question is required`);
          return;
        }

        if (!question.correctAnswer) {
          errors.push(`Row ${index + 1}: Correct answer is required`);
          return;
        }

        // Handle different question types
        if (question.type === 'mcq') {
          // Parse choices (comma-separated or multiple columns)
          const choicesText = row.Choices || '';
          const choices = choicesText.split(',').map(choice => choice.trim()).filter(Boolean);
          
          if (choices.length < 2) {
            errors.push(`Row ${index + 1}: MCQ questions need at least 2 choices`);
            return;
          }

          question.choices = choices.map(choice => ({
            text: choice,
            isCorrect: choice === question.correctAnswer,
          }));
        } else if (question.type === 'true_false') {
          question.choices = [
            { text: 'True', isCorrect: question.correctAnswer.toLowerCase() === 'true' },
            { text: 'False', isCorrect: question.correctAnswer.toLowerCase() === 'false' },
          ];
        } else if (question.type === 'fill_blank') {
          // For fill in the blank, correct answer is the expected text
          question.choices = [];
        } else if (question.type === 'text') {
          // For text questions, correct answer is the expected response
          question.choices = [];
        }

        questions.push(question);
      } catch (error) {
        errors.push(`Row ${index + 1}: ${error.message}`);
      }
    });

    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation errors found',
          details: errors,
          validQuestions: questions.length 
        },
        { status: 400 }
      );
    }

    // Create or update quiz
    let quiz;
    if (quizId) {
      // Update existing quiz
      quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }
      quiz.quizQuestions = [...quiz.quizQuestions, ...questions];
    } else {
      // Create new quiz
      quiz = new Quiz({
        quizTitle,
        category,
        difficulty,
        createdBy,
        icon: 'fas fa-question',
        quizQuestions: questions,
        tags: [category],
      });
    }

    await quiz.save();

    return NextResponse.json({
      message: 'Questions uploaded successfully',
      quizId: quiz._id,
      totalQuestions: quiz.quizQuestions.length,
      uploadedQuestions: questions.length,
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Bulk upload endpoint',
    instructions: 'Upload Excel/CSV file with columns: Question, Type, Choices, CorrectAnswer, Explanation, Points, TimeLimit',
    supportedFormats: ['xlsx', 'xls', 'csv'],
  });
} 