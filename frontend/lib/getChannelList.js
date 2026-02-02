import { getChannelList, getOrg } from "@/components/Constants/apiEndpoints";
import { getRequest } from "@/config/axiosInterceptor";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function getChannels() {
    const token = cookies().get("token")?.value;
    const org = cookies().get("org")?.value;
    let channelData=[];
    if(!token){
      redirect("/login");
    }
    try {
      const response = await getRequest({
        url: getChannelList,
        params: `?org=${org}`,
        token: token,
      });
      channelData = response.data.data;
    } catch (error) {
      console.log(error);
    }
    return channelData;
  }