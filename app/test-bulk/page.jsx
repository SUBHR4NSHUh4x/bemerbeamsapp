'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function TestBulkUpload() {
  const { user } = useUser();
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testBulkUpload = async () => {
    if (!user) {
      setResult('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Create a simple test file
      const testData = [
        {
          Question: 'What is the capital of France?',
          Type: 'mcq',
          Choices: 'Paris, London, Berlin, Madrid',
          CorrectAnswer: 'Paris',
          Explanation: 'Paris is the capital of France',
          Points: '1',
          TimeLimit: '30'
        }
      ];

      // Convert to CSV
      const csvContent = 'Question,Type,Choices,CorrectAnswer,Explanation,Points,TimeLimit\n' +
        testData.map(row => 
          `${row.Question},${row.Type},${row.Choices},${row.CorrectAnswer},${row.Explanation},${row.Points},${row.TimeLimit}`
        ).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('quizTitle', 'Test Quiz');
      formData.append('category', 'General');
      formData.append('difficulty', 'easy');
      formData.append('createdBy', user.id);

      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        setResult(`Success: ${result.message} - Quiz ID: ${result.quizId}`);
      } else {
        setResult(`Error: ${result.error}`);
      }
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Bulk Upload Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="mb-4">User: {user?.firstName} {user?.lastName}</p>
          <p className="mb-4">User ID: {user?.id}</p>
          
          <button
            onClick={testBulkUpload}
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Bulk Upload'}
          </button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 