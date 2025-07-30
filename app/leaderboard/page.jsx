import React from 'react';

export default function LeaderboardComingSoon() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-50 to-white">
      <div className="text-6xl mb-4 animate-bounce">🏆</div>
      <h1 className="text-3xl font-bold text-purple-700 mb-2">Leaderboard</h1>
      <p className="text-lg text-gray-600 mb-6">This feature is <span className="font-semibold text-purple-500">coming soon</span>!</p>
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <p className="text-gray-700 mb-2">See how you rank against other students here soon.</p>
        <p className="text-gray-400 italic">Competitive spirit incoming! 🥇</p>
      </div>
    </div>
  );
}