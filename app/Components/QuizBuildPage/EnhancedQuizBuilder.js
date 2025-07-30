'use client';

import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faPlus, faSave, faDownload } from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';

export default function EnhancedQuizBuilder() {
  const { user } = useUser();
  const fileInputRef = useRef(null);
  const [quizData, setQuizData] = useState({
    quizTitle: '',
    description: '',
    category: 'General',
    difficulty: 'medium',
    timeLimit: 30,
    passingScore: 70,
    isPublic: true,
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' or 'bulk'

  const questionTypes = [
    { value: 'mcq', label: 'Multiple Choice', icon: 'fa-list' },
    { value: 'true_false', label: 'True/False', icon: 'fa-check-circle' },
    { value: 'text', label: 'Text Answer', icon: 'fa-font' },
    { value: 'fill_blank', label: 'Fill in Blank', icon: 'fa-edit' },
  ];

  const addQuestion = (type = 'mcq') => {
    const newQuestion = {
      id: Date.now().toString(),
      type,
      question: '',
      choices: type === 'mcq' ? [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ] : [],
      correctAnswer: '',
      explanation: '',
      points: 1,
      timeLimit: 30,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const updateChoice = (questionIndex, choiceIndex, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].choices[choiceIndex] = {
      ...updatedQuestions[questionIndex].choices[choiceIndex],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate quiz title before upload
    if (!quizData.quizTitle || quizData.quizTitle.trim() === '') {
      toast.error('Please enter a quiz title before uploading questions');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('quizTitle', quizData.quizTitle);
    formData.append('category', quizData.category);
    formData.append('difficulty', quizData.difficulty);
    formData.append('createdBy', user?.id);

    setLoading(true);
    try {
      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully uploaded ${result.uploadedQuestions} questions!`);
        // You can redirect to the quiz or update the current quiz
      } else {
        toast.error(result.error || 'Upload failed');
        if (result.details) {
          console.error('Validation errors:', result.details);
        }
      }
    } catch (error) {
      toast.error('Upload failed');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!quizData.quizTitle.trim()) {
      toast.error('Quiz title is required');
      return;
    }

    if (questions.length === 0) {
      toast.error('At least one question is required');
      return;
    }

    setLoading(true);
    try {
      const quizPayload = {
        ...quizData,
        createdBy: user?.id,
        icon: 'fas fa-question',
        quizQuestions: questions.map(q => ({
          ...q,
          answeredResult: -1,
          statistics: {
            totalAttempts: 0,
            correctAttempts: 0,
            incorrectAttempts: 0,
          },
        })),
      };

      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quizPayload),
      });

      if (response.ok) {
        toast.success('Quiz saved successfully!');
        // Reset form or redirect
      } else {
        toast.error('Failed to save quiz');
      }
    } catch (error) {
      toast.error('Failed to save quiz');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        Question: 'What is the capital of France?',
        Type: 'mcq',
        Choices: 'Paris, London, Berlin, Madrid',
        CorrectAnswer: 'Paris',
        Explanation: 'Paris is the capital and largest city of France.',
        Points: '1',
        TimeLimit: '30',
      },
      {
        Question: 'Is the Earth round?',
        Type: 'true_false',
        Choices: '',
        CorrectAnswer: 'True',
        Explanation: 'The Earth is approximately spherical in shape.',
        Points: '1',
        TimeLimit: '30',
      },
    ];

    const csvContent = [
      'Question,Type,Choices,CorrectAnswer,Explanation,Points,TimeLimit',
      ...template.map(row => 
        Object.values(row).map(value => `"${value}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quiz_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Enhanced Quiz Builder</h1>
        
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'manual'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Manual Creation
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'bulk'
                ? 'bg-yellow-500 text-black'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Quiz Basic Info */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quiz Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiz Title *
            </label>
            <input
              type="text"
              value={quizData.quizTitle}
              onChange={(e) => setQuizData({...quizData, quizTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter quiz title"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={quizData.category}
              onChange={(e) => setQuizData({...quizData, category: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="General">General</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Literature">Literature</option>
              <option value="Technology">Technology</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={quizData.difficulty}
              onChange={(e) => setQuizData({...quizData, difficulty: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              value={quizData.timeLimit}
              onChange={(e) => setQuizData({...quizData, timeLimit: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              min="1"
              max="180"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passing Score (%)
            </label>
            <input
              type="number"
              value={quizData.passingScore}
              onChange={(e) => setQuizData({...quizData, passingScore: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              min="0"
              max="100"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={quizData.isPublic}
              onChange={(e) => setQuizData({...quizData, isPublic: e.target.checked})}
              className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded"
            />
            <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
              Make quiz public
            </label>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={quizData.description}
            onChange={(e) => setQuizData({...quizData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            rows="3"
            placeholder="Enter quiz description"
          />
        </div>
      </div>

      {activeTab === 'manual' ? (
        /* Manual Question Creation */
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
            <div className="flex space-x-2">
              {questionTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => addQuestion(type.value)}
                  className="px-3 py-2 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors text-sm"
                >
                  <FontAwesomeIcon icon={type.icon} className="mr-1" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onUpdate={(field, value) => updateQuestion(index, field, value)}
              onUpdateChoice={(choiceIndex, field, value) => updateChoice(index, choiceIndex, field, value)}
              onRemove={() => removeQuestion(index)}
            />
          ))}

          {questions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No questions added yet. Click the buttons above to add questions.</p>
            </div>
          )}
        </div>
      ) : (
        /* Bulk Upload */
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Bulk Upload Questions</h2>
          
          <div className="mb-6">
            <div className="flex space-x-4 mb-4">
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
              >
                <FontAwesomeIcon icon={faDownload} className="mr-2" />
                Download Template
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">File Format Requirements:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supported formats: Excel (.xlsx, .xls) or CSV</li>
                <li>• Required columns: Question, Type, Choices, CorrectAnswer, Explanation, Points, TimeLimit</li>
                <li>• Question types: mcq, true_false, text, fill_blank</li>
                <li>• For MCQ: Separate choices with commas</li>
                <li>• For True/False: Use &quot;True&quot; or &quot;False&quot; as correct answer</li>
              </ul>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="px-6 py-3 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors flex items-center mx-auto"
            >
              <FontAwesomeIcon icon={faUpload} className="mr-2" />
              {loading ? 'Uploading...' : 'Choose File'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Click to select an Excel or CSV file
            </p>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 text-center">
        <button
          onClick={saveQuiz}
          disabled={loading || questions.length === 0}
          className="px-8 py-3 bg-yellow-500 text-black rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
        >
          <FontAwesomeIcon icon={faSave} className="mr-2" />
          {loading ? 'Saving...' : 'Save Quiz'}
        </button>
      </div>
    </div>
  );
}

function QuestionEditor({ question, index, onUpdate, onUpdateChoice, onRemove }) {
  const renderQuestionType = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Choices:</label>
            {question.choices.map((choice, choiceIndex) => (
              <div key={choiceIndex} className="flex items-center space-x-3">
                <input
                  type="radio"
                  name={`correct-${index}`}
                  checked={choice.isCorrect}
                  onChange={() => {
                    // Update all choices to set only one as correct
                    question.choices.forEach((_, i) => {
                      onUpdateChoice(i, 'isCorrect', i === choiceIndex);
                    });
                  }}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300"
                />
                <input
                  type="text"
                  value={choice.text}
                  onChange={(e) => onUpdateChoice(choiceIndex, 'text', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder={`Choice ${choiceIndex + 1}`}
                />
              </div>
            ))}
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Correct Answer:</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`tf-${index}`}
                  checked={question.correctAnswer === 'True'}
                  onChange={() => onUpdate('correctAnswer', 'True')}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300"
                />
                <span className="ml-2">True</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`tf-${index}`}
                  checked={question.correctAnswer === 'False'}
                  onChange={() => onUpdate('correctAnswer', 'False')}
                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300"
                />
                <span className="ml-2">False</span>
              </label>
            </div>
          </div>
        );

      case 'text':
      case 'fill_blank':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Answer:
            </label>
            <input
              type="text"
              value={question.correctAnswer}
              onChange={(e) => onUpdate('correctAnswer', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter correct answer"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-medium">Question {index + 1}</h3>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Question:
          </label>
          <textarea
            value={question.question}
            onChange={(e) => onUpdate('question', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            rows="3"
            placeholder="Enter your question"
          />
        </div>

        {renderQuestionType()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Points:
            </label>
            <input
              type="number"
              value={question.points}
              onChange={(e) => onUpdate('points', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              min="1"
              max="10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (seconds):
            </label>
            <input
              type="number"
              value={question.timeLimit}
              onChange={(e) => onUpdate('timeLimit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              min="10"
              max="300"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explanation (optional):
          </label>
          <textarea
            value={question.explanation}
            onChange={(e) => onUpdate('explanation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            rows="2"
            placeholder="Explain the correct answer"
          />
        </div>
      </div>
    </div>
  );
} 