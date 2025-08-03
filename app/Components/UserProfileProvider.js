'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

const UserProfileContext = createContext();

export function UserProfileProvider({ children }) {
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const fetchOrCreateUserProfile = async () => {
      try {
        console.log('Fetching user profile for:', user.id);
        
        // First try to fetch existing profile
        const response = await fetch(`/api/user-profile?clerkUserId=${user.id}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Found existing profile:', data.userProfile);
          setUserProfile(data.userProfile);
        } else if (response.status === 404) {
          console.log('Profile not found, creating new one');
          // Profile doesn't exist, create one
          const createResponse = await fetch('/api/user-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clerkUserId: user.id,
              email: user.emailAddresses[0]?.emailAddress || '',
              firstName: user.firstName || '',
              lastName: user.lastName || '',
              role: 'student', // Default role
            }),
          });

          if (createResponse.ok) {
            const data = await createResponse.json();
            console.log('Created new profile:', data.userProfile);
            setUserProfile(data.userProfile);
          } else {
            console.error('Failed to create profile:', createResponse.status);
          }
        } else {
          console.error('Failed to fetch profile:', response.status);
          // Set a default profile to prevent infinite loading
          setUserProfile({
            clerkUserId: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: 'student'
          });
        }
      } catch (error) {
        console.error('Error managing user profile:', error);
        // Set a default profile to prevent infinite loading
        setUserProfile({
          clerkUserId: user.id,
          email: user.emailAddresses[0]?.emailAddress || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: 'student'
        });
      } finally {
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('UserProfileProvider timeout - setting loading to false');
      setLoading(false);
    }, 10000); // 10 second timeout

    fetchOrCreateUserProfile();

    return () => clearTimeout(timeoutId);
  }, [user, isLoaded]);

  const updateUserProfile = async (updateData) => {
    if (!user) return;

    try {
      console.log('Updating user profile:', { userId: user.id, updateData });
      
      const response = await fetch(`/api/user-profile?clerkUserId=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Update response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Update successful:', data);
        setUserProfile(data.userProfile);
        return data.userProfile;
      } else {
        const errorData = await response.json();
        console.error('Update failed:', errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  const value = {
    userProfile,
    setUserProfile,
    updateUserProfile,
    loading,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
} 