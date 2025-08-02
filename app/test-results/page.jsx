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
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [editedAnswers, setEditedAnswers] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [savingChanges, setSavingChanges] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      const timestamp = Date.now();
      
      // Fetch quizzes first
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
      setQuizzes(quizzesData.quizzes || []);

      // Fetch attempts with aggressive cache busting
      const attemptsResponse = await fetch(`/api/quiz-attempts/all?t=${timestamp}&v=${Math.random()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!attemptsResponse.ok) {
        throw new Error(`Failed to fetch attempts: ${attemptsResponse.status}`);
      }
      
      const attemptsData = await attemptsResponse.json();
      const allAttempts = attemptsData.attempts || [];
      
      console.log('Fetched attempts:', allAttempts.length);
      console.log('Latest attempt:', allAttempts[0]);
      
      // Sort attempts by most recent first (endTime, then createdAt, then _id)
      const sortedAttempts = allAttempts.sort((a, b) => {
        const dateA = new Date(b.endTime || b.createdAt || b._id);
        const dateB = new Date(a.endTime || a.createdAt || a._id);
        return dateA - dateB;
      });
      
      setAttempts(sortedAttempts);
      setLastRefresh(new Date());
      
      // Only show success toast on manual refresh, not on silent refresh
      if (!silent) {
        toast.success(`Loaded ${sortedAttempts.length} test results`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // Only show error toast on manual refresh, not on silent refresh
      if (!silent) {
        toast.error(`Failed to load test results: ${error.message}`);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    // Fetch data on component mount
    fetchData();

    // Set up periodic refresh every 60 seconds (silent refresh)
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchData(true);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [isLoaded, user, router, fetchData, loading, refreshing]);

  const handleManualRefresh = async () => {
    await fetchData();
  };

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

  const handleAnswerToggle = (answerIndex, isCorrect) => {
    setEditedAnswers(prev => 
      prev.map((answer, index) => 
        index === answerIndex 
          ? { ...answer, isCorrect, points: isCorrect ? answer.points : 0 }
          : answer
      )
    );
  };

  // Enhanced save function with better error handling and user feedback
  const handleSaveChanges = async () => {
    if (!selectedAttempt) return;
    
    setSavingChanges(true);
    
    try {
      const totalPoints = editedAnswers.reduce((sum, answer) => sum + answer.points, 0);
      const earnedPoints = editedAnswers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
      const newScore = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = newScore >= (selectedAttempt.quizId?.passingScore || 70);

      const updatedAttempt = {
        ...selectedAttempt,
        answers: editedAnswers,
        score: newScore,
        passed,
        lastModified: new Date().toISOString(),
        modifiedBy: user?.id || 'admin'
      };

      const response = await fetch(`/api/quiz-attempts/${selectedAttempt._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedAttempt),
      });

      if (response.ok) {
        toast.success('Results updated successfully! 🎉');
        setShowEditModal(false);
        
        // Update local state immediately for better UX
        setAttempts(prevAttempts => 
          prevAttempts.map(attempt => 
            attempt._id === selectedAttempt._id 
              ? { 
                  ...attempt, 
                  answers: editedAnswers, 
                  score: newScore, 
                  passed,
                  lastModified: new Date().toISOString(),
                  modifiedBy: user?.id || 'admin'
                }
              : attempt
          )
        );
        
        // Refresh data silently after update to ensure consistency
        setTimeout(() => fetchData(true), 1000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update results');
      }
    } catch (error) {
      console.error('Error updating attempt:', error);
      toast.error('Failed to update results. Please try again.');
    } finally {
      setSavingChanges(false);
    }
  };

  const exportCSV = () => {
    if (!attempts.length) {
      toast.error('No data to export');
      return;
    }
    
    const header = [
      'Employee Name',
      'Store Name', 
      'Quiz Title',
      'Marks Secured',
      'Total Marks',
      'Percentage',
      'Status',
      'Date Completed',
      'Duration (minutes)',
      'Last Modified',
      'Modified By'
    ];
    
    const rows = attempts.map(attempt => {
      const totalMarks = attempt.answers.reduce((sum, answer) => sum + answer.points, 0);
      const securedMarks = attempt.answers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
      
      return [
        attempt.userName || 'N/A',
        attempt.storeName || 'N/A',
        attempt.quizId?.quizTitle || 'N/A',
        securedMarks,
        totalMarks,
        `${attempt.score}%`,
        attempt.passed ? 'Passed' : 'Failed',
        new Date(attempt.endTime || attempt.createdAt).toLocaleDateString(),
        Math.round((attempt.duration || 0) / 60),
        attempt.lastModified ? new Date(attempt.lastModified).toLocaleDateString() : 'N/A',
        attempt.modifiedBy || 'System'
      ];
    });
    
    const csvContent = [header, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-results-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('CSV exported successfully! 📊');
  };

  // Calculate live preview scores in modal
  const calculateLivePreview = () => {
    if (!editedAnswers.length) return { score: 0, passed: false };
    
    const totalPoints = editedAnswers.reduce((sum, answer) => sum + answer.points, 0);
    const earnedPoints = editedAnswers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= (selectedAttempt?.quizId?.passingScore || 70);
    
    return { score, passed, earnedPoints, totalPoints };
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
                disabled={!attempts.length}
                className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📊 Export CSV
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Filter */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Filter by Quiz:</label>
            <select
              value={selectedQuiz}
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Quizzes ({attempts.length} results)</option>
              {Object.values(attemptsByQuiz).map((quiz) => (
                <option key={quiz.quizId} value={quiz.quizId}>
                  {quiz.quizTitle} ({quiz.totalAttempts} attempts)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mb-6 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Overall Statistics</h3>
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                        <span className="text-gray-500">Loading test results...</span>
                      </div>
                    </td>
                  </tr>
                ) : attempts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                      <div className="flex flex-col items-center space-y-2">
                        <span className="text-2xl">📝</span>
                        <span>No test results found</span>
                        <button 
                          onClick={handleManualRefresh}
                          className="text-blue-500 hover:text-blue-700 underline"
                        >
                          Refresh to check for new results
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  attempts
                    .filter(attempt => selectedQuiz === 'all' || attempt.quizId?._id === selectedQuiz)
                    .map((attempt) => {
                      const totalMarks = attempt.answers.reduce((sum, answer) => sum + answer.points, 0);
                      const securedMarks = attempt.answers.reduce((sum, answer) => sum + (answer.isCorrect ? answer.points : 0), 0);
                      const quizTitle = attempt.quizId?.quizTitle || 'Unknown Quiz';
                      
                      const attemptTime = new Date(attempt.endTime || attempt.createdAt);
                      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                      const isRecent = attemptTime > fiveMinutesAgo;
                      const isModified = attempt.lastModified;
                      
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
                              {isModified && (
                                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                  EDITED
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {attempt.userName || 'N/A'}
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
                              {attempt.passed ? '✅ Passed' : '❌ Failed'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              {new Date(attempt.endTime || attempt.createdAt).toLocaleString()}
                              {isModified && (
                                <div className="text-xs text-blue-600">
                                  Modified: {new Date(attempt.lastModified).toLocaleString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditAttempt(attempt)}
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded-lg transition-colors text-xs font-medium"
                            >
                              <span>👁️</span>
                              <span>View & Edit</span>
                            </button>
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

      {/* Enhanced Edit Modal with Live Preview */}
      {showEditModal && selectedAttempt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    ✏️ Manual Correction - {selectedAttempt.userName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAttempt.quizId?.quizTitle || 'Unknown Quiz'} • {new Date(selectedAttempt.endTime).toLocaleDateString()}
                  </p>
                </div>
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
              {/* Live Preview Summary */}
              {(() => {
                const livePreview = calculateLivePreview();
                return (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">📊 Live Preview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Original Score:</span>
                        <span className="ml-2 font-bold text-lg text-gray-600">{selectedAttempt.score}%</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">New Score:</span>
                        <span className={`ml-2 font-bold text-lg ${
                          livePreview.score > selectedAttempt.score ? 'text-green-600' : 
                          livePreview.score < selectedAttempt.score ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {livePreview.score}%
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">New Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                          livePreview.passed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {livePreview.passed ? '✅ Passed' : '❌ Failed'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Points:</span>
                        <span className="ml-2">{livePreview.earnedPoints}/{livePreview.totalPoints}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Store:</span>
                        <span className="ml-2">{selectedAttempt.storeName || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Questions and Answers with Manual Correction */}
              <div className="space-y-4">
                {editedAnswers.map((answer, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900">
                        Question {index + 1} of {editedAnswers.length}
                      </h4>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">
                          Points: {answer.points}
                        </span>
                        <button
                          onClick={() => handleAnswerToggle(index, !answer.isCorrect)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                            answer.isCorrect
                              ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-200 shadow-lg'
                              : 'bg-red-500 text-white hover:bg-red-600 shadow-red-200 shadow-lg'
                          }`}
                        >
                          {answer.isCorrect ? '✅ Correct' : '❌ Incorrect'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Question:</span>
                        <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded border-l-4 border-gray-300">
                          {answer.questionText}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">Student&apos;s Answer:</span>
                        <p className="text-sm text-gray-900 mt-1 p-3 bg-blue-50 rounded border-l-4 border-blue-300">
                          {answer.studentAnswer || 'No answer provided'}
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-700">Correct Answer:</span>
                        <p className="text-sm text-gray-900 mt-1 p-3 bg-green-50 rounded border-l-4 border-green-300">
                          {answer.correctAnswer}
                        </p>
                      </div>
                      
                      {/* Answer comparison indicator */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-500">Similarity:</span>
                        <div className={`px-2 py-1 rounded-full ${
                          answer.studentAnswer && answer.correctAnswer && 
                          answer.studentAnswer.toLowerCase().includes(answer.correctAnswer.toLowerCase())
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {answer.studentAnswer && answer.correctAnswer && 
                           answer.studentAnswer.toLowerCase().includes(answer.correctAnswer.toLowerCase())
                            ? 'Partial Match Detected' 
                            : 'Manual Review Required'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  💡 Tip: Click the Correct/Incorrect buttons to override automatic grading for acceptable answers that don&apos;t exactly match.
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={savingChanges}
                    className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {savingChanges ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <span>💾</span>
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}