'use client';

import React, { useState, useEffect } from 'react';
import QuizBuildNav from '../Components/QuizBuildPage/QuizBuildNav';
import QuizBuildTitle from '../Components/QuizBuildPage/QuizBuildTitle';
import QuizBuildQuestions from '../Components/QuizBuildPage/QuizBuildQuestions';
import { v4 as uuidv4 } from 'uuid';
import { faCode } from '@fortawesome/free-solid-svg-icons';
import { Toaster } from 'react-hot-toast';
import IconsComponents from '../Components/QuizBuildPage/IconsComponents';
import useGlobalContextProvider from '../ContextApi';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

function Page(props) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const prefixes = ['A', 'B', 'C', 'D'];
  const { selectedIconObject, selectedQuizObject } = useGlobalContextProvider();
  const { selectedIcon } = selectedIconObject;
  const { selectedQuiz } = selectedQuizObject;
  const [focusFirst, setFocusFirst] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editQuizId, setEditQuizId] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  // Check for edit parameter in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const editParam = urlParams.get('edit');
    if (editParam) {
      setEditQuizId(editParam);
      fetchQuizForEdit(editParam);
    }
  }, []);

  const fetchQuizForEdit = async (quizId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quizzes/${quizId}`);
      if (response.ok) {
        const quizData = await response.json();
        setQuizQuestions(quizData.quizQuestions || []);
        setNewQuiz(quizData);
      } else {
        console.error('Failed to fetch quiz for editing');
      }
    } catch (error) {
      console.error('Error fetching quiz for edit:', error);
    } finally {
      setLoading(false);
    }
  };

  const [quizQuestions, setQuizQuestions] = useState(() => {
    if (selectedQuiz) {
      return selectedQuiz.quizQuestions;
    } else {
      return [
        {
          id: uuidv4(),
          question: '',
          choices: prefixes.slice(0, 2).map((prefix) => ({ text: prefix + '. ', isCorrect: false })),
          correctAnswer: '',
          answeredResult: -1,
          statistics: {
            totalAttempts: 0,
            correctAttempts: 0,
            incorrectAttempts: 0,
          },
        },
      ];
    }
  });

  const [newQuiz, setNewQuiz] = useState(() => {
    if (selectedQuiz) {
      return selectedQuiz;
    } else {
      return {
        icon: selectedIcon.faIcon,
        quizTitle: '',
        quizQuestions: quizQuestions,
        category: 'General',
        difficulty: 'medium',
        timeLimit: 30,
        passingScore: 70,
        isActive: true,
        isPublic: true,
        createdBy: user?.id || '',
      };
    }
  });

  // Update createdBy when user is loaded
  useEffect(() => {
    if (user?.id) {
      setNewQuiz(prev => ({ ...prev, createdBy: user.id }));
    }
  }, [user?.id]);

  // Ensure createdBy is set before allowing quiz creation
  useEffect(() => {
    if (isLoaded && user?.id) {
      setNewQuiz(prev => ({ ...prev, createdBy: user.id }));
    }
  }, [isLoaded, user?.id]);

  console.log(newQuiz);

  useEffect(() => {
    setNewQuiz((prevQuiz) => ({
      ...prevQuiz,
      icon: selectedIcon.faIcon,
      quizQuestions: quizQuestions,
    }));
  }, [quizQuestions, selectedIcon.faIcon]);

  function onChangeQuizTitle(text) {
    setNewQuiz((prevQuiz) => ({ ...prevQuiz, quizTitle: text }));
  }

  const quizNavBarProps = {
    quizQuestions,
    newQuiz,
    setNewQuiz,
  };

  const quizTitleProps = {
    focusProp: { focus: focusFirst, setFocusFirst },
    onChangeQuizTitle,
  };

  const quizQuestionsProps = {
    focusProp: { focus: !focusFirst, setFocusFirst },
    quizQuestions,
    setQuizQuestions,
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to sign-in
  }

  return (
    <div className=" relative mx-16 poppins">
      <IconsComponents />
      <QuizBuildNav {...quizNavBarProps} />
      <QuizBuildTitle {...quizTitleProps} />
      <QuizBuildQuestions {...quizQuestionsProps} />
    </div>
  );
}

export default Page;
