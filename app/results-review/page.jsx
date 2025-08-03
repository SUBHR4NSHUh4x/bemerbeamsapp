'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

export default function ResultsReviewPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // State management
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [editedAnswers, setEditedAnswers] = useState([]);
  const [savingChanges, setSavingChanges] = useState(false);
  const [viewMode, setViewMode] = useState('quizzes'); // 'quizzes' or 'details'
  const [selectedQuizForDetails, setSelectedQuizForDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingQuiz, setDeletingQuiz] = useState(false);
  const [deletingAttempt, setDeletingAttempt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Data fetching function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      
      console.log('Fetching data with timestamp:', timestamp);
      
      // Add timeout for fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (reduced from 30s)
      
      // Use a more reliable fetch approach with retry logic
      const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
        try {
          const response = await fetch(url, options);
          return response;
        } catch (error) {
          if (retries <= 1) throw error;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`Retrying fetch... Attempts left: ${retries-1}`);
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
      };
      
      const attemptsResponse = await fetchWithRetry(`/api/quiz-attempts/all?t=${timestamp}`, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        next: { revalidate: 0 } // Force revalidation on each request
      });
      
      clearTimeout(timeoutId);
      
      if (!attemptsResponse.ok) {
        const errorText = await attemptsResponse.text();
        console.error('API Error Response:', errorText);
        
        if (attemptsResponse.status === 408) {
          throw new Error('Request timeout. Please try again.');
        } else if (attemptsResponse.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again.');
        } else {
          throw new Error(`Failed to fetch attempts: ${attemptsResponse.status}`);
        }
      }
      
      const attemptsData = await attemptsResponse.json();
      const allAttempts = attemptsData.attempts || [];
      
      console.log('Fetched attempts:', allAttempts);
      if (allAttempts.length > 0) {
        console.log('Sample attempt structure:', allAttempts[0]);
        console.log('Sample attempt answers:', allAttempts[0].answers);
        console.log('Sample attempt answers length:', allAttempts[0].answers?.length);
        console.log('Sample attempt _id type:', typeof allAttempts[0]._id);
      }
      
      // Sort attempts by most recent first
      const sortedAttempts = allAttempts.sort((a, b) => 
        new Date(b.endTime || b.createdAt) - new Date(a.endTime || a.createdAt)
      );
      
      setAttempts(sortedAttempts);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      
      if (error.name === 'AbortError') {
        toast.error('Request timeout. Please try again.');
      } else {
        toast.error(error.message || 'Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data on component mount
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
      return;
    }

    // Initial fetch with retry mechanism
    const initialFetch = async () => {
      let retries = 3;
      while (retries > 0) {
        try {
          await fetchData();
          break; // Success, exit retry loop
        } catch (error) {
          retries--;
          if (retries === 0) {
            console.error('Failed to fetch data after 3 retries');
            toast.error('Failed to load data. Please refresh the page.');
          } else {
            console.log(`Retrying fetch... ${3 - retries}/3`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
          }
        }
      }
    };

    initialFetch();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(() => {
      if (isLoaded && user) {
        console.log('Auto-refreshing data...');
        fetchData();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isLoaded, user, router, fetchData]);

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

  // Filter attempts based on search
  const filteredAttempts = useMemo(() => {
    let filtered = attempts;
    
    if (viewMode === 'details' && selectedQuizForDetails) {
      filtered = attemptsByQuiz[selectedQuizForDetails.quizId]?.attempts || [];
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(attempt => 
        attempt.userName.toLowerCase().includes(term) ||
        (attempt.storeName && attempt.storeName.toLowerCase().includes(term)) ||
        (attempt.userEmail && attempt.userEmail.toLowerCase().includes(term)) ||
        (attempt.quizId?.quizTitle && attempt.quizId.quizTitle.toLowerCase().includes(term))
      );
    }
    
    return filtered;
  }, [attempts, viewMode, selectedQuizForDetails, attemptsByQuiz, searchTerm]);

  // Navigation handlers
  const handleBackToQuizzes = () => {
    setViewMode('quizzes');
    setSelectedQuizForDetails(null);
  };

  const handleEditAttempt = (attempt) => {
    console.log('Opening edit modal for attempt:', attempt);
    console.log('Attempt _id:', attempt._id);
    console.log('Attempt answers:', attempt.answers);
    console.log('Attempt answers type:', typeof attempt.answers);
    console.log('Attempt answers length:', attempt.answers?.length);
    
    if (!attempt.answers || attempt.answers.length === 0) {
      toast.error('No answers found for this attempt');
      return;
    }
    
    // Check if answers is an array
    if (!Array.isArray(attempt.answers)) {
      console.error('Answers is not an array:', attempt.answers);
      toast.error('Invalid answer format');
      return;
    }
    
    // Ensure all required fields are present in answers
    const validatedAnswers = attempt.answers.map((answer, index) => ({
      questionId: answer.questionId || `question_${index}`,
      questionText: answer.questionText || 'Question ' + (index + 1),
      studentAnswer: answer.studentAnswer || '',
      correctAnswer: answer.correctAnswer || '',
      points: answer.points || 1,
      isCorrect: answer.isCorrect || false,
      timeSpent: answer.timeSpent || 0
    }));
    
    console.log('Validated answers:', validatedAnswers);
    
    setSelectedAttempt(attempt);
    setEditedAnswers(validatedAnswers);
    setShowEditModal(true);
    
    // Test if modal state is set
    setTimeout(() => {
      console.log('Modal state after setting:', { showEditModal, selectedAttempt: attempt });
    }, 100);
  };

  // Delete functionality
  const handleDeleteQuiz = (quizId, quizTitle) => {
    setItemToDelete({ type: 'quiz', id: quizId, title: quizTitle });
    setShowDeleteConfirm(true);
  };

  const handleDeleteAttempt = (attempt) => {
    setItemToDelete({ 
      type: 'attempt', 
      id: attempt._id, 
      title: `${attempt.userName} - ${attempt.quizId?.quizTitle || 'Unknown Quiz'}`
    });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      // Retry function for API calls
      const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
        try {
          const response = await fetch(url, options);
          return response;
        } catch (error) {
          if (retries <= 1) throw error;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`Retrying delete... Attempts left: ${retries-1}`);
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
      };

      // Add timeout for delete requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      if (itemToDelete.type === 'quiz') {
        setDeletingQuiz(true);
        console.log('Deleting quiz with ID:', itemToDelete.id);
        
        const response = await fetchWithRetry(`/api/quizzes?id=${itemToDelete.id}`, {
          method: 'DELETE',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          next: { revalidate: 0 } // Force revalidation
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          toast.success(`Quiz "${itemToDelete.title}" deleted successfully`);
          // Update local state immediately to improve perceived performance
          setAttempts(prevAttempts => 
            prevAttempts.filter(attempt => 
              attempt.quizId?._id !== itemToDelete.id && attempt.quizId !== itemToDelete.id
            )
          );
          await fetchData(); // Refresh data
        } else {
          const errorData = await response.text();
          console.error('Delete quiz failed:', response.status, errorData);
          toast.error('Failed to delete quiz. Please try again.');
        }
      } else if (itemToDelete.type === 'attempt') {
        setDeletingAttempt(true);
        console.log('Deleting attempt with ID:', itemToDelete.id);
        
        const response = await fetchWithRetry(`/api/quiz-attempts/${itemToDelete.id}`, {
          method: 'DELETE',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
          next: { revalidate: 0 } // Force revalidation
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          toast.success(`Attempt "${itemToDelete.title}" deleted successfully`);
          // Update local state immediately to improve perceived performance
          setAttempts(prevAttempts => 
            prevAttempts.filter(attempt => attempt._id !== itemToDelete.id)
          );
          await fetchData(); // Refresh data
        } else {
          const errorData = await response.text();
          console.error('Delete attempt failed:', response.status, errorData);
          toast.error('Failed to delete attempt. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      
      if (error.name === 'AbortError') {
        toast.error('Request timeout. Please try again.');
      } else {
        toast.error(error.message || 'Failed to delete item');
      }
    } finally {
      setDeletingQuiz(false);
      setDeletingAttempt(false);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  // Manual grading handlers
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
    if (!selectedAttempt) return;
    
    setSavingChanges(true);
    
    try {
      console.log('Saving changes for attempt:', selectedAttempt._id);
      console.log('Edited answers:', editedAnswers);
      
      // Validate editedAnswers exists and is an array
      if (!editedAnswers || !Array.isArray(editedAnswers) || editedAnswers.length === 0) {
        toast.error('No answers to save. Please try again.');
        setSavingChanges(false);
        return;
      }
      
      // Calculate new score with proper validation and debugging
      let totalPoints = 0;
      let earnedPoints = 0;
      
      editedAnswers.forEach((answer, index) => {
        const points = Number(answer.points) || 0;
        const isCorrect = Boolean(answer.isCorrect);
        
        console.log(`Answer ${index + 1}:`, { points, isCorrect, studentAnswer: answer.studentAnswer });
        
        totalPoints += points;
        if (isCorrect) {
          earnedPoints += points;
        }
      });
      
      console.log('Raw calculation:', { totalPoints, earnedPoints });
      
      // Ensure we don't divide by zero and handle edge cases
      let newScore = 0;
      if (totalPoints > 0) {
        newScore = Math.round((earnedPoints / totalPoints) * 100);
      }
      
      // Ensure score is a valid number between 0 and 100
      newScore = Math.max(0, Math.min(100, newScore));
      
      // Additional validation
      if (isNaN(newScore) || !isFinite(newScore)) {
        console.error('Invalid score calculated:', newScore);
        toast.error('Invalid score calculation. Please try again.');
        setSavingChanges(false);
        return;
      }
      
      const passed = newScore >= (selectedAttempt.quizId?.passingScore || 70);

      console.log('Final calculation:', { 
        totalPoints, 
        earnedPoints, 
        newScore, 
        passed,
        scoreType: typeof newScore,
        isNaN: isNaN(newScore)
      });

      // Final validation before sending
      if (typeof newScore !== 'number' || isNaN(newScore)) {
        toast.error('Invalid score calculation. Please try again.');
        setSavingChanges(false);
        return;
      }

      // Debug: Test score calculation on server side (optional for Vercel)
      try {
        const debugResponse = await fetch('/api/debug-score', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ answers: editedAnswers }),
          cache: 'no-store'
        });
        
        if (debugResponse.ok) {
          const debugResult = await debugResponse.json();
          console.log('Debug score calculation result:', debugResult);
          
          if (!debugResult.isValid) {
            console.error('Server-side score validation failed:', debugResult);
            // Don't fail the request, just log the warning
            console.warn('Score validation warning, continuing with request');
          }
        }
      } catch (debugError) {
        console.error('Debug score calculation failed:', debugError);
        // Continue with the main request even if debug fails
      }

      const updatedAttempt = {
        answers: editedAnswers,
        score: newScore,
        passed: Boolean(passed),
      };

      console.log('Sending update request with data:', updatedAttempt);

      // Add timeout for update request with retry logic
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout (reduced from 30s)

      // Retry function for API calls
      const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
        try {
          const response = await fetch(url, options);
          return response;
        } catch (error) {
          if (retries <= 1) throw error;
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`Retrying update... Attempts left: ${retries-1}`);
          return fetchWithRetry(url, options, retries - 1, delay * 1.5);
        }
      };

      const response = await fetchWithRetry(`/api/quiz-attempts/${selectedAttempt._id}`, {
        method: 'PUT',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(updatedAttempt),
        next: { revalidate: 0 } // Force revalidation
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Update response:', responseData);
        
        toast.success(`Results updated successfully! New score: ${newScore}% (${passed ? 'Passed' : 'Failed'})`);
        setShowEditModal(false);
        
        // Update local state immediately
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
        
        // Force re-render by updating view mode and refresh data
        if (viewMode === 'details') {
          setViewMode('quizzes');
          setTimeout(() => {
            setViewMode('details');
            fetchData(); // Refresh data after successful update
          }, 100);
        } else {
          // Refresh data if not in details view
          fetchData();
        }
      } else {
        const errorData = await response.text();
        console.error('Update failed:', response.status, errorData);
        
        let errorMessage = 'Failed to update results';
        
        if (response.status === 408) {
          errorMessage = 'Request timeout. Please try again.';
        } else if (response.status === 503) {
          errorMessage = 'Service temporarily unavailable. Please try again.';
        } else if (response.status === 400) {
          try {
            const errorJson = JSON.parse(errorData);
            errorMessage = errorJson.error || 'Invalid request data';
          } catch {
            errorMessage = 'Invalid request data';
          }
        } else if (response.status === 404) {
          errorMessage = 'Attempt not found. Please refresh the page.';
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      
      if (error.name === 'AbortError') {
        toast.error('Request timeout. Please try again.');
      } else {
        toast.error(error.message || 'Failed to save changes');
      }
    } finally {
      setSavingChanges(false);
    }
  };

  // Loading state
  if (!isLoaded || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white">
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
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
                Results/Review Panel
              </h1>
              {viewMode === 'details' && selectedQuizForDetails && (
                <span className="text-lg text-gray-600">
                  → {selectedQuizForDetails.quizTitle}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchData}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="bg-yellow-500 text-black px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Admin Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
          </div>
        ) : viewMode === 'quizzes' ? (
          // Quiz Overview Mode
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Overview</h2>
              <p className="text-gray-600">Click on any quiz to view detailed responses and manually grade student answers</p>
            </div>

            {/* Quiz Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(attemptsByQuiz).map((quiz) => (
                <div key={quiz.quizId} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{quiz.quizTitle}</h3>
                    <span className="text-sm text-gray-500">ID: {quiz.quizId}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Attempts:</span>
                      <span className="font-semibold">{quiz.totalAttempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Score:</span>
                      <span className="font-semibold">{quiz.averageScore}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Passed:</span>
                      <span className="font-semibold text-green-600">{quiz.passedCount}/{quiz.totalAttempts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pass Rate:</span>
                      <span className="font-semibold">
                        {quiz.totalAttempts > 0 ? Math.round((quiz.passedCount / quiz.totalAttempts) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                  
                                      <div className="mt-4 space-y-2">
                      <button
                        onClick={() => {
                          setSelectedQuizForDetails({ quizId: quiz.quizId, quizTitle: quiz.quizTitle });
                          setViewMode('details');
                        }}
                        className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        Review Responses ({quiz.totalAttempts})
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.quizId, quiz.quizTitle)}
                        className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete Quiz
                      </button>
                    </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
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
                  Review Responses - {selectedQuizForDetails?.quizTitle}
                </h2>
                <p className="text-gray-600">View and manually grade student responses</p>
              </div>
              
              <div className="text-sm text-gray-600">
                {selectedQuizForDetails && attemptsByQuiz[selectedQuizForDetails.quizId]?.attempts.length || 0} responses
              </div>
            </div>

            {/* Search Filter */}
            <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
              <input
                type="text"
                placeholder="Search by name, store, email, or quiz title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Detailed Responses Table */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Store Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
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
                    {filteredAttempts.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                          {searchTerm 
                            ? 'No results match your search criteria' 
                            : 'No responses found for this quiz'}
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {attempt.userEmail || 'N/A'}
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
                                   onClick={() => handleEditAttempt(attempt)}
                                   className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded-lg transition-colors"
                                 >
                                   View & Edit
                                 </button>
                                 <button
                                   onClick={() => handleDeleteAttempt(attempt)}
                                   className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors"
                                 >
                                   Delete
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

            {/* Edit Modal */}
      {showEditModal && selectedAttempt && editedAnswers && editedAnswers.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          {(() => {
            console.log('Rendering modal with selectedAttempt:', selectedAttempt);
            console.log('Edited answers:', editedAnswers);
            return null;
          })()}
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manual Grading - {selectedAttempt.userName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAttempt.quizId?.quizTitle || 'Unknown Quiz'} • {new Date(selectedAttempt.endTime).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Store: {selectedAttempt.storeName || 'N/A'} • Email: {selectedAttempt.userEmail || 'N/A'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    console.log('Closing modal');
                    setShowEditModal(false);
                    setSelectedAttempt(null);
                    setEditedAnswers([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Current Score Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Current Score:</span>
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
                    <span className="font-medium text-gray-700">Questions:</span>
                    <span className="ml-2">{selectedAttempt.answers?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {editedAnswers && editedAnswers.length > 0 ? (
                  editedAnswers.map((answer, index) => (
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
                            {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
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
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No answers found for this attempt
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    console.log('Canceling modal');
                    setShowEditModal(false);
                    setSelectedAttempt(null);
                    setEditedAnswers([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={savingChanges}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {savingChanges ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Delete
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete &quot;{itemToDelete.title}&quot;? This action cannot be undone.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deletingQuiz || deletingAttempt}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {(deletingQuiz || deletingAttempt) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
