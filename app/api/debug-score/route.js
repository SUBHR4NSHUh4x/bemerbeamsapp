import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    
    console.log('Debug score calculation request:', data);
    
    // Simulate the same score calculation logic
    const { answers } = data;
    
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ 
        error: 'Invalid answers data',
        received: answers 
      }, { status: 400 });
    }
    
    let totalPoints = 0;
    let earnedPoints = 0;
    
    answers.forEach((answer, index) => {
      const points = Number(answer.points) || 0;
      const isCorrect = Boolean(answer.isCorrect);
      
      totalPoints += points;
      if (isCorrect) {
        earnedPoints += points;
      }
    });
    
    let score = 0;
    if (totalPoints > 0) {
      score = Math.round((earnedPoints / totalPoints) * 100);
    }
    
    score = Math.max(0, Math.min(100, score));
    
    const result = {
      totalPoints,
      earnedPoints,
      score,
      scoreType: typeof score,
      isNaN: isNaN(score),
      isValid: typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 100,
      answers: answers.map((answer, index) => ({
        index,
        points: Number(answer.points) || 0,
        isCorrect: Boolean(answer.isCorrect),
        studentAnswer: answer.studentAnswer
      }))
    };
    
    console.log('Debug score calculation result:', result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Debug score calculation error:', error);
    return NextResponse.json({ 
      error: 'Debug calculation failed',
      message: error.message 
    }, { status: 500 });
  }
} 