import QuizLandingPage from '@/components/Quiz/QuizLandingPage'
import getQuizDetailData from '@/lib/getQuizDetail';
import React from 'react'

const page = async (context) => {
  const {quiz,quizData} = await getQuizDetailData(context);
  return (
    <div>
      <QuizLandingPage quiz={quiz} quizData={quizData}/>
    </div>
  );
}

export default page