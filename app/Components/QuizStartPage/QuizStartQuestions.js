'use client';

import React, { useEffect, useState } from 'react';
import useGlobalContextProvider from '@/app/ContextApi';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import convertFromFaToText from '@/app/convertFromFaToText';

function QuizStartQuestions({ onUpdateTime }) {
  const time = 30;
  const { quizToStartObject, allQuizzes, setAllQuizzes, userObject } =
    useGlobalContextProvider();
  const { selectQuizToStart } = quizToStartObject;
  const { quizQuestions } = selectQuizToStart;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [indexOfQuizSelected, setIndexOfQuizSelected] = useState(null);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [score, setScore] = useState(0);
  const { user, setUser } = userObject;

  const [timer, setTimer] = useState(time);
  let interval;

  function startTimer() {
    clearInterval(interval);
    setTimer(time);

    interval = setInterval(() => {
      setTimer((currentTime) => {
        onUpdateTime(currentTime);
        if (currentTime === 0) {
          clearInterval(interval);
          return 0;
        }
        return currentTime - 1;
      });
    }, 1000);
  }

  async function saveDataIntoDB() {
    try {
      const id = selectQuizToStart._id;
      // Get the _id of the quiz
      const res = await fetch(
        `/api/quizzes?id=${id}`, // Include the id as a query parameter
        {
          method: 'PUT',
          headers: {
            'Content-type': 'application/json',
          },
          body: JSON.stringify({
            updateQuizQuestions: allQuizzes[indexOfQuizSelected].quizQuestions,
          }),
        },
      );
      console.log(allQuizzes[indexOfQuizSelected].quizQuestions);
      if (!res.ok) {
        toast.error('Something went wrong while saving...');
        return;
      }
    } catch (error) {
      console.log(error);
    }
  }

  console.log(indexOfQuizSelected);

  useEffect(() => {
    startTimer();
    return () => {
      clearInterval(interval);
    };
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (timer === 0 && !isQuizEnded) {
      // Updating the allQuizzes
      const currentQuizzes = [...allQuizzes];
      currentQuizzes[indexOfQuizSelected].quizQuestions[
        currentQuestionIndex
      ].statistics.totalAttempts += 1;
      currentQuizzes[indexOfQuizSelected].quizQuestions[
        currentQuestionIndex
      ].statistics.incorrectAttempts += 1;

      setAllQuizzes(currentQuizzes);
      // --------------------
      if (currentQuestionIndex !== quizQuestions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((current) => {
            return current + 1;
          });
        }, 1000);
      } else {
        setIsQuizEnded(true);
        clearInterval(interval);
      }
    }
  }, [timer]);

  // With the useEffect every time the component is loaded up
  //we need to get the index of the quiz we selected inside
  // the allquizzes array to update it when we choose tne answer
  //
  useEffect(() => {
    const quizIndexFound = allQuizzes.findIndex(
      (quiz) => quiz._id === selectQuizToStart._id,
    );
    setIndexOfQuizSelected(quizIndexFound);
  }, []);

  useEffect(() => {
    if (isQuizEnded) {
      // renitialize all answers to -1
      quizQuestions.forEach((quizQuestion) => {
        quizQuestion.answeredResult = -1;
      });
      saveDataIntoDB();
    }
  }, [isQuizEnded]);

  function selectChoiceFunction(choiceIndexClicked) {
    // update the selectedChoice variable state
    setSelectedChoice(choiceIndexClicked);
    //---------------------------------------

    //We update the answerResult proprety in the allQuizzes array
    const currentAllQuizzes = [...allQuizzes];

    currentAllQuizzes[indexOfQuizSelected].quizQuestions[
      currentQuestionIndex
    ].answeredResult = choiceIndexClicked;

    setAllQuizzes(currentAllQuizzes);
    //------------------------------------
  }

  function moveToTheNextQuestion() {
    // Check if the we did select the an answer by using the answerResult proprety if
    //it's still equal to -1
    if (
      allQuizzes[indexOfQuizSelected].quizQuestions[currentQuestionIndex]
        .answeredResult === -1
    ) {
      toast.error('please select an answer');
      return;
    }

    // Update the statistics of the question
    // ======================================
    // update the total Attemptes:
    allQuizzes[indexOfQuizSelected].quizQuestions[
      currentQuestionIndex
    ].statistics.totalAttempts += 1;

    // if the answer is incorrect
    if (
      allQuizzes[indexOfQuizSelected].quizQuestions[currentQuestionIndex]
        .answeredResult !==
      allQuizzes[indexOfQuizSelected].quizQuestions[currentQuestionIndex]
        .correctAnswer
    ) {
      // update the incorrect attemptes
      allQuizzes[indexOfQuizSelected].quizQuestions[
        currentQuestionIndex
      ].statistics.incorrectAttempts += 1;
      toast.error('Incorrect Answer!');

      // if the answer is incorrect, go to the next question only
      // if we are not at the last question
      if (currentQuestionIndex != quizQuestions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((current) => current + 1);
          // initialize the choice after going to the next question
          setSelectedChoice(null);
        }, 1200);
      } else {
        // if we select the wrong choice and we are at the end of the question
        // end the quiz
        setTimer(0);
        clearInterval(interval);
        setIsQuizEnded(true);
      }

      return;
    }

    // update the correct attemptes
    allQuizzes[indexOfQuizSelected].quizQuestions[
      currentQuestionIndex
    ].statistics.correctAttempts += 1;
    // Increment the score by 1
    setScore((prevState) => prevState + 1);

    toast.success('Awesome!');

    // This will stop the timer and end the quiz when currentQuestionIndex is the last
    // and only if we select the correct otherwise the timer is still running
    if (
      currentQuestionIndex === quizQuestions.length - 1 &&
      allQuizzes[indexOfQuizSelected].quizQuestions[currentQuestionIndex]
        .answeredResult ===
        allQuizzes[indexOfQuizSelected].quizQuestions[currentQuestionIndex]
          .correctAnswer
    ) {
      setTimer(0);
      clearInterval(interval);
      setIsQuizEnded(true);
      return;
    }

    // increment the currentQuestionIndex by 1 to go to the next question
    setTimeout(() => {
      setCurrentQuestionIndex((current) => current + 1);
      // initialize the choice after going to the next question
      setSelectedChoice(null);
    }, 2000);
  }



  return (
    <div className="relative poppins rounded-sm m-9 w-9/12  ">
      <Toaster
        toastOptions={{
          // Define default options
          className: '',
          duration: 1500,
          style: {
            padding: '12px',
          },
        }}
      />
      {/* The Question Part */}
      <div className="flex   items-center gap-2">
        <div className="bg-yellow-500 flex  justify-center items-center rounded-md w-11 h-11 text-black p-3">
          {currentQuestionIndex + 1}
        </div>
                        <p>{quizQuestions[currentQuestionIndex].question}</p>
      </div>
      {/* The Answers Part */}
      <div className="mt-7 flex flex-col gap-2">
        {quizQuestions[currentQuestionIndex].choices.map(
          (choice, indexChoice) => (
            <div
              key={indexChoice}
              onClick={() => {
                selectChoiceFunction(indexChoice);
              }}
              className={`p-3 ml-11 w-10/12 border border-yellow-500 rounded-md
               hover:bg-yellow-500 hover:text-black transition-all select-none ${
                 selectedChoice === indexChoice
                   ? 'bg-yellow-500 text-black'
                   : 'bg-white'
               }`}
            >
              {choice}
            </div>
          ),
        )}
      </div>
      {/* Submit Button */}
      <div className="flex justify-end mt-7  ">
        <button
          onClick={() => {
            moveToTheNextQuestion();
          }}
          disabled={isQuizEnded ? true : false}
          className={`p-2 px-5 text-[15px] text-black rounded-md bg-yellow-500 mr-[70px] ${
            isQuizEnded ? 'opacity-60' : 'opacity-100'
          }`}
        >
          Submit
        </button>
      </div>
      {isQuizEnded && (
        <ScoreComponent
          quizStartParentProps={{
            setIsQuizEnded,
            setIndexOfQuizSelected,
            setCurrentQuestionIndex,
            setSelectedChoice,
            score,
            setScore,
          }}
        />
      )}
    </div>
  );
}

export default QuizStartQuestions;

function ScoreComponent({ quizStartParentProps }) {
  const { quizToStartObject, allQuizzes } = useGlobalContextProvider();
  const { selectQuizToStart } = quizToStartObject;
  const numberOfQuestions = selectQuizToStart.quizQuestions.length;
  const router = useRouter();
  //
  const {
    setIsQuizEnded,
    setIndexOfQuizSelected,
    setCurrentQuestionIndex,
    setSelectedChoice,
    setScore,
    score,
  } = quizStartParentProps;

  function emojiIconScore() {
    const emojiFaces = [
      'confused-emoji.png',
      'happy-emoji.png',
      'very-happy-emoji.png',
    ];
    const result = (score / selectQuizToStart.quizQuestions.length) * 100;

    if (result < 25) {
      return emojiFaces[0];
    }

    if (result == 50) {
      return emojiFaces[1];
    }

    return emojiFaces[2];
  }

  console.log(emojiIconScore());

  function tryAgainFunction() {
    setIsQuizEnded(false);
    const newQuizIndex = allQuizzes.findIndex(
      (quiz) => quiz._id === selectQuizToStart._id,
    );
    console.log(newQuizIndex);
    setIndexOfQuizSelected(newQuizIndex);
    setCurrentQuestionIndex(0);
    setSelectedChoice(null);
    setScore(0);
    console.log(selectQuizToStart);
  }

  return (
    <div className=" flex items-center justify-center rounded-md top-[-100px] border border-gray-200 absolute w-full h-[450px] bg-white">
      {/* Score */}
      <div className=" flex gap-4 items-center justify-center flex-col">
        <Image src={`/${emojiIconScore()}`} alt="" width={100} height={100} />
        <div className="flex gap-1 flex-col">
          <span className="font-bold text-2xl">Your Score</span>
          <div className="text-[22px] text-center">
            {score}/{numberOfQuestions}
          </div>
        </div>
        <button
          onClick={() => tryAgainFunction()}
          className="p-2 bg-yellow-500 rounded-md text-black px-6"
        >
          Try Again
        </button>
        {/* statistics */}
        <div className="  w-full flex gap-2 flex-col mt-3">
          <div className="flex gap-1 items-center justify-center">
            <Image src="/correct-answer.png" alt="" width={20} height={20} />
            <span className="text-[14px]">Correct Answers: {score}</span>
          </div>
          <div className="flex gap-1 items-center justify-center">
            <Image src="/incorrect-answer.png" alt="" width={20} height={20} />
            <span className="text-[14px]">
              Incorrect Answers:
              {selectQuizToStart.quizQuestions.length - score}
            </span>
          </div>
        </div>
        {/* <span>Or</span> */}
        <span
          onClick={() => {
            router.push('/');
          }}
          className="text-yellow-500 select-none cursor-pointer text-sm mt-8 "
        >
          Select Another Quiz
        </span>
      </div>
    </div>
  );
}
