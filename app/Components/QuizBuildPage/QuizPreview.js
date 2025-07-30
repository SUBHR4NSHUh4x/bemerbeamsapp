'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faTimes, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

export default function QuizPreview({ quiz, isOpen, onClose }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!isOpen || !quiz) return null;

  const currentQuestion = quiz.quizQuestions[currentQuestionIndex];

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
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
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
          // For text questions, we'll consider it correct if it matches (case-insensitive)
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

  const getCorrectAnswerText = (question) => {
    return question.correctAnswer || 'Not set';
  };

  const calculateProgress = () => {
    return ((currentQuestionIndex + 1) / quiz.quizQuestions.length) * 100;
  };

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'mcq':
        return (
          <div className="space-y-4 mb-8">
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
          <div className="space-y-4 mb-8">
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
          <div className="space-y-4 mb-8">
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
          <div className="space-y-4 mb-8">
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
          <div className="space-y-4 mb-8">
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

  const renderQuestionReview = (question, index) => {
    const userAnswer = userAnswers[index];
    const isCorrect = userAnswer && (
      question.type === 'text' || question.type === 'fill_blank'
        ? userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()
        : userAnswer === question.correctAnswer
    );

    return (
      <div key={index} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <span className="font-semibold mr-2">Question {index + 1}:</span>
          <span className="text-gray-700">{question.question}</span>
        </div>
        
        <div className="ml-4 space-y-2">
          {question.type === 'mcq' && question.choices.map((choice, choiceIndex) => (
            <div key={choiceIndex} className="flex items-center">
              <FontAwesomeIcon 
                icon={choice.text === question.correctAnswer ? faCheck : faXmark} 
                className={`w-4 h-4 mr-2 ${
                  choice.text === question.correctAnswer 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}
              />
              <span className={`${
                userAnswer === choice.text 
                  ? 'font-semibold' 
                  : ''
              }`}>
                {choice.text}
              </span>
              {userAnswer === choice.text && (
                <span className="ml-2 text-sm text-blue-600">(Your answer)</span>
              )}
            </div>
          ))}
          
          {question.type === 'text' && (
            <div className="space-y-2">
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={isCorrect ? faCheck : faXmark} 
                  className={`w-4 h-4 mr-2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}
                />
                <span className="font-medium">Expected: {question.correctAnswer}</span>
              </div>
              {userAnswer && (
                <div className="ml-6">
                  <span className="text-sm text-gray-600">Your answer: {userAnswer}</span>
                </div>
              )}
            </div>
          )}
          
          {question.type === 'true_false' && (
            <div className="space-y-2">
              {['True', 'False'].map((option) => (
                <div key={option} className="flex items-center">
                  <FontAwesomeIcon 
                    icon={option === question.correctAnswer ? faCheck : faXmark} 
                    className={`w-4 h-4 mr-2 ${
                      option === question.correctAnswer 
                        ? 'text-green-500' 
                        : 'text-red-500'
                    }`}
                  />
                  <span className={`${
                    userAnswer === option 
                      ? 'font-semibold' 
                      : ''
                  }`}>
                    {option}
                  </span>
                  {userAnswer === option && (
                    <span className="ml-2 text-sm text-blue-600">(Your answer)</span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {question.type === 'fill_blank' && (
            <div className="space-y-2">
              <div className="flex items-center">
                <FontAwesomeIcon 
                  icon={isCorrect ? faCheck : faXmark} 
                  className={`w-4 h-4 mr-2 ${isCorrect ? 'text-green-500' : 'text-red-500'}`}
                />
                <span className="font-medium">Correct: {question.correctAnswer}</span>
              </div>
              {userAnswer && (
                <div className="ml-6">
                  <span className="text-sm text-gray-600">Your answer: {userAnswer}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Quiz Preview - Results</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
            </button>
          </div>

          {/* Results */}
          <div className="p-6">
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
                  {quiz.quizQuestions.length - Math.round((score / 100) * quiz.quizQuestions.length)}
                </div>
                <div className="text-gray-600">Incorrect Answers</div>
              </div>
            </div>

            {/* Question Review */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Question Review</h3>
              {quiz.quizQuestions.map((question, index) => renderQuestionReview(question, index))}
            </div>

            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  setShowResults(false);
                  setCurrentQuestionIndex(0);
                  setUserAnswers({});
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg font-medium"
              >
                Preview Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quiz Preview</h2>
            <p className="text-gray-600 mt-1">{quiz.quizTitle || 'Untitled Quiz'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faTimes} className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-50 px-6 py-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Question {currentQuestionIndex + 1} of {quiz.quizQuestions.length}</span>
            <span>{Math.round(calculateProgress())}% Complete</span>
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
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

          {/* Question Content */}
          {renderQuestionContent()}

          {/* Navigation */}
          <div className="flex justify-between">
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
                  onClick={handleNext}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg"
                >
                  See Results
                </button>
              )}
            </div>
          </div>

          {/* Preview Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Preview Mode</h4>
            <p className="text-blue-700 text-sm">
              This is how your quiz will appear to students. You can navigate through questions and see the final results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 