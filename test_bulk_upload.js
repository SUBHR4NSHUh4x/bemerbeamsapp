// Test file for improved bulk upload functionality
// This file demonstrates the new Excel format with pipe-separated choices

const testQuestions = [
  {
    Question: 'What is the capital of France?',
    Type: 'mcq',
    Choices: 'Paris|London|Berlin|Madrid',
    CorrectAnswer: 'Paris',
    Explanation: 'Paris is the capital and largest city of France, known for its rich history and culture.',
    Points: '1',
    TimeLimit: '30'
  },
  {
    Question: 'Is the Earth round?',
    Type: 'true_false',
    Choices: '',
    CorrectAnswer: 'True',
    Explanation: 'The Earth is approximately spherical in shape, though it is slightly flattened at the poles.',
    Points: '1',
    TimeLimit: '30'
  },
  {
    Question: 'The chemical symbol for gold is ___.',
    Type: 'fill_blank',
    Choices: '',
    CorrectAnswer: 'Au',
    Explanation: 'Au comes from the Latin word for gold, "aurum".',
    Points: '1',
    TimeLimit: '30'
  },
  {
    Question: 'Explain the process of photosynthesis in detail.',
    Type: 'text',
    Choices: '',
    CorrectAnswer: 'Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.',
    Explanation: 'A detailed explanation of how plants use sunlight to produce energy.',
    Points: '2',
    TimeLimit: '60'
  },
  {
    Question: 'Which programming languages are object-oriented?',
    Type: 'mcq',
    Choices: 'Java|Python|C++|All of the above',
    CorrectAnswer: 'All of the above',
    Explanation: 'Java, Python, and C++ all support object-oriented programming principles.',
    Points: '1',
    TimeLimit: '45'
  },
  {
    Question: 'Water boils at 100 degrees Celsius at sea level.',
    Type: 'true_false',
    Choices: '',
    CorrectAnswer: 'True',
    Explanation: 'At standard atmospheric pressure (1 atm), water boils at 100°C.',
    Points: '1',
    TimeLimit: '30'
  },
  {
    Question: 'The largest planet in our solar system is ___.',
    Type: 'fill_blank',
    Choices: '',
    CorrectAnswer: 'Jupiter',
    Explanation: 'Jupiter is the largest planet in our solar system.',
    Points: '1',
    TimeLimit: '30'
  },
  {
    Question: 'What are the benefits of regular exercise?',
    Type: 'text',
    Choices: '',
    CorrectAnswer: 'Regular exercise improves cardiovascular health, strengthens muscles, boosts mood, and helps maintain a healthy weight.',
    Explanation: 'Exercise has numerous physical and mental health benefits.',
    Points: '2',
    TimeLimit: '90'
  }
];

// Instructions for using this format:
/*
1. Use | (pipe) to separate MCQ choices instead of commas
2. For True/False questions, leave Choices empty
3. For Fill in Blank, use ___ in the question text
4. For Text questions, provide a comprehensive expected answer
5. Always include explanations for better learning
6. Set appropriate time limits based on question complexity
7. Assign points based on question difficulty (1-5 recommended)
*/

console.log('Test questions ready for bulk upload');
console.log('Format: Use | to separate MCQ choices');
console.log('Total questions:', testQuestions.length); 