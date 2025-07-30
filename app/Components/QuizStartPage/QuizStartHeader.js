'use client';

import React from 'react';
import { faCode, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useGlobalContextProvider from '@/app/ContextApi';

function QuizStartHeader({ parentTimer }) {
  const { quizToStartObject } = useGlobalContextProvider();
  const { selectQuizToStart } = quizToStartObject;
  // Extracting info from the selectQuizStart
  const { quizTitle } = selectQuizToStart;
  const { quizQuestions } = selectQuizToStart;

  return (
    <div className="flex justify-between">
      {/* The Quiz name */}
      <div className="flex gap-2 justify-center">
        <div className="bg-yellow-500 w-12 h-12 flex items-center justify-center p-2 rounded-md">
          <FontAwesomeIcon
            className="text-black"
            width={25}
            height={25}
            icon={faCode}
          />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="font-bold text-xl">{quizTitle}</h2>
          <span className="font-light text-sm">
            {quizQuestions.length} Questions
          </span>
        </div>
      </div>
      {/*  */}
      {/* Timer */}
      <div className="flex gap-2 items-center">
        <FontAwesomeIcon
          className="text-yellow-500"
          width={20}
          height={20}
          icon={faStopwatch}
        />

        <span>00:00:{parentTimer}</span>
      </div>
    </div>
  );
}

export default QuizStartHeader;
