// Test script for score calculation
// Run this to verify the logic works correctly

function testScoreCalculation() {
  console.log('Testing score calculation logic...\n');
  
  // Test case 1: Normal case
  const testCase1 = [
    { points: 10, isCorrect: true },
    { points: 10, isCorrect: false },
    { points: 10, isCorrect: true }
  ];
  
  let totalPoints = 0;
  let earnedPoints = 0;
  
  testCase1.forEach((answer, index) => {
    const points = Number(answer.points) || 0;
    const isCorrect = Boolean(answer.isCorrect);
    
    console.log(`Answer ${index + 1}:`, { points, isCorrect });
    
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
  
  console.log('\nTest Case 1 Results:');
  console.log('Total Points:', totalPoints);
  console.log('Earned Points:', earnedPoints);
  console.log('Score:', score);
  console.log('Score Type:', typeof score);
  console.log('Is NaN:', isNaN(score));
  console.log('Is Valid:', typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 100);
  
  // Test case 2: Edge case with zero points
  console.log('\n---\nTest Case 2: Zero points');
  const testCase2 = [
    { points: 0, isCorrect: true },
    { points: 0, isCorrect: false }
  ];
  
  totalPoints = 0;
  earnedPoints = 0;
  
  testCase2.forEach((answer, index) => {
    const points = Number(answer.points) || 0;
    const isCorrect = Boolean(answer.isCorrect);
    
    console.log(`Answer ${index + 1}:`, { points, isCorrect });
    
    totalPoints += points;
    if (isCorrect) {
      earnedPoints += points;
    }
  });
  
  score = 0;
  if (totalPoints > 0) {
    score = Math.round((earnedPoints / totalPoints) * 100);
  }
  
  score = Math.max(0, Math.min(100, score));
  
  console.log('\nTest Case 2 Results:');
  console.log('Total Points:', totalPoints);
  console.log('Earned Points:', earnedPoints);
  console.log('Score:', score);
  console.log('Score Type:', typeof score);
  console.log('Is NaN:', isNaN(score));
  console.log('Is Valid:', typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 100);
  
  // Test case 3: Invalid data
  console.log('\n---\nTest Case 3: Invalid data');
  const testCase3 = [
    { points: 'invalid', isCorrect: true },
    { points: null, isCorrect: false },
    { points: undefined, isCorrect: true }
  ];
  
  totalPoints = 0;
  earnedPoints = 0;
  
  testCase3.forEach((answer, index) => {
    const points = Number(answer.points) || 0;
    const isCorrect = Boolean(answer.isCorrect);
    
    console.log(`Answer ${index + 1}:`, { originalPoints: answer.points, points, isCorrect });
    
    totalPoints += points;
    if (isCorrect) {
      earnedPoints += points;
    }
  });
  
  score = 0;
  if (totalPoints > 0) {
    score = Math.round((earnedPoints / totalPoints) * 100);
  }
  
  score = Math.max(0, Math.min(100, score));
  
  console.log('\nTest Case 3 Results:');
  console.log('Total Points:', totalPoints);
  console.log('Earned Points:', earnedPoints);
  console.log('Score:', score);
  console.log('Score Type:', typeof score);
  console.log('Is NaN:', isNaN(score));
  console.log('Is Valid:', typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 100);
}

// Run the test
testScoreCalculation(); 