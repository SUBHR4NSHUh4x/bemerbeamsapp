'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';

export default function TestAccessPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [userInfo, setUserInfo] = useState({
    name: '',
    storeName: '',
    email: '' // Optional for record-keeping
  });
  const [showAccessForm, setShowAccessForm] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quizzes');
      const data = await response.json();
      setQuizzes(data.quizzes || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load available tests');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSelect = (quizId) => {
    setSelectedQuiz(quizId);
    setShowAccessForm(true);
  };

  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInfo.name.trim() || !userInfo.storeName.trim()) {
      toast.error('Please provide your name and store name');
      return;
    }

    if (!selectedQuiz) {
      toast.error('Please select a test');
      return;
    }

    try {
      // Store user info in session storage for the quiz session
      sessionStorage.setItem('quizUserInfo', JSON.stringify(userInfo));
      
      // Redirect to the quiz
      router.push(`/take-quiz/${selectedQuiz}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start test');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-white flex items-center justify-center">
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
                Test Access Portal
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Access Your Test
          </h2>
          <p className="text-xl text-gray-600">
            Enter your details to start your test
          </p>
        </div>

        {!showAccessForm ? (
          /* Quiz Selection */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Available Tests
              </h3>
              
              {quizzes.length === 0 ? (
                <div className="text-center py-8">
                  <Image
                    src="/emptyBox.png"
                    alt="No tests available"
                    width={120}
                    height={120}
                    className="mx-auto mb-4"
                  />
                  <p className="text-gray-500">No tests are currently available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {quizzes.map((quiz) => (
                    <div
                      key={quiz._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-yellow-500 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => handleQuizSelect(quiz._id)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{quiz.quizTitle}</h4>
                          <p className="text-sm text-gray-500">{quiz.category}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Questions:</span>
                          <span>{quiz.quizQuestions?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time Limit:</span>
                          <span>{quiz.timeLimit} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Passing Score:</span>
                          <span>{quiz.passingScore}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <button className="w-full bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors">
                          Start Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Access Form */
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Enter Your Details
                </h3>
                <p className="text-gray-600">
                  Please provide your information to access the test
                </p>
              </div>
              
              <form onSubmit={handleAccessSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    value={userInfo.storeName}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, storeName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter your store name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={userInfo.email}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Enter your email (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email is optional and used only for record-keeping
                  </p>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Start Test
                  </button>
                </div>
              </form>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowAccessForm(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to Test Selection
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 