'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import useGlobalContextProvider from '@/app/ContextApi';
import { v4 as uuidv4 } from 'uuid';
import { faCode } from '@fortawesome/free-solid-svg-icons';

import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import convertFromFaToText from '@/app/convertFromFaToText';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faSave } from '@fortawesome/free-solid-svg-icons';
import QuizPreview from './QuizPreview';

function validateQuizQuestions(quizQuestions) {
  for (let question of quizQuestions) {
    // Check if the main question is empty
    if (!question.question.trim()) {
      return { valid: false, message: 'Please fill in the main question.' };
    }

    // Validate based on question type
    switch (question.type) {
      case 'mcq':
        // Check if any choice is empty
        if (question.choices.some((choice) => !choice.text.trim().substring(3))) {
          return { valid: false, message: 'Please fill in all choices.' };
        }
        break;
      case 'text':
        // For text questions, just need the question and correct answer
        if (!question.correctAnswer.trim()) {
          return { valid: false, message: 'Please provide the expected answer for text questions.' };
        }
        break;
      case 'true_false':
        // For true/false, just need the question and correct answer
        if (!question.correctAnswer.trim()) {
          return { valid: false, message: 'Please select the correct answer (True or False).' };
        }
        break;
      case 'fill_blank':
        // For fill in the blank, just need the question and correct answer
        if (!question.correctAnswer.trim()) {
          return { valid: false, message: 'Please provide the correct answer for the blank.' };
        }
        break;
      default:
        // Default to MCQ validation
        if (question.choices.some((choice) => !choice.text.trim().substring(3))) {
          return { valid: false, message: 'Please fill in all choices.' };
        }
    }

    // Check if the correct answer is empty
    if (question.correctAnswer.length === 0) {
      return { valid: false, message: 'Please specify the correct answer.' };
    }
  }
  return { valid: true };
}

function QuizBuildNav({ newQuiz, setNewQuiz }) {
  const { allQuizzes, setAllQuizzes, selectedQuizObject } =
    useGlobalContextProvider();

  const { selectedQuiz, setSelectedQuiz } = selectedQuizObject;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function createNewQuiz() {
    try {
      setIsLoading(true);
      
      // Ensure createdBy is set
      if (!newQuiz.createdBy) {
        toast.error('User authentication required. Please sign in again.');
        return;
      }

      console.log('Original icon:', newQuiz.icon);
      console.log('Icon type:', typeof newQuiz.icon);
      console.log('Icon properties:', Object.keys(newQuiz.icon || {}));

      const textIcon = convertFromFaToText(newQuiz.icon);
      console.log('Converted icon:', textIcon);

      const quizWithTextIcon = {
        ...newQuiz,
        icon: textIcon,
        createdBy: newQuiz.createdBy, // Ensure createdBy is included
      };

      console.log('Creating quiz with data:', quizWithTextIcon);

      const res = await fetch('http://localhost:3000/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(quizWithTextIcon),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Quiz creation failed:', errorData);
        toast.error(`Failed to create quiz: ${errorData.message || 'Unknown error'}`);
        return;
      }

      const { id } = await res.json();
      console.log('Quiz created with ID:', id);
      
      // Update the _id property of the newQuiz object
      const updatedQuiz = { ...newQuiz, _id: id, icon: textIcon };

      setAllQuizzes([...allQuizzes, updatedQuiz]);

      toast.success('The quiz has been created successfully!');
      
      // Redirect to manage quizzes page
      router.push('/manage-quizzes');
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Failed to create quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveQuiz() {
    if (newQuiz.quizTitle.trim(' ').length === 0) {
      return toast.error('Please add a name for the quiz!');
    }

    const isValid = validateQuizQuestions(newQuiz.quizQuestions);
    if (isValid.valid === false) {
      toast.error(isValid.message);
      return;
    }

    if (selectedQuiz) {
      const updatedQuiz = [...allQuizzes]; // Assuming allQuizzes contains the current state of quizzes
      const findIndexQuiz = updatedQuiz.findIndex(
        (quiz) => quiz._id === newQuiz._id,
      );

      if (findIndexQuiz !== -1) {
        updatedQuiz[findIndexQuiz] = newQuiz;
      }
      const id = updatedQuiz[findIndexQuiz]._id;
      
      // Convert icon for update as well
      const textIcon = convertFromFaToText(newQuiz.icon);
      const quizWithTextIcon = {
        ...newQuiz,
        icon: textIcon,
      };
      
      const res = await fetch(`http://localhost:3000/api/quizzes?id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(quizWithTextIcon),
      });

      if (!res.ok) {
        toast.error('Failed to update the quiz!');
        return;
      }

      setAllQuizzes(updatedQuiz);
      toast.success('The quiz has been updated successfully!');
    } else {
      await createNewQuiz();
    }
  }

  const handlePreview = () => {
    if (newQuiz.quizTitle.trim(' ').length === 0) {
      return toast.error('Please add a name for the quiz!');
    }

    const isValid = validateQuizQuestions(newQuiz.quizQuestions);
    if (isValid.valid === false) {
      toast.error(isValid.message);
      return;
    }

    setShowPreview(true);
  };

  return (
    <>
      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <Image
            src="/biggies.png"
            alt="BeamerBrands"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <h1 className="text-xl font-bold text-gray-900">Quiz Builder</h1>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handlePreview}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FontAwesomeIcon icon={faEye} className="w-4 h-4 mr-2" />
            Preview Quiz
          </button>
          
          <button
            onClick={saveQuiz}
            disabled={isLoading}
            className="flex items-center px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSave} className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>

      <QuizPreview 
        quiz={newQuiz}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </>
  );
}

export default QuizBuildNav;
