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

function validateQuizQuestions(quizQuestions) {
  for (let question of quizQuestions) {
    // Check if the main question is empty
    if (!question.question.trim()) {
      return { valid: false, message: 'Please fill in the main question.' };
    }

    // Check if any choice is empty
    if (question.choices.some((choice) => !choice.text.trim().substring(2))) {
      return { valid: false, message: 'Please fill in all choices.' };
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

  async function createNewQuiz() {
    try {
      setIsLoading(true);
      const textIcon = convertFromFaToText(newQuiz.icon);
      const quizWithTextIcon = {
        ...newQuiz,
        icon: textIcon,
      };

      const res = await fetch('http://localhost:3000/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(quizWithTextIcon), // Adding the new quiz to the db
      });

      if (!res.ok) {
        toast.error('Failed to create a new quiz!');
        setIsLoading(false);
        return;
      }

      const { id } = await res.json();
      console.log(id);
      // Update the _id property of the newQuiz object
      const updatedQuiz = { ...newQuiz, _id: id, icon: textIcon };

      setAllQuizzes([...allQuizzes, updatedQuiz]);

      toast.success('The quiz has been created successfully!');
    } catch (error) {
      console.log(error);
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
      //
      const convertIconText = convertFromFaToText(
        updatedQuiz[findIndexQuiz].icon,
      );
      console.log(updatedQuiz[findIndexQuiz]);
      updatedQuiz[findIndexQuiz].icon = convertIconText;
      try {
        const res = await fetch(`http://localhost:3000/api/quizzes?id=${id}`, {
          method: 'PUT',
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify({
            updateQuiz: updatedQuiz[findIndexQuiz],
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to update quiz');
        }

        toast.success('The quiz has been saved successfully.');
        setAllQuizzes(updatedQuiz);
      } catch (error) {}
    } else {
      createNewQuiz();

      router.push('/'); // Navigate to main page
    }
  }

  return (
    <div className="poppins my-12 flex justify-between items-center ">
      <div className="flex gap-2 items-center">
        <Image src="/quiz-builder-icon.png" alt="" height={50} width={50} />
        <span className="text-2xl">
          Quiz <span className="text-yellow-500 font-bold">Builder</span>
        </span>
      </div>
      <button
        onClick={() => {
          saveQuiz();
        }}
        className="p-2 px-4 bg-yellow-500 rounded-md text-black"
      >
        {isLoading ? 'Loading...' : 'Save'}
      </button>
    </div>
  );
}

export default QuizBuildNav;
