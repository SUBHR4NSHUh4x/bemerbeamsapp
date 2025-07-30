'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserProfile } from '../Components/UserProfileProvider';

export default function TestRoleChange() {
  const { user } = useUser();
  const { userProfile, updateUserProfile, loading } = useUserProfile();
  const [result, setResult] = useState('');
  const [updating, setUpdating] = useState(false);

  const testRoleChange = async (newRole) => {
    if (!user) {
      setResult('User not authenticated');
      return;
    }

    setUpdating(true);
    try {
      const updatedProfile = await updateUserProfile({ role: newRole });
      setResult(`Success: Role changed to ${newRole}. Profile: ${JSON.stringify(updatedProfile, null, 2)}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Role Change Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="mb-4">User: {user?.firstName} {user?.lastName}</p>
          <p className="mb-4">User ID: {user?.id}</p>
          <p className="mb-4">Current Role: {userProfile?.role || 'Not set'}</p>
          <p className="mb-4">Loading: {loading ? 'Yes' : 'No'}</p>
          
          <div className="space-y-2">
            <button
              onClick={() => testRoleChange('student')}
              disabled={updating}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 mr-2"
            >
              Set to Employees
            </button>
            
            <button
              onClick={() => testRoleChange('admin')}
              disabled={updating}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Set to Admin
            </button>
          </div>
          
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