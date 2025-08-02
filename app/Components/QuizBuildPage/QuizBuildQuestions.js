'use client';

import React, {
  useState,
  useEffect,
  useRef,
  createRef,
  forwardRef,
  useLayoutEffect,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';
import QuestionTypeSelector from './QuestionTypeSelector';
import { 
  MCQComponent, 
  TextComponent, 
  TrueFalseComponent, 
  FillBlankComponent 
} from './QuestionTypeComponents';

function QuizBuildQuestions({ focusProp, quizQuestions, setQuizQuestions }) {
  const prefixes = ['A', 'B', 'C', 'D'];
  const { focus, setFocusFirst } = focusProp;
  const endOfListRef = useRef(null);
  const textAreaRefs = useRef(quizQuestions.map(() => createRef()));

  //
  // Add a new question to the quizQuestions
  // ----------------------------------------
  function addNewQuestion() {
    setFocusFirst(false);
    // This code below to verify if the question field is empty or not
    // --------------------------------------------------------------
    const lastIndexQuizQuestions = quizQuestions.length - 1;
    if (
      quizQuestions[lastIndexQuizQuestions].question.trim(' ').length === 0
    ) {
      toast.error(`The question ${lastIndexQuizQuestions + 1} is still empty!`); //Show the error message
      textAreaRefs.current[lastIndexQuizQuestions].current.focus(); //Set the focus back to the filed
      return;
    }

    // Validate based on question type
    const lastQuestion = quizQuestions[lastIndexQuizQuestions];
    if (lastQuestion.type === 'mcq') {
      // Check if all choices are filled
      for (const choice of lastQuestion.choices) {
        const singleChoice = choice.text.substring(3); // Remove prefix
        if (singleChoice.trim(' ').length === 0) {
          return toast.error(
            `Please ensure that all previous choices are filled out!`,
          );
        }
      }
    }

    // This code check out if the correct answer input is not empty
    // --------------------------------------------------------------
    if (lastQuestion.correctAnswer.length === 0) {
      return toast.error(`Please ensure to fill out the correct answer!`);
    }

    // -----------------------------------------------------------------

    // This code create a new question objet and add it to the quiz questions array
    // ---------------------------------------------------------------------------
    const newQuestion = {
      id: uuidv4(),
      type: 'mcq', // Default to MCQ
      question: '',
      choices: prefixes.slice(0, 2).map((prefix) => ({ text: prefix + '. ', isCorrect: false })),
      correctAnswer: '',
      points: 1, // Default points
      answeredResult: -1,
      statistics: {
        totalAttempts: 0,
        correctAttempts: 0,
        incorrectAttempts: 0,
      },
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
    textAreaRefs.current = [...textAreaRefs.current, createRef()];
    // ---------------------------------------------------------------------
  }

  function deleteQuestion(singleQuestion) {
    const quizQuestionsCopy = [...quizQuestions];
    const filterQuestionToDelete = quizQuestionsCopy.filter(
      (question) => singleQuestion.id !== question.id,
    );
    // Filter out the corresponding ref
    const updatedRefs = textAreaRefs.current.filter((ref, index) => {
      return quizQuestions[index].id !== singleQuestion.id;
    });

    textAreaRefs.current = updatedRefs;
    setQuizQuestions(filterQuestionToDelete);
  }

  function handleInputChange(index, text) {
    const updatedQuestions = quizQuestions.map((question, i) => {
      if (index === i) {
        return { ...question, question: text };
      }

      return question;
    });

    setQuizQuestions(updatedQuestions);
  }

  function handleTypeChange(index, type) {
    const updatedQuestions = quizQuestions.map((question, i) => {
      if (index === i) {
        let newQuestion = { ...question, type };
        
        // Reset choices and correct answer based on type
        if (type === 'mcq') {
          newQuestion.choices = prefixes.slice(0, 2).map((prefix) => ({ text: prefix + '. ', isCorrect: false }));
        } else if (type === 'true_false') {
          newQuestion.choices = [
            { text: 'True', isCorrect: false },
            { text: 'False', isCorrect: false }
          ];
        } else {
          newQuestion.choices = [];
        }
        
        newQuestion.correctAnswer = '';
        return newQuestion;
      }

      return question;
    });

    setQuizQuestions(updatedQuestions);
  }

  function handleChoicesChange(index, choices) {
    const updatedQuestions = quizQuestions.map((question, i) => {
      if (index === i) {
        return { ...question, choices };
      }

      return question;
    });

    setQuizQuestions(updatedQuestions);
  }

  function updateCorrectAnswer(text, questionIndex) {
    const questionsCopy = [...quizQuestions];
    questionsCopy[questionIndex].correctAnswer = text;
    setQuizQuestions(questionsCopy);
  }

  function updatePoints(points, questionIndex) {
    const questionsCopy = [...quizQuestions];
    questionsCopy[questionIndex].points = points;
    setQuizQuestions(questionsCopy);
  }

  function renderQuestionComponent(question, index) {
    const commonProps = {
      question,
      onQuestionChange: (text) => handleInputChange(index, text),
      onCorrectAnswerChange: (text) => updateCorrectAnswer(text, index),
      onPointsChange: (points) => updatePoints(points, index),
      questionNumber: index + 1,
    };

    switch (question.type) {
      case 'mcq':
        return (
          <MCQComponent
            {...commonProps}
            onChoicesChange={(choices) => handleChoicesChange(index, choices)}
          />
        );
      case 'text':
        return <TextComponent {...commonProps} />;
      case 'true_false':
        return <TrueFalseComponent {...commonProps} />;
      case 'fill_blank':
        return <FillBlankComponent {...commonProps} />;
      default:
        return (
          <MCQComponent
            {...commonProps}
            onChoicesChange={(choices) => handleChoicesChange(index, choices)}
          />
        );
    }
  }

  useLayoutEffect(() => {
    if (endOfListRef.current && focus) {
      setTimeout(() => {
        endOfListRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [quizQuestions.length]);

  useEffect(() => {
    // Focus the last textarea if it exists
    const lastTextAreaIndex = quizQuestions.length - 1;
    if (lastTextAreaIndex >= 0) {
      const lastTextArea = textAreaRefs.current[lastTextAreaIndex].current;
      if (lastTextArea && focus) {
        lastTextArea.focus();
      }
    }
  }, [quizQuestions.length]);

  return (
    <div className="p-3 mt-6 flex justify-between border border-yellow-500 rounded-md relative">
      <Toaster
        toastOptions={{
          style: {
            fontSize: '13px',
          },
        }}
      />

      <div className="flex gap-2 flex-col  w-full">
        {/* Header Area */}
        <div className="flex gap-2 items-center">
          <div className="bg-yellow-500 px-4 py-2  rounded-md text-black">2</div>
          <span className="font-bold">Quiz Questions : </span>
        </div>
        {/* Questions Area */}
        {quizQuestions.map((singleQuestion, questionIndex) => (
          <div
            ref={
              quizQuestions.length - 1 === questionIndex ? endOfListRef : null
            }
            key={questionIndex}
            className="border ml-5 p-4 mt-4 flex-col  border-yellow-500 
        border-opacity-50 rounded-md flex justify-center relative "
          >
            {/* Question Header with Number */}
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold mr-3">
                {questionIndex + 1}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Question {questionIndex + 1}
              </h3>
            </div>

            {/* Question Type Selector */}
            <QuestionTypeSelector
              selectedType={singleQuestion.type || 'mcq'}
              onTypeChange={(type) => handleTypeChange(questionIndex, type)}
            />

            {/* Question Component */}
            {renderQuestionComponent(singleQuestion, questionIndex)}

            {questionIndex !== 0 && (
              <FontAwesomeIcon
                icon={faXmark}
                width={10}
                height={10}
                className="text-red-600 absolute top-2 right-3 cursor-pointer"
                onClick={() => {
                  deleteQuestion(singleQuestion);
                }}
              />
            )}
          </div>
        ))}

        {/* Button Area */}
        <div className="w-full flex justify-center mt-3 ">
          <button
            onClick={() => {
              addNewQuestion();
            }}
            className="p-3 bg-yellow-500 rounded-md text-black w-[210px] text-[13px]"
          >
            Add a New Question
          </button>
        </div>
      </div>
    </div>
  );
}
export default QuizBuildQuestions;
