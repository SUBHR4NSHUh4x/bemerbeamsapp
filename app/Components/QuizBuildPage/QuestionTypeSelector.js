'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListUl, 
  faFont, 
  faCheckDouble, 
  faPenToSquare 
} from '@fortawesome/free-solid-svg-icons';

const questionTypes = [
  {
    id: 'mcq',
    name: 'Multiple Choice',
    description: 'Choose one correct answer from multiple options',
    icon: faListUl,
    color: 'bg-blue-500',
    hoverColor: 'hover:bg-blue-600'
  },
  {
    id: 'text',
    name: 'Text Answer',
    description: 'Free text response',
    icon: faFont,
    color: 'bg-green-500',
    hoverColor: 'hover:bg-green-600'
  },
  {
    id: 'true_false',
    name: 'True/False',
    description: 'Choose between True or False',
    icon: faCheckDouble,
    color: 'bg-purple-500',
    hoverColor: 'hover:bg-purple-600'
  },
  {
    id: 'fill_blank',
    name: 'Fill in the Blank',
    description: 'Complete the sentence with missing words',
    icon: faPenToSquare,
    color: 'bg-orange-500',
    hoverColor: 'hover:bg-orange-600'
  }
];

export default function QuestionTypeSelector({ selectedType, onTypeChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Question Type
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {questionTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 ${
              selectedType === type.id
                ? 'border-yellow-500 bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full ${type.color} text-white flex items-center justify-center mb-2`}>
                <FontAwesomeIcon icon={type.icon} className="w-4 h-4" />
              </div>
              <div className="text-xs font-medium text-gray-900">{type.name}</div>
              <div className="text-xs text-gray-500 mt-1">{type.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 