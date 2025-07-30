'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faUsers, 
  faQuestionCircle, 
  faClock, 
  faTrophy,
  faEye,
  faDownload
} from '@fortawesome/free-solid-svg-icons';
import QuizResultsViewer from './QuizResultsViewer';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y
  const [selectedQuiz, setSelectedQuiz] = useState('all');
  // New state for results viewer
  const [showResultsViewer, setShowResultsViewer] = useState(false);
  const [selectedQuizForResults, setSelectedQuizForResults] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, selectedQuiz]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}&quizId=${selectedQuiz}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handler to open results viewer
  const handleViewResults = (quizId) => {
    setSelectedQuizForResults(quizId);
    setShowResultsViewer(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Dashboard</h1>
        
        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          >
            <option value="all">All Quizzes</option>
            {analytics.quizzes?.map(quiz => (
              <option key={quiz._id} value={quiz._id}>{quiz.quizTitle}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Attempts"
          value={analytics.totalAttempts}
          icon={faUsers}
          color="blue"
          change={analytics.attemptsChange}
        />
        <MetricCard
          title="Average Score"
          value={`${analytics.averageScore}%`}
          icon={faChartLine}
          color="green"
          change={analytics.scoreChange}
        />
        <MetricCard
          title="Pass Rate"
          value={`${analytics.passRate}%`}
          icon={faTrophy}
          color="yellow"
          change={analytics.passRateChange}
        />
        <MetricCard
          title="Avg. Time"
          value={`${analytics.averageTime} min`}
          icon={faClock}
          color="purple"
          change={analytics.timeChange}
        />
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Score Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Score Distribution</h2>
          <ScoreDistributionChart data={analytics.scoreDistribution} />
        </div>

        {/* Performance Over Time */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Over Time</h2>
          <PerformanceChart data={analytics.performanceOverTime} />
        </div>
      </div>

      {/* Quiz Performance Table */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quiz Performance</h2>
          <button
            onClick={() => exportData()}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors flex items-center"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            Export Data
          </button>
        </div>
        <QuizPerformanceTable data={analytics.quizPerformance} onViewResults={handleViewResults} />
      </div>

      {/* Employee Performance */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
        <EmployeePerformanceTable data={analytics.topPerformers} />
      </div>
      {showResultsViewer && (
        <QuizResultsViewer
          quizId={selectedQuizForResults}
          onClose={() => setShowResultsViewer(false)}
        />
      )}
    </div>
  );
}

function MetricCard({ title, value, icon, color, change }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}% from last period
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]} text-white`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
    </div>
  );
}

function ScoreDistributionChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-16 text-sm text-gray-600">{item.range}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-4">
            <div
              className="bg-yellow-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${(item.count / maxValue) * 100}%` }}
            ></div>
          </div>
          <div className="w-12 text-sm text-gray-600 text-right">{item.count}</div>
        </div>
      ))}
    </div>
  );
}

function PerformanceChart({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  return (
    <div className="h-64 flex items-end space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-yellow-500 rounded-t transition-all duration-300"
            style={{ height: `${(item.score / 100) * 200}px` }}
          ></div>
          <div className="text-xs text-gray-600 mt-2">{item.date}</div>
        </div>
      ))}
    </div>
  );
}

function QuizPerformanceTable({ data, onViewResults }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quiz
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Attempts
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Pass Rate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((quiz, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{quiz.quizTitle}</div>
                <div className="text-sm text-gray-500">{quiz.category}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {quiz.attempts}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{quiz.averageScore}%</div>
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${quiz.averageScore}%` }}
                  ></div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {quiz.passRate}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {quiz.averageTime} min
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button className="text-yellow-600 hover:text-yellow-900 mr-3" onClick={() => onViewResults && onViewResults(quiz._id)}>
                  <FontAwesomeIcon icon={faEye} />
                </button>
                <button className="text-blue-600 hover:text-blue-900">
                  <FontAwesomeIcon icon={faDownload} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeePerformanceTable({ data }) {
  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data available</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quizzes Taken
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Avg Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Best Score
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Time
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((employee, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {index < 3 ? (
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-900">{index + 1}</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                <div className="text-sm text-gray-500">{employee.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.quizzesTaken}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.averageScore}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.bestScore}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {employee.totalTime} min
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function exportData() {
  // Implementation for exporting analytics data
  console.log('Exporting analytics data...');
} 