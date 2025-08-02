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

    // Validate createdBy
    if (!createdBy) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel/CSV file with error handling
    let workbook, data;
    try {
      workbook = XLSX.read(buffer, { 
        type: 'buffer',
        cellDates: true,
        cellNF: false,
        cellText: false
      });
      
      if (workbook.SheetNames.length === 0) {
        return NextResponse.json(
          { error: 'No sheets found in the file' },
          { status: 400 }
        );
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      data = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      });

      // Remove empty rows
      data = data.filter(row => row.some(cell => cell !== ''));

      if (data.length === 0) {
        return NextResponse.json(
          { error: 'No data found in file' },
          { status: 400 }
        );
      }

      // Check if first row contains headers
      const firstRow = data[0];
      const hasHeaders = firstRow.some(cell => 
        typeof cell === 'string' && 
        ['question', 'type', 'choices', 'correctanswer', 'explanation', 'points', 'timelimit'].includes(cell.toLowerCase())
      );

      if (hasHeaders) {
        // Convert to objects with headers
        const headers = data[0];
        data = data.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
      } else {
        // Assume first row is data and use default column order
        data = data.map(row => ({
          Question: row[0] || '',
          Type: row[1] || 'mcq',
          Choices: row[2] || '',
          CorrectAnswer: row[3] || '',
          Explanation: row[4] || '',
          Points: row[5] || '1',
          TimeLimit: row[6] || '30'
        }));
      }

    } catch (parseError) {
      console.error('File parsing error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse file. Please ensure it\'s a valid Excel or CSV file.' },
        { status: 400 }
      );
    }

    // Validate and transform data
    const questions = [];
    const errors = [];
    const warnings = [];

    data.forEach((row, index) => {
      try {
        // Normalize column names (case-insensitive)
        const normalizedRow = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
          normalizedRow[normalizedKey] = row[key];
        });

        // Expected columns: Question, Type, Choices, CorrectAnswer, Explanation, Points, TimeLimit
        const question = {
          type: (normalizedRow.type || normalizedRow.questiontype || 'mcq').toLowerCase(),
          question: (normalizedRow.question || '').toString().trim(),
          correctAnswer: (normalizedRow.correctanswer || normalizedRow.correct || '').toString().trim(),
          explanation: (normalizedRow.explanation || '').toString().trim(),
          points: parseInt(normalizedRow.points || '1') || 1,
          timeLimit: parseInt(normalizedRow.timelimit || normalizedRow.timelimit || '30') || 30,
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

        // Validate question type
        const validTypes = ['mcq', 'multiplechoice', 'true_false', 'truefalse', 'text', 'fill_blank', 'fillblank'];
        if (!validTypes.includes(question.type)) {
          warnings.push(`Row ${index + 1}: Invalid question type "${question.type}", defaulting to MCQ`);
          question.type = 'mcq';
        }

        // Normalize question type
        if (question.type === 'multiplechoice') question.type = 'mcq';
        if (question.type === 'truefalse') question.type = 'true_false';
        if (question.type === 'fillblank') question.type = 'fill_blank';

        // Handle different question types
        if (question.type === 'mcq') {
          // Parse choices (pipe-separated or comma-separated for backward compatibility)
          const choicesText = normalizedRow.choices || '';
          let choices = [];
          
          // Try pipe separator first (new format), then comma (old format)
          if (choicesText.includes('|')) {
            choices = choicesText.split('|').map(choice => choice.trim()).filter(Boolean);
          } else {
            choices = choicesText.split(',').map(choice => choice.trim()).filter(Boolean);
          }
          
          if (choices.length < 2) {
            errors.push(`Row ${index + 1}: MCQ questions need at least 2 choices`);
            return;
          }

          question.choices = choices.map(choice => ({
            text: choice,
            isCorrect: choice.toLowerCase() === question.correctAnswer.toLowerCase(),
          }));

          // Validate that correct answer matches one of the choices
          const correctChoiceExists = question.choices.some(choice => 
            choice.text.toLowerCase() === question.correctAnswer.toLowerCase()
          );
          
          if (!correctChoiceExists) {
            errors.push(`Row ${index + 1}: Correct answer "${question.correctAnswer}" must match one of the choices`);
            return;
          }
        } else if (question.type === 'true_false') {
          const correctAnswer = question.correctAnswer.toLowerCase();
          if (!['true', 'false'].includes(correctAnswer)) {
            errors.push(`Row ${index + 1}: True/False questions must have "True" or "False" as correct answer`);
            return;
          }

          question.choices = [
            { text: 'True', isCorrect: correctAnswer === 'true' },
            { text: 'False', isCorrect: correctAnswer === 'false' },
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
          warnings: warnings,
          validQuestions: questions.length 
        },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No valid questions found in the file' },
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
        icon: 'faQuestion',
        quizQuestions: questions,
        tags: [category],
        timeLimit: 30,
        passingScore: 70,
        isActive: true,
        isPublic: true,
      });
    }

    await quiz.save();

    return NextResponse.json({
      message: 'Questions uploaded successfully',
      quizId: quiz._id,
      quizTitle: quiz.quizTitle,
      totalQuestions: quiz.quizQuestions.length,
      uploadedQuestions: questions.length,
      warnings: warnings.length > 0 ? warnings : undefined,
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file. Please check the file format and try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Bulk upload endpoint',
    instructions: 'Upload Excel/CSV file with columns: Question, Type, Choices, CorrectAnswer, Explanation, Points, TimeLimit',
    supportedFormats: ['xlsx', 'xls', 'csv'],
    format: {
      question: 'Required - The question text',
      type: 'Required - mcq, true_false, text, fill_blank (default: mcq)',
      choices: 'For MCQ: use | to separate choices (e.g., "Choice A|Choice B|Choice C")',
      correctAnswer: 'Required - Must match one of the choices for MCQ',
      explanation: 'Optional - Explanation for the answer',
      points: 'Optional - Points for this question (default: 1)',
      timeLimit: 'Optional - Time limit in seconds (default: 30)'
    }
  });
} 