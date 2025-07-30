import React from 'react';

export default function MyProgressComingSoon() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-white">
      <div className="text-6xl mb-4 animate-bounce">🚧</div>
      <h1 className="text-3xl font-bold text-green-700 mb-2">My Progress</h1>
      <p className="text-lg text-gray-600 mb-6">This feature is <span className="font-semibold text-green-500">under creative development</span>!</p>
      <div className="bg-white rounded-xl shadow-lg p-6 text-center">
        <p className="text-gray-700 mb-2">Track your quiz performance, stats, and achievements here soon.</p>
        <p className="text-gray-400 italic">Stay tuned for something awesome! 🌟</p>
      </div>
    </div>
  );
}