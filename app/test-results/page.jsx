'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [refreshing, setRefreshing] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [editedAnswers, setEditedAnswers] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [viewMode, setViewMode] = useState('quizzes'); // 'quizzes' or 'details'
  const [selectedQuizForDetails, setSelectedQuizForDetails] = useState(null);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Add cache busting parameter
      const timestamp = Date.now();
      
      // Fetch all quizzes with cache busting
      const quizzesResponse = await fetch(`/api/quizzes?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!quizzesResponse.ok) {
        throw new Error(`Failed to fetch quizzes: ${quizzesResponse.status}`);
      }
      
      const quizzesData = await quizzesResponse.json();
      console.log('Quizzes data:', quizzesData);
      setQuizzes(quizzesData.quizzes || []);

      // Fetch all attempts with cache busting
      const attemptsResponse = await fetch(`/api/quiz-attempts/all?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!attemptsResponse.ok) {
        throw new Error(`Failed to fetch attempts: ${attemptsResponse.status}`);
      }
      
      const attemptsData = await attemptsResponse.json();
      console.log('Attempts data:', attemptsData);
      console.log('Number of attempts found:', attemptsData.attempts?.length || 0);
      
      // Include all attempts, even those with null quizId
      const allAttempts = attemptsData.attempts || [];
      
      console.log('All attempts:', allAttempts);
      console.log('Attempts with quizId:', allAttempts.filter(a => a.quizId).length);
      console.log('Attempts without quizId:', allAttempts.filter(a => !a.quizId).length);
      
      // Sort attempts by most recent first
      const sortedAttempts = allAttempts.sort((a, b) => 
        new Date(b.endTime || b.createdAt) - new Date(a.endTime || a.createdAt)
      );
      
      setAttempts(sortedAttempts);
      setLastRefresh(new Date());
      
      if (!silent) {
        toast.success(`Loaded ${sortedAttempts.length} test results`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      if (!silent) {
        toast.error(`Failed to load test results: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh every 15 seconds for faster updates
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    // Initial data fetch
    fetchData();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      if (!loading) {
        console.log('Auto-refreshing test results...');
        fetchData(true); // Silent refresh
      }
    }, 15000); // 15 seconds for faster updates

    return () => clearInterval(interval);
  }, [isLoaded, user, router, fetchData, loading]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log('Manual refresh triggered');
    await fetchData();
  };

  // Group attempts by quiz
  const attemptsByQuiz = useMemo(() => {
    const grouped = {};
    
    attempts.forEach(attempt => {
      const quizId = attempt.quizId?._id || attempt.quizId || 'no-quiz';
      const quizTitle = attempt.quizId?.quizTitle || 'Unknown Quiz';
      
      if (!grouped[quizId]) {
        grouped[quizId] = {
          quizId,
          quizTitle,
          attempts: [],
          totalAttempts: 0,
          averageScore: 0,
          passedCount: 0
        };
      }
      
      grouped[quizId].attempts.push(attempt);
      grouped[quizId].totalAttempts++;
      
      if (attempt.passed) {
        grouped[quizId].passedCount++;
      }
    });
    
    // Calculate averages
    Object.values(grouped).forEach(quiz => {
      if (quiz.totalAttempts > 0) {
        const totalScore = quiz.attempts.reduce((sum, attempt) => sum + attempt.score, 0);
        quiz.averageScore = Math.round(totalScore / quiz.totalAttempts);
      }
    });
    
    return grouped;
  }, [attempts]);

  const handleEditAttempt = (attempt) => {
    setSelectedAttempt(attempt);
    setEditedAnswers([...attempt.answers]);
    setShowEditModal(true);
  };

  const handleViewDetails = (attempt) => {
    setSelectedAttempt(attempt);
    setShowDetailsModal(true);
  };

  const handleViewQuizDetails = (quizId, quizTitle) => {
    setSelectedQuizForDetails({ quizId, quizTitle });
    setViewMode('details');
  };

  const handleBackToQuizzes = () => {
    setViewMode('quizzes');
    setSelectedQuizForDetails(null);
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
        
        // Update the local state immediately with the new data
        setAttempts(prevAttempts => 
          prevAttempts.map(attempt => 
            attempt._id === selectedAttempt._id 
              ? { 
                  ...attempt, 
                  answers: editedAnswers, 
                  score: newScore, 
                  passed,
                  updatedAt: new Date().toISOString()
                }
              : attempt
          )
        );
        
        // Update the selected attempt for the modal
        setSelectedAttempt(prev => prev ? {
          ...prev,
          answers: editedAnswers,
          score: newScore,
          passed,
          updatedAt: new Date().toISOString()
        } : null);
        
        // Force a refresh to get the latest data
        await fetchData(true);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update results');
      }
    } catch (error) {
      console.error('Error updating attempt:', error);
      toast.error('Failed to update results');
    }
  };

  const exportCSV = () => {
    const currentAttempts = viewMode === 'details' && selectedQuizForDetails 
      ? attemptsByQuiz[selectedQuizForDetails.quizId]?.attempts || []
      : attempts;

    if (!currentAttempts.length) return;
    
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
    
    const rows = currentAttempts.map(attempt => {
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
              {viewMode === 'details' && selectedQuizForDetails && (
                <span className="text-lg text-gray-600">
                  → {selectedQuizForDetails.quizTitle}
                </span>
              )}
              {viewMode === 'quizzes' && (
                <span className="text-lg text-gray-600">
                  → All Results Overview
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Refresh Status */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {lastRefresh && (
                  <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
                )}
                {refreshing && (
                  <div className="flex items-center space-x-1">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                    <span>Refreshing...</span>
                  </div>
                )}
                {!refreshing && lastRefresh && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <span>✓ Live</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleManualRefresh}
                disabled={refreshing}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Refreshing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Refresh</span>
                  </>
                )}
              </button>
              
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
        {viewMode === 'quizzes' ? (
          // Comprehensive Results Table Mode
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">All Test Results</h2>
              <p className="text-gray-600">Complete overview of all quiz attempts from every student/employee</p>
            </div>

            {/* Summary Stats */}
            <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Object.keys(attemptsByQuiz).length}</div>
                  <div className="text-sm text-gray-600">Total Quizzes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{attempts.length}</div>
                  <div className="text-sm text-gray-600">Total Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {attempts.length > 0 ? Math.round((attempts.filter(a => a.passed).length / attempts.length) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Overall Pass Rate</div>
                </div>
              </div>
            </div>

            {/* Comprehensive Results Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quiz Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store Name
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
                        View & Edit
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
                    ) : attempts.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                          No test results found
                        </td>
                      </tr>
                    ) : (
                      attempts.map((attempt) => {
                        const totalMarks = attempt.answers.reduce((sum, answer) => sum + answer.points, 0);
                        const securedMarks = attempt.answers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
                        const quizTitle = attempt.quizId?.quizTitle || 'Unknown Quiz';
                        
                        // Check if this is a recent attempt (within last 5 minutes)
                        const attemptTime = new Date(attempt.endTime || attempt.createdAt);
                        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                        const isRecent = attemptTime > fiveMinutesAgo;
                        
                        return (
                          <tr key={attempt._id} className={`hover:bg-gray-50 ${isRecent ? 'bg-yellow-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                {quizTitle}
                                {isRecent && (
                                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                                    NEW
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {attempt.userName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {attempt.storeName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                              {securedMarks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {totalMarks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
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
                              {new Date(attempt.endTime || attempt.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleViewDetails(attempt)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors text-xs"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleEditAttempt(attempt)}
                                  className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded-lg transition-colors text-xs"
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
          </div>
        ) : (
          // Detailed Responses Mode
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <button
                  onClick={handleBackToQuizzes}
                  className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
                >
                  ← Back to Quiz Overview
                </button>
                <h2 className="text-2xl font-bold text-gray-900">
                  Detailed Responses - {selectedQuizForDetails?.quizTitle}
                </h2>
                <p className="text-gray-600">All user responses for this quiz</p>
              </div>
              
              <div className="text-sm text-gray-600">
                {selectedQuizForDetails && attemptsByQuiz[selectedQuizForDetails.quizId]?.attempts.length || 0} responses
              </div>
            </div>

            {/* Detailed Responses Table */}
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
                        <td colSpan="8" className="px-6 py-4 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
                        </td>
                      </tr>
                    ) : selectedQuizForDetails && attemptsByQuiz[selectedQuizForDetails.quizId]?.attempts.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          No responses found for this quiz
                        </td>
                      </tr>
                    ) : (
                      selectedQuizForDetails && attemptsByQuiz[selectedQuizForDetails.quizId]?.attempts.map((attempt) => {
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
          </div>
        )}
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
                    {selectedAttempt.quiz?.quizTitle || 'Unknown Quiz'} • {new Date(selectedAttempt.endTime).toLocaleDateString()}
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