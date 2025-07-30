'use client';

import React from 'react';
 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import toast, { Toaster } from 'react-hot-toast';

function Choices({
  singleQuestion,
  questionIndex,
  quizQuestions,
  setQuizQuestions,
  onChangeChoice, //Callback
  prefixes,
}) {
  const { choices } = singleQuestion;
  const alphabets = ['A', 'B', 'C', 'D'];
  const positions = ['First', 'Second', 'Third', 'Fourth'];

  function addAnewChoice() {
    const quizQuestionsCopy = [...quizQuestions];
    // Check first if all the previous choices are not empty
    // -----------------------------------------------------
    const lastChoicesPosition = quizQuestionsCopy[questionIndex].choices.length;

    for (let i = lastChoicesPosition - 1; i >= 0; i--) {
      const eachInput =
        quizQuestionsCopy[questionIndex].choices[i].text.substring(2);
      if (eachInput.trim(' ').length === 0) {
        return toast.error(
          `Please ensure that all previous choices are filled out!`,
        );
      }
    }

    if (lastChoicesPosition < 4) {
      const newChoice = { text: `${alphabets[lastChoicesPosition]}. `, isCorrect: false };
      quizQuestionsCopy[questionIndex].choices.push(newChoice);
      setQuizQuestions(quizQuestionsCopy);
    }
  }

  function deleteChoiceFunction(choiceIndex) {
    const quizQuestionsCopy = [...quizQuestions];
    quizQuestionsCopy[questionIndex].choices.splice(choiceIndex, 1);
    setQuizQuestions(quizQuestionsCopy);
  }

  function handleChoiceChangeInput(text, choiceIndex, questionIndex) {
    onChangeChoice(text, choiceIndex, questionIndex);
  }

  return (
    <div className=" flex gap-[39px] items-center mt-3">
      <div className="text-[15px]">Choices</div>
      <div className="border border-gray-200 rounded-md p-4 w-full ">
        {/* Choices Area */}
        {choices.map((singleChoice, choiceIndex) => (
          <div
            key={choiceIndex}
            className="flex gap-2 items-center mt-3 relative"
          >
            <span>{alphabets[choiceIndex]}:</span>
            <input
              value={singleChoice.text.substring(prefixes[choiceIndex].length + 2)}
              onChange={(e) => {
                handleChoiceChangeInput(
                  e.target.value,
                  choiceIndex,
                  questionIndex,
                );
              }}
              className="border text-[13px]  border-gray-200 p-2 w-full rounded-md outline-none pr-10"
              placeholder={`Add Your ${positions[choiceIndex]} Choice`}
            />
            {choiceIndex >= 2 && (
              <FontAwesomeIcon
                icon={faXmark}
                width={10}
                height={10}
                className="text-red-600 absolute top-2 right-3 cursor-pointer"
                onClick={() => {
                  deleteChoiceFunction(choiceIndex);
                }}
              />
            )}
          </div>
        ))}

        {/* Button Area */}
        <div className="w-full flex justify-center mt-3 ">
          <button
            onClick={() => {
              addAnewChoice();
            }}
            className="p-3 bg-yellow-500 rounded-md text-black w-[210px] text-[13px]"
          >
            Add a New Choice
          </button>
        </div>
      </div>
    </div>
  );
}

export default Choices;
