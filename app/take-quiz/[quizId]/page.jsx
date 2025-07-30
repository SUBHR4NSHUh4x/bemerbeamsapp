'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';

export default function TakeQuizPage() {
  const { quizId } = useParams();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Fetch quiz data
  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  // Timer effect
  useEffect(() => {
    if (quiz && timeLeft !== null && timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, timeLeft, isSubmitted]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (response.ok) {
        const quizData = await response.json();
        setQuiz(quizData);
        setTimeLeft(quizData.timeLimit * 60); // Convert minutes to seconds
      } else {
        setError('Quiz not found');
      }
    } catch (error) {
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleTextAnswer = (answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    
    // Calculate results
    const results = {
      quizId: quiz._id,
      userId: user?.id,
      answers: userAnswers,
      timeSpent: (quiz.timeLimit * 60) - timeLeft,
      submittedAt: new Date().toISOString()
    };

    // Calculate score
    let correctAnswers = 0;
    quiz.quizQuestions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      if (!userAnswer) return;

      switch (question.type) {
        case 'mcq':
          if (userAnswer === question.correctAnswer) {
            correctAnswers++;
          }
          break;
        case 'text':
          if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            correctAnswers++;
          }
          break;
        case 'true_false':
          if (userAnswer === question.correctAnswer) {
            correctAnswers++;
          }
          break;
        case 'fill_blank':
          if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            correctAnswers++;
          }
          break;
        default:
          if (userAnswer === question.correctAnswer) {
            correctAnswers++;
          }
      }
    });

    const score = Math.round((correctAnswers / quiz.quizQuestions.length) * 100);
    results.score = score;
    results.correctAnswers = correctAnswers;
    results.totalQuestions = quiz.quizQuestions.length;

    // Here you would typically save results to database
    console.log('Quiz Results:', results);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    return ((currentQuestionIndex + 1) / quiz.quizQuestions.length) * 100;
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.quizQuestions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      if (!userAnswer) return;

      switch (question.type) {
        case 'mcq':
          if (userAnswer === question.correctAnswer) {
            correct++;
          }
          break;
        case 'text':
          if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            correct++;
          }
          break;
        case 'true_false':
          if (userAnswer === question.correctAnswer) {
            correct++;
          }
          break;
        case 'fill_blank':
          if (userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
            correct++;
          }
          break;
        default:
          if (userAnswer === question.correctAnswer) {
            correct++;
          }
      }
    });
    return Math.round((correct / quiz.quizQuestions.length) * 100);
  };

  const renderQuestionContent = () => {
    const currentQuestion = quiz.quizQuestions[currentQuestionIndex];
    
    switch (currentQuestion.type) {
      case 'mcq':
        return (
          <div className="space-y-4">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(choice.text)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  userAnswers[currentQuestionIndex] === choice.text
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 mr-4 flex items-center justify-center">
                    {userAnswers[currentQuestionIndex] === choice.text && (
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    )}
                  </div>
                  <span className="font-medium">{choice.text}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <textarea
              value={userAnswers[currentQuestionIndex] || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 resize-none"
              rows={4}
            />
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  userAnswers[currentQuestionIndex] === option
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 mr-4 flex items-center justify-center">
                    {userAnswers[currentQuestionIndex] === option && (
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    )}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-4">
            <input
              type="text"
              value={userAnswers[currentQuestionIndex] || ''}
              onChange={(e) => handleTextAnswer(e.target.value)}
              placeholder="Fill in the blank..."
              className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(choice.text)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  userAnswers[currentQuestionIndex] === choice.text
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 mr-4 flex items-center justify-center">
                    {userAnswers[currentQuestionIndex] === choice.text && (
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    )}
                  </div>
                  <span className="font-medium">{choice.text}</span>
                </div>
              </button>
            ))}
          </div>
        );
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Image src="/errorIcon.png" alt="" width={180} height={180} />
          <h2 className="text-xl font-bold mt-4">{error}</h2>
          <button 
            onClick={() => router.push('/quizzes')}
            className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Test Results</h1>
            
            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-yellow-500 mb-4">{score}%</div>
              <div className="text-xl text-gray-600">
                {score >= 70 ? 'Congratulations! You passed!' : 'Keep practicing!'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">{quiz.quizQuestions.length}</div>
                <div className="text-gray-600">Total Questions</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((score / 100) * quiz.quizQuestions.length)}
                </div>
                <div className="text-gray-600">Correct Answers</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatTime((quiz.timeLimit * 60) - timeLeft)}
                </div>
                <div className="text-gray-600">Time Spent</div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => router.push('/quizzes')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium"
              >
                Take Another Test
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.quizQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.quizTitle}</h1>
              <p className="text-gray-600">Question {currentQuestionIndex + 1} of {quiz.quizQuestions.length}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-500">{formatTime(timeLeft)}</div>
              <div className="text-sm text-gray-600">Time Remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold mr-4">
                {currentQuestionIndex + 1}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{currentQuestion.question}</h2>
                <div className="text-sm text-gray-500 mt-1">
                  Type: {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 
                         currentQuestion.type === 'text' ? 'Text Answer' :
                         currentQuestion.type === 'true_false' ? 'True/False' :
                         currentQuestion.type === 'fill_blank' ? 'Fill in the Blank' : 'Question'}
                </div>
              </div>
            </div>
          </div>

          {/* Choices */}
          {renderQuestionContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex space-x-4">
              {currentQuestionIndex < quiz.quizQuestions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg"
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 