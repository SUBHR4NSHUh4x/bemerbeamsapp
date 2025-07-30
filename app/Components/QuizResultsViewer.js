import { useState, useEffect } from 'react';

export default function QuizResultsViewer({ quizId, onClose }) {
  const [attempts, setAttempts] = useState([]);
  const [quizInfo, setQuizInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    fetch(`/api/quiz-attempts?quizId=${quizId}`)
      .then(res => res.json())
      .then(data => {
        setAttempts(data.attempts || []);
        setQuizInfo(data.quiz || null);
      })
      .finally(() => setLoading(false));
  }, [quizId]);

  const exportCSV = () => {
    if (!attempts.length) return;
    const header = [
      'Student Name', 'Email', 'Score', 'Date', 'Duration (s)', 'Passed'
    ];
    const rows = attempts.map(a => [
      a.userName, a.userEmail, a.score, new Date(a.endTime).toLocaleString(), a.duration, a.passed ? 'Yes' : 'No'
    ]);
    let csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quizInfo?.quizTitle || 'quiz'}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-10 overflow-y-auto max-h-[90vh] transition-all duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-yellow-500 text-2xl font-bold focus:outline-none"
          aria-label="Close"
        >
          ×
        </button>
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            Quiz Results
            <span className="text-base font-medium text-gray-500">{quizInfo?.quizTitle}</span>
          </h2>
          <div className="text-sm text-gray-500 flex flex-wrap gap-4">
            <span>Category: {quizInfo?.category}</span>
            <span>Difficulty: {quizInfo?.difficulty}</span>
            <span>Time Limit: {quizInfo?.timeLimit} min</span>
          </div>
        </div>
        {/* Export */}
        <div className="flex justify-end mb-2">
          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors font-medium shadow"
          >
            Export CSV
          </button>
        </div>
        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm md:text-base">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Student</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-center">Score</th>
                <th className="px-4 py-2 text-center">Date</th>
                <th className="px-4 py-2 text-center">Duration</th>
                <th className="px-4 py-2 text-center">Passed</th>
                <th className="px-4 py-2 text-center">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
              ) : attempts.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No attempts found.</td></tr>
              ) : attempts.map((a, idx) => (
                <>
                  <tr key={a._id} className="hover:bg-yellow-50 transition cursor-pointer">
                    <td className="px-4 py-2 font-medium">{a.userName}</td>
                    <td className="px-4 py-2">{a.userEmail}</td>
                    <td className="px-4 py-2 text-center font-bold text-green-700">{a.score}%</td>
                    <td className="px-4 py-2 text-center">{new Date(a.endTime).toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">{a.duration}s</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${a.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.passed ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="text-yellow-600 hover:text-yellow-800 font-bold text-lg focus:outline-none"
                        onClick={() => setExpanded(expanded === idx ? null : idx)}
                        aria-label="View Details"
                      >
                        {expanded === idx ? '−' : '+'}
                      </button>
                    </td>
                  </tr>
                  {expanded === idx && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="p-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs md:text-sm">
                            <thead>
                              <tr>
                                <th className="px-2 py-1 text-left">#</th>
                                <th className="px-2 py-1 text-left">Question</th>
                                <th className="px-2 py-1 text-left">Student Answer</th>
                                <th className="px-2 py-1 text-left">Correct Answer</th>
                                <th className="px-2 py-1 text-center">Points</th>
                                <th className="px-2 py-1 text-center">Time Spent (s)</th>
                                <th className="px-2 py-1 text-center">Correct?</th>
                              </tr>
                            </thead>
                            <tbody>
                              {a.answers?.map((ans, qidx) => (
                                <tr key={qidx}>
                                  <td className="px-2 py-1">{qidx + 1}</td>
                                  <td className="px-2 py-1 max-w-xs truncate" title={ans.questionText}>{ans.questionText}</td>
                                  <td className="px-2 py-1">{ans.studentAnswer}</td>
                                  <td className="px-2 py-1">{ans.correctAnswer}</td>
                                  <td className="px-2 py-1 text-center">{ans.points}</td>
                                  <td className="px-2 py-1 text-center">{ans.timeSpent}</td>
                                  <td className="px-2 py-1 text-center">
                                    {ans.isCorrect ? (
                                      <span className="text-green-600 font-bold">✔</span>
                                    ) : (
                                      <span className="text-red-600 font-bold">✘</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}