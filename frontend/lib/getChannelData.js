import {
  getChannel,
  getChannelList,
  getOrg,
} from "@/components/Constants/apiEndpoints";
import { getRequest } from "@/config/axiosInterceptor";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function getChannelData(context) {
  const token = cookies().get("token")?.value;
  let channelData = [];
  if (!token) {
    redirect("/login");
  }
  try {
    const response = await getRequest({
      url: getChannel,
      params: `/${context.searchParams.channel_id}`,
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
