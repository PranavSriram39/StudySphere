import {
  getQuizDetail,
  getUserQuizzes,
} from "@/components/Constants/apiEndpoints";
import { getRequest } from "@/config/axiosInterceptor";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function getQuizDetailData(context) {
  const token = cookies().get("token")?.value;
  let quiz = {};
  let quizData = [];
  if (!token) {
    redirect("/login");
  }
  try {
    const response = await getRequest({
      url: getQuizDetail,
      params: `?quiz_id=${context.params.id}`,
      token: token,
    });
    const data = response.data.data;
    if (response.status) {
      quiz = JSON.parse(data?.quiz[0].quiz);
      quizData = data?.quiz[0];
    }
  } catch (error) {
    console.log(error);
  }
  return { quiz, quizData };
}
