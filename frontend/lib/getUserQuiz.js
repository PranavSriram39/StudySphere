import { getUserQuizzes } from "@/components/Constants/apiEndpoints";
import { getRequest } from "@/config/axiosInterceptor";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function getUserQuizData(context, isChannelId) {
  const token = cookies().get("token")?.value;
  let channelData = [];
  if (!token) {
    redirect("/login");
  }
  try {
    const response = await getRequest({
      url: getUserQuizzes,
      params: `?org_id=${context.searchParams.org_id}${
        isChannelId ? `&channel_id=${context.searchParams.channel_id}` : ""
      }&active=true`,
      token: token,
    });
    const data = response.data.data;
    if (response.status) {
      channelData = data;
    }
  } catch (error) {
    console.log(error);
  }
  return channelData;
}
