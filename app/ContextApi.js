'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { quizzesData } from './QuizzesData';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';

const GlobalContext = createContext();

export function ContextProvider({ children }) {
  const { user: clerkUser, isLoaded } = useUser();
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [selectQuizToStart, setSelectQuizToStart] = useState(null);
  const [user, setUser] = useState({});
  const [openIconBox, setOpenIconBox] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedIcon, setSelectedIcon] = useState({ faIcon: faQuestion });

  const [dropDownToggle, setDropDownToggle] = useState(false);
  const [threeDotsPositions, setThreeDotsPositions] = useState({ x: 0, y: 0 });
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all quizzes
    const fetchAllQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quizzes', {
          cache: 'no-cache',
        });

        if (!response.ok) {
          console.error('Failed to fetch quizzes');
          setAllQuizzes([]);
        } else {
          const quizzesData = await response.json();
          setAllQuizzes(quizzesData.quizzes || []);
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setAllQuizzes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllQuizzes();
  }, []);

  useEffect(() => {
    // Use Clerk user data instead of creating a hardcoded user
    if (isLoaded) {
      if (clerkUser) {
        setUser({
          id: clerkUser.id,
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
          isLogged: true,
          email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
        });
      } else {
        // Set a default user for unauthenticated state
        setUser({
          id: 'anonymous',
          name: 'Guest',
          isLogged: false,
          email: '',
        });
      }
    }
  }, [clerkUser, isLoaded]);

  useEffect(() => {
    if (selectedQuiz) {
      setSelectedIcon({ faIcon: selectedQuiz.icon });
    } else {
      setSelectedIcon({ faIcon: faQuestion });
    }
  }, [selectedQuiz]);

  // Provide a safe context value even if Clerk is not loaded
  const contextValue = {
    allQuizzes,
    setAllQuizzes,
    quizToStartObject: { selectQuizToStart, setSelectQuizToStart },
    userObject: { user, setUser },
    openBoxToggle: { openIconBox, setOpenIconBox },
    selectedIconObject: { selectedIcon, setSelectedIcon },
    dropDownToggleObject: { dropDownToggle, setDropDownToggle },
    threeDotsPositionsObject: { threeDotsPositions, setThreeDotsPositions },
    selectedQuizObject: { selectedQuiz, setSelectedQuiz },
    isLoadingObject: { isLoading, setLoading },
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}

export default function useGlobalContextProvider() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobalContextProvider must be used within a ContextProvider');
  }
  return context;
}
