'use client';

import { useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faPlus, faSave, faDownload } from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';
import * as XLSX from 'xlsx';

export default function EnhancedQuizBuilder() {
  const { user } = useUser();
  const fileInputRef = useRef(null);
  const [quizData, setQuizData] = useState({
    quizTitle: '',
    description: '',
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

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
      'application/csv', // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate quiz title before upload
    if (!quizData.quizTitle || quizData.quizTitle.trim() === '') {
      toast.error('Please enter a quiz title before uploading questions');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('quizTitle', quizData.quizTitle);
    formData.append('createdBy', user?.id);

    setLoading(true);
    const loadingToast = toast.loading('Uploading questions...');

    try {
      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Successfully uploaded ${result.uploadedQuestions} questions!`, {
          id: loadingToast,
        });
        
        // Reset form after successful upload
        setQuizData({
          quizTitle: '',
          description: '',
          timeLimit: 30,
          passingScore: 70,
          isPublic: true,
        });
        
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Show success message with quiz details
        toast.success(`Quiz "${result.quizTitle}" created with ${result.totalQuestions} questions!`);
        
      } else {
        toast.error(result.error || 'Upload failed', { id: loadingToast });
        
        // Show detailed validation errors if available
        if (result.details && Array.isArray(result.details)) {
          console.error('Validation errors:', result.details);
          toast.error(`Found ${result.details.length} validation errors. Check console for details.`);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const saveQuiz = async () => {
    if (!quizData.quizTitle.trim()) {
      toast.error('Test title is required');
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
        toast.success('Test saved successfully!');
        // Redirect to manage-quizzes page
        window.location.href = '/manage-quizzes';
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to save test');
      }
    } catch (error) {
      toast.error('Failed to save test');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Create sample data for template
    const sampleData = [
      {
        Question: 'What is the capital of France?',
        Type: 'mcq',
        Choices: 'Paris, London, Berlin, Madrid',
        CorrectAnswer: 'Paris',
        Explanation: 'Paris is the capital and largest city of France.',
        Points: '1',
        TimeLimit: '30'
      },
      {
        Question: 'Is the Earth round?',
        Type: 'true_false',
        Choices: '',
        CorrectAnswer: 'True',
        Explanation: 'The Earth is approximately spherical in shape.',
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
        Question: 'Explain the process of photosynthesis.',
        Type: 'text',
        Choices: '',
        CorrectAnswer: 'Photosynthesis is the process by which plants convert sunlight into energy.',
        Explanation: 'A detailed explanation of the photosynthesis process.',
        Points: '2',
        TimeLimit: '60'
      }
    ];

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions Template');

    // Add instructions sheet
    const instructions = [
      { Column: 'Question', Description: 'The question text (required)' },
      { Column: 'Type', Description: 'Question type: mcq, true_false, text, fill_blank (default: mcq)' },
      { Column: 'Choices', Description: 'For MCQ: comma-separated choices. For others: leave empty' },
      { Column: 'CorrectAnswer', Description: 'The correct answer (required)' },
      { Column: 'Explanation', Description: 'Explanation for the answer (optional)' },
      { Column: 'Points', Description: 'Points for this question (default: 1)' },
      { Column: 'TimeLimit', Description: 'Time limit in seconds (default: 30)' }
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Download file
    XLSX.writeFile(workbook, 'quiz_questions_template.xlsx');
    toast.success('Template downloaded successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Toaster position="top-center" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Enhanced Test Builder</h1>
        
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
              Test Title *
            </label>
            <input
              type="text"
              value={quizData.quizTitle}
              onChange={(e) => setQuizData({...quizData, quizTitle: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter test title"
            />
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

      {/* Manual Question Creation Tab */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Quiz Details Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Quiz Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={quizData.quizTitle}
                  onChange={(e) => setQuizData({ ...quizData, quizTitle: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter test title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={quizData.category}
                  onChange={(e) => setQuizData({ ...quizData, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="General">General</option>
                  <option value="Science">Science</option>
                  <option value="Math">Math</option>
                  <option value="History">History</option>
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
                  onChange={(e) => setQuizData({ ...quizData, difficulty: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={quizData.description}
                  onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter quiz description"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
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
        </div>
      )}

      {/* Bulk Upload Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Bulk Upload Instructions</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Upload Excel (.xlsx, .xls) or CSV files with your questions</p>
              <p>• Maximum file size: 5MB</p>
              <p>• Required columns: Question, Type, Choices, CorrectAnswer</p>
              <p>• Supported question types: MCQ, True/False, Text, Fill in Blank</p>
              <p>• Download the template below for the correct format</p>
            </div>
          </div>

          {/* Quiz Details Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title *
                </label>
                <input
                  type="text"
                  value={quizData.quizTitle}
                  onChange={(e) => setQuizData({ ...quizData, quizTitle: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter test title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={quizData.description}
                  onChange={(e) => setQuizData({ ...quizData, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter quiz description"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Questions File</h3>
              <button
                onClick={downloadTemplate}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <FontAwesomeIcon icon={faDownload} className="w-4 h-4 mr-2" />
                Download Template
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="space-y-4">
                <FontAwesomeIcon icon={faUpload} className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {loading ? 'Uploading...' : 'Choose a file or drag it here'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Excel (.xlsx, .xls) or CSV files only, max 5MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="px-6 py-3 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Uploading...' : 'Select File'}
                </button>
              </div>
            </div>

            {/* File Format Guide */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">File Format Guide</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Question:</strong> The question text (required)</p>
                <p><strong>Type:</strong> mcq, true_false, text, fill_blank (default: mcq)</p>
                <p><strong>Choices:</strong> For MCQ: comma-separated choices. For others: leave empty</p>
                <p><strong>CorrectAnswer:</strong> The correct answer (required)</p>
                <p><strong>Explanation:</strong> Explanation for the answer (optional)</p>
                <p><strong>Points:</strong> Points for this question (default: 1)</p>
                <p><strong>TimeLimit:</strong> Time limit in seconds (default: 30)</p>
              </div>
            </div>
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
          {loading ? 'Saving...' : 'Save Test'}
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