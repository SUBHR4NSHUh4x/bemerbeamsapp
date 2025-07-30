'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';

// MCQ Component
export function MCQComponent({ question, onQuestionChange, onChoicesChange, onCorrectAnswerChange, questionNumber }) {
  const prefixes = ['A', 'B', 'C', 'D'];

  const addChoice = () => {
    if (question.choices.length < 4) {
      const newChoice = {
        text: `${prefixes[question.choices.length]}. `,
        isCorrect: false
      };
      onChoicesChange([...question.choices, newChoice]);
    }
  };

  const removeChoice = (index) => {
    if (question.choices.length > 2) {
      const newChoices = question.choices.filter((_, i) => i !== index);
      onChoicesChange(newChoices);
    }
  };

  const updateChoice = (index, text) => {
    const newChoices = [...question.choices];
    newChoices[index] = { ...newChoices[index], text: `${prefixes[index]}. ${text}` };
    onChoicesChange(newChoices);
  };

  return (
    <div className="space-y-4">
      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question {questionNumber}
        </label>
        <textarea
          value={question.question}
          onChange={(e) => onQuestionChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Enter your question here..."
          rows={3}
        />
      </div>

      {/* Choices */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choices
        </label>
        <div className="space-y-2">
          {question.choices.map((choice, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={choice.text.substring(3)} // Remove prefix
                onChange={(e) => updateChoice(index, e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-yellow-500"
                placeholder={`Option ${index + 1}`}
              />
              <button
                onClick={() => removeChoice(index)}
                disabled={question.choices.length <= 2}
                className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>
          ))}
          {question.choices.length < 4 && (
            <button
              onClick={addChoice}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Choice
            </button>
          )}
        </div>
      </div>

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correct Answer
        </label>
        <select
          value={question.correctAnswer}
          onChange={(e) => onCorrectAnswerChange(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
        >
          <option value="">Select correct answer</option>
          {question.choices.map((choice, index) => (
            <option key={index} value={choice.text}>
              {choice.text}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Text Component
export function TextComponent({ question, onQuestionChange, onCorrectAnswerChange, questionNumber }) {
  return (
    <div className="space-y-4">
      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question {questionNumber}
        </label>
        <textarea
          value={question.question}
          onChange={(e) => onQuestionChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Enter your question here..."
          rows={3}
        />
      </div>

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Expected Answer
        </label>
        <textarea
          value={question.correctAnswer}
          onChange={(e) => onCorrectAnswerChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Enter the expected answer..."
          rows={2}
        />
      </div>
    </div>
  );
}

// True/False Component
export function TrueFalseComponent({ question, onQuestionChange, onCorrectAnswerChange, questionNumber }) {
  return (
    <div className="space-y-4">
      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question {questionNumber}
        </label>
        <textarea
          value={question.question}
          onChange={(e) => onQuestionChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Enter your True/False question here..."
          rows={3}
        />
      </div>

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correct Answer
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="correctAnswer"
              value="True"
              checked={question.correctAnswer === "True"}
              onChange={(e) => onCorrectAnswerChange(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">True</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="correctAnswer"
              value="False"
              checked={question.correctAnswer === "False"}
              onChange={(e) => onCorrectAnswerChange(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">False</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// Fill in the Blank Component
export function FillBlankComponent({ question, onQuestionChange, onCorrectAnswerChange, questionNumber }) {
  return (
    <div className="space-y-4">
      {/* Question Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question {questionNumber} (use ___ for blanks)
        </label>
        <textarea
          value={question.question}
          onChange={(e) => onQuestionChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Enter your question with ___ for blanks. Example: The capital of France is ___."
          rows={3}
        />
      </div>

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correct Answer
        </label>
        <input
          type="text"
          value={question.correctAnswer}
          onChange={(e) => onCorrectAnswerChange(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          placeholder="Enter the correct answer for the blank..."
        />
      </div>
    </div>
  );
} 