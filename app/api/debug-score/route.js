import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('Request body parse error:', parseError);
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
    }
    
    console.log('Debug score calculation request:', requestBody);
    
    const { answers } = requestBody;
    
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ 
        error: 'Invalid answers format',
        received: answers 
      }, { status: 400 });
    }
    
    let totalPoints = 0;
    let earnedPoints = 0;
    
    answers.forEach((answer, index) => {
      // Validate answer structure
      if (typeof answer !== 'object') {
        console.warn('Invalid answer format:', answer);
        return; // Skip this answer
      }
      
      // Parse points with validation
      let points = 0;
      if (answer.points !== undefined) {
        if (typeof answer.points === 'number') {
          points = answer.points;
        } else if (typeof answer.points === 'string') {
          try {
            points = parseFloat(answer.points);
            if (isNaN(points)) points = 0;
          } catch (e) {
            points = 0;
          }
        }
      }
      
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
    
    // Set cache control headers to prevent caching
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Debug score calculation error:', error);
    return NextResponse.json({ 
      error: 'Debug calculation failed',
      message: error.message 
    }, { status: 500 });
  }
}