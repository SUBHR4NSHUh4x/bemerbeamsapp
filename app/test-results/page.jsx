'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

export default function TestResultsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [attempts, setAttempts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [editedAnswers, setEditedAnswers] = useState([]);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }
    fetchData();
  }, [isLoaded, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all quizzes
      const quizzesResponse = await fetch('/api/quizzes');
      const quizzesData = await quizzesResponse.json();
      setQuizzes(quizzesData.quizzes || []);

      // Fetch all attempts
      const attemptsResponse = await fetch('/api/quiz-attempts/all');
      const attemptsData = await attemptsResponse.json();
      setAttempts(attemptsData.attempts || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load test results');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAttempt = (attempt) => {
    setSelectedAttempt(attempt);
    setEditedAnswers([...attempt.answers]);
    setShowEditModal(true);
  };

  const handleViewDetails = (attempt) => {
    setSelectedAttempt(attempt);
    setShowDetailsModal(true);
  };

  const handleAnswerToggle = (answerIndex, isCorrect) => {
    setEditedAnswers(prev => 
      prev.map((answer, index) => 
        index === answerIndex 
          ? { ...answer, isCorrect, points: isCorrect ? answer.points : 0 }
          : answer
      )
    );
  };

  const handleSaveChanges = async () => {
    try {
      // Calculate new score
      const totalPoints = editedAnswers.reduce((sum, answer) => sum + answer.points, 0);
      const earnedPoints = editedAnswers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
      const newScore = Math.round((earnedPoints / totalPoints) * 100);
      const passed = newScore >= (selectedAttempt.quiz?.passingScore || 70);

      const updatedAttempt = {
        ...selectedAttempt,
        answers: editedAnswers,
        score: newScore,
        passed,
      };

      const response = await fetch(`/api/quiz-attempts/${selectedAttempt._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAttempt),
      });

      if (response.ok) {
        toast.success('Results updated successfully');
        setShowEditModal(false);
        
        // Update the local state immediately
        setAttempts(prevAttempts => 
          prevAttempts.map(attempt => 
            attempt._id === selectedAttempt._id 
              ? { ...attempt, answers: editedAnswers, score: newScore, passed }
              : attempt
          )
        );
        
        // Also refresh data from server to ensure consistency
        setTimeout(() => {
          fetchData();
        }, 500);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update results');
      }
    } catch (error) {
      console.error('Error updating attempt:', error);
      toast.error('Failed to update results');
    }
  };

  const filteredAttempts = attempts.filter(attempt => {
    if (selectedQuiz === 'all') return true;
    return attempt.quizId === selectedQuiz;
  });

  const exportCSV = () => {
    if (!filteredAttempts.length) return;
    
    const header = [
      'Employee Name',
      'Store Name', 
      'Quiz Title',
      'Marks Secured',
      'Total Marks',
      'Percentage',
      'Passed',
      'Date',
      'Duration (minutes)'
    ];
    
    const rows = filteredAttempts.map(attempt => {
      const totalMarks = attempt.answers.reduce((sum, answer) => sum + answer.points, 0);
      const securedMarks = attempt.answers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
      
      return [
        attempt.userName,
        attempt.storeName || 'N/A',
        attempt.quiz?.quizTitle || 'N/A',
        securedMarks,
        totalMarks,
        `${attempt.score}%`,
        attempt.passed ? 'Yes' : 'No',
        new Date(attempt.endTime).toLocaleDateString(),
        Math.round(attempt.duration / 60)
      ];
    });
    
    let csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Image
                src="/biggies.png"
                alt="BeamerBrands"
                width={50}
                height={50}
                className="rounded-lg"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                Test Results Management
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={exportCSV}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                Export CSV
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Admin Dashboard
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Quiz:</label>
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            >
              <option value="all">All Quizzes</option>
              {quizzes.map(quiz => (
                <option key={quiz._id} value={quiz._id}>
                  {quiz.quizTitle}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marks Secured
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Marks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                      No test results found
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((attempt) => {
                    const totalMarks = attempt.answers.reduce((sum, answer) => sum + answer.points, 0);
                    const securedMarks = attempt.answers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
                    
                    return (
                      <tr key={attempt._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {attempt.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {attempt.storeName || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attempt.quiz?.quizTitle || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {securedMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attempt.score}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            attempt.passed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(attempt.endTime).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewDetails(attempt)}
                              className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors"
                            >
                              View Responses
                            </button>
                            <button
                              onClick={() => handleEditAttempt(attempt)}
                              className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Details Modal - Shows all responses */}
      {showDetailsModal && selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quiz Responses - {selectedAttempt.userName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAttempt.quiz?.quizTitle} • {new Date(selectedAttempt.endTime).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Summary Information */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Score:</span>
                    <span className="ml-2 font-bold text-lg">{selectedAttempt.score}%</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedAttempt.passed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedAttempt.passed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span>
                    <span className="ml-2">{Math.round(selectedAttempt.duration / 60)} minutes</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Store:</span>
                    <span className="ml-2">{selectedAttempt.storeName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Detailed Responses Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">#</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Question</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Student Answer</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-700">Correct Answer</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Points</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Time Spent</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-700">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedAttempt.answers?.map((answer, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-gray-900 max-w-xs">
                          <div className="break-words">{answer.questionText}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="break-words bg-gray-50 p-2 rounded">
                            {answer.studentAnswer || 'No answer provided'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          <div className="break-words bg-green-50 p-2 rounded">
                            {answer.correctAnswer}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-gray-900">
                          {answer.points}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {answer.timeSpent || 0}s
                        </td>
                        <td className="px-4 py-3 text-center">
                          {answer.isCorrect ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              ✓ Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                              ✗ Incorrect
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Results - {selectedAttempt.userName}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {editedAnswers.map((answer, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">
                        Question {index + 1}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          Points: {answer.points}
                        </span>
                        <button
                          onClick={() => handleAnswerToggle(index, !answer.isCorrect)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            answer.isCorrect
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {answer.isCorrect ? 'Correct' : 'Incorrect'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Question:</span>
                        <p className="text-sm text-gray-900 mt-1">{answer.questionText}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">Student Answer:</span>
                        <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                          {answer.studentAnswer || 'No answer provided'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">Correct Answer:</span>
                        <p className="text-sm text-gray-900 mt-1 bg-green-50 p-2 rounded">
                          {answer.correctAnswer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 