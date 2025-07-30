'use client';

import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheck, faTimes, faArrowLeft, faArrowRight, faFlag } from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';

export default function EnhancedQuizInterface({ quiz, onComplete }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60); // Convert to seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const timerRef = useRef(null);
  const questionTimerRef = useRef(null);

  const currentQuestion = quiz.quizQuestions[currentQuestionIndex];
  const totalQuestions = quiz.quizQuestions.length;
  const progress = (Object.keys(answers).length / totalQuestions) * 100;

  useEffect(() => {
    // Start main timer
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Start question timer
    setQuestionStartTime(Date.now());
    questionTimerRef.current = setInterval(() => {
      // Track time spent on current question
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Reset question timer when question changes
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: {
        answer,
        timeSpent: Math.floor((Date.now() - questionStartTime) / 1000),
        timestamp: Date.now(),
      }
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFlagQuestion = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  const handleSubmit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    
    setIsSubmitted(true);
    setShowResults(true);
    
    // Calculate results
    const results = calculateResults();
    onComplete(results);
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    let totalTimeSpent = 0;

    quiz.quizQuestions.forEach((question, index) => {
      const userAnswer = answers[index];
      totalPoints += question.points;
      totalTimeSpent += userAnswer?.timeSpent || 0;

      if (userAnswer) {
        const isCorrect = checkAnswer(question, userAnswer.answer);
        if (isCorrect) {
          correctAnswers++;
          earnedPoints += question.points;
        }
      }
    });

    const score = (earnedPoints / totalPoints) * 100;
    const passed = score >= quiz.passingScore;

    return {
      score,
      correctAnswers,
      totalQuestions,
      earnedPoints,
      totalPoints,
      totalTimeSpent,
      passed,
      answers,
      quiz,
    };
  };

  const checkAnswer = (question, userAnswer) => {
    switch (question.type) {
      case 'mcq':
        return question.choices[userAnswer]?.isCorrect || false;
      case 'true_false':
        return userAnswer === question.correctAnswer;
      case 'text':
      case 'fill_blank':
        return userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      default:
        return false;
    }
  };

  const renderQuestion = () => {
    const userAnswer = answers[currentQuestionIndex]?.answer;

    switch (currentQuestion.type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            {currentQuestion.choices.map((choice, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  userAnswer === index
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  value={index}
                  checked={userAnswer === index}
                  onChange={(e) => handleAnswer(parseInt(e.target.value))}
                  className="sr-only"
                />
                <div className="flex items-center w-full">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    userAnswer === index
                      ? 'border-yellow-500 bg-yellow-500'
                      : 'border-gray-300'
                  }`}>
                    {userAnswer === index && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="flex-1">{choice.text}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label
                key={option}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  userAnswer === option
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestionIndex}`}
                  value={option}
                  checked={userAnswer === option}
                  onChange={(e) => handleAnswer(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center w-full">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    userAnswer === option
                      ? 'border-yellow-500 bg-yellow-500'
                      : 'border-gray-300'
                  }`}>
                    {userAnswer === option && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </div>
              </label>
            ))}
          </div>
        );

      case 'text':
      case 'fill_blank':
        return (
          <div>
            <textarea
              value={userAnswer || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 resize-none"
              rows="4"
              placeholder={currentQuestion.type === 'fill_blank' ? 'Fill in the blank...' : 'Type your answer...'}
            />
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (showResults) {
    return <QuizResults results={calculateResults()} />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.quizTitle}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-red-500">
              <FontAwesomeIcon icon={faClock} />
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
            </div>
            <button
              onClick={handleFlagQuestion}
              className={`p-2 rounded-lg transition-colors ${
                flaggedQuestions.has(currentQuestionIndex)
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faFlag} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {Object.keys(answers).length}/{totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-2">
          {quiz.quizQuestions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-yellow-500 text-black'
                  : answers[index]
                  ? 'bg-green-500 text-white'
                  : flaggedQuestions.has(index)
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <h2 className="text-xl font-semibold mt-2">{currentQuestion.question}</h2>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Points: {currentQuestion.points}</div>
            <div className="text-sm text-gray-500">Time: {currentQuestion.timeLimit}s</div>
          </div>
        </div>

        {renderQuestion()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
          Previous
        </button>

        <div className="flex space-x-4">
          {currentQuestionIndex === totalQuestions - 1 ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
            >
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
            >
              Next
              <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function QuizResults({ results }) {
  const {
    score,
    correctAnswers,
    totalQuestions,
    earnedPoints,
    totalPoints,
    totalTimeSpent,
    passed,
    answers,
    quiz,
  } = results;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Results</h1>
          
          <div className="flex justify-center items-center space-x-8 mb-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${passed ? 'text-green-500' : 'text-red-500'}`}>
                {Math.round(score)}%
              </div>
              <div className="text-gray-600">Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-500">
                {correctAnswers}/{totalQuestions}
              </div>
              <div className="text-gray-600">Correct</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-500">
                {Math.floor(totalTimeSpent / 60)}:{(totalTimeSpent % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-gray-600">Time</div>
            </div>
          </div>

          <div className={`inline-block px-6 py-3 rounded-lg text-lg font-medium ${
            passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {passed ? 'Passed!' : 'Failed'}
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Question Review</h2>
          {quiz.quizQuestions.map((question, index) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer ? checkAnswer(question, userAnswer.answer) : false;
            
            return (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 ${
                  isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium">Question {index + 1}</h3>
                  <div className="flex items-center space-x-2">
                    {isCorrect ? (
                      <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                    ) : (
                      <FontAwesomeIcon icon={faTimes} className="text-red-500" />
                    )}
                    <span className="text-sm text-gray-600">{question.points} pts</span>
                  </div>
                </div>
                
                <p className="mb-3">{question.question}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Your Answer: </span>
                    <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                      {userAnswer?.answer || 'Not answered'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Correct Answer: </span>
                    <span className="text-green-600">{question.correctAnswer}</span>
                  </div>
                </div>
                
                {question.explanation && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-800">Explanation: </span>
                    <span className="text-blue-700">{question.explanation}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function checkAnswer(question, userAnswer) {
  switch (question.type) {
    case 'mcq':
      return question.choices[userAnswer]?.isCorrect || false;
    case 'true_false':
      return userAnswer === question.correctAnswer;
    case 'text':
    case 'fill_blank':
      return userAnswer?.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    default:
      return false;
  }
} 