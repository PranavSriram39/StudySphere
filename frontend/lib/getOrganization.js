import { getOrg } from "@/components/Constants/apiEndpoints";
import { getRequest } from "@/config/axiosInterceptor";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function getOrganization() {
  const token = cookies().get("token")?.value;
  const org = cookies().get("org")?.value;
  let organizationData;
  if (!token) {
    redirect("/login");
  }
  if (!org) {
    redirect("/create-join");
  }
  try {
    const response = await getRequest({
      url: getOrg,
      params: `?org=${org}`,
      token: token,
    });
    organizationData = response.data;
  } catch (error) {
    console.log(error);
  }
  return {
    data: organizationData,
  };
}
