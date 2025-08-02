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
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizStartTime, setQuizStartTime] = useState(null);

  // Check for user info from session storage (for non-authenticated access)
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Check if user info exists in session storage (for test access without authentication)
    const storedUserInfo = sessionStorage.getItem('quizUserInfo');
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    } else if (isLoaded && !user) {
      // If no stored user info and not authenticated, redirect to test access page
      router.push('/test-access');
    }
  }, [isLoaded, user, router]);

  // Fetch quiz data
  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  // Timer effect with auto-submit
  useEffect(() => {
    if (quiz && timeLeft !== null && timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-submit when timer expires
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, timeLeft, isSubmitted]);

  // Prevent leaving the test without submitting
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isSubmitted) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
        return 'Are you sure you want to leave? Your progress will be lost.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSubmitted]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (response.ok) {
        const quizData = await response.json();
        setQuiz(quizData);
        setTimeLeft(quizData.timeLimit * 60); // Convert minutes to seconds
        setQuizStartTime(new Date().toISOString()); // Set start time when quiz loads
      } else {
        setError('Quiz not found');
      }
    } catch (error) {
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleTextAnswer = (questionIndex, answer) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;

    try {
      setIsSubmitted(true);
      
      // Calculate answers array
      const answers = quiz.quizQuestions.map((question, index) => {
        const userAnswer = userAnswers[index] || '';
        let isCorrect = false;
        let points = 0;

        // Check if answer is correct
        if (question.type === 'mcq') {
          isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'true_false') {
          isCorrect = userAnswer === question.correctAnswer;
        } else if (question.type === 'text' || question.type === 'fill_blank') {
          isCorrect = userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
        }

        points = isCorrect ? question.points : 0;

        return {
          questionId: question._id || question.id || `question_${index}`, // Add questionId
          questionText: question.question,
          studentAnswer: userAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          points: question.points,
          timeSpent: 0, // Not tracking individual question time
        };
      });

      // Calculate score
      const totalPoints = answers.reduce((sum, answer) => sum + answer.points, 0);
      const earnedPoints = answers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
      const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = score >= quiz.passingScore;

      // Prepare attempt data
      const attemptData = {
        quizId: quiz._id,
        userId: user?.id || 'anonymous',
        userName: userInfo?.name || user?.firstName || 'Anonymous',
        userEmail: userInfo?.email || user?.emailAddresses?.[0]?.emailAddress || 'anonymous@example.com',
        storeName: userInfo?.storeName || '',
        score,
        passed,
        startTime: quizStartTime,
        endTime: new Date().toISOString(),
        duration: (quiz.timeLimit * 60) - timeLeft,
        answers,
      };

      console.log('Submitting attempt data:', attemptData);

      // Submit attempt
      const response = await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attemptData),
      });

      if (response.ok) {
        console.log('Attempt submitted successfully');
        // Show confirmation screen instead of immediately redirecting
        setShowConfirmation(true);
      } else {
        const errorData = await response.json();
        console.error('Failed to submit attempt:', errorData);
        alert('Failed to submit test. Please try again.');
        setIsSubmitted(false);
      }
    } catch (error) {
      console.error('Error submitting attempt:', error);
      alert('Failed to submit test. Please try again.');
      setIsSubmitted(false);
    }
  };

  const handleReturnToTestAccess = () => {
    sessionStorage.removeItem('quizUserInfo');
    router.push('/test-access');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    if (!quiz) return 0;
    const answeredCount = Object.keys(userAnswers).length;
    return (answeredCount / quiz.quizQuestions.length) * 100;
  };

  // Show confirmation screen
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Your Answer is Submitted!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for completing the test. Your responses have been successfully recorded.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleReturnToTestAccess}
              className="w-full bg-yellow-500 text-black font-semibold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Return to Test Access
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/test-access')}
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium"
          >
            Back to Test Access
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  const renderQuestionContent = (question, questionIndex) => {
    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-4">
            {question.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(questionIndex, choice.text)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  userAnswers[questionIndex] === choice.text
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 mr-4 flex items-center justify-center">
                    {userAnswers[questionIndex] === choice.text && (
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
              value={userAnswers[questionIndex] || ''}
              onChange={(e) => handleTextAnswer(questionIndex, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full p-6 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 resize-none text-lg"
              rows={8}
            />
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-4">
            {['True', 'False'].map((option) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(questionIndex, option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  userAnswers[questionIndex] === option
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 mr-4 flex items-center justify-center">
                    {userAnswers[questionIndex] === option && (
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
              value={userAnswers[questionIndex] || ''}
              onChange={(e) => handleTextAnswer(questionIndex, e.target.value)}
              placeholder="Fill in the blank..."
              className="w-full p-6 border-2 border-gray-200 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 text-lg"
            />
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            {question.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(questionIndex, choice.text)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                  userAnswers[questionIndex] === choice.text
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-300 mr-4 flex items-center justify-center">
                    {userAnswers[questionIndex] === choice.text && (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.quizTitle}</h1>
              <p className="text-gray-600">All Questions ({quiz.quizQuestions.length} total)</p>
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
          <div className="text-sm text-gray-600 mt-1">
            {Object.keys(userAnswers).length} of {quiz.quizQuestions.length} questions answered
          </div>
        </div>
      </div>

      {/* All Questions */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {quiz.quizQuestions.map((question, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold mr-4">
                      {index + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">{question.question}</h2>
                      <div className="text-sm text-gray-500 mt-1">
                        Type: {question.type === 'mcq' ? 'Multiple Choice' : 
                               question.type === 'text' ? 'Text Answer' :
                               question.type === 'true_false' ? 'True/False' :
                               question.type === 'fill_blank' ? 'Fill in the Blank' : 'Question'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-600">{question.points} points</div>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              {renderQuestionContent(question, index)}
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitted}
            className="px-8 py-4 bg-green-500 text-white rounded-lg font-medium text-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitted ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>
    </div>
  );
} 