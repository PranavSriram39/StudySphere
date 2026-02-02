"use client";

import { getChannel } from "@/components/Constants/apiEndpoints";
import { getRequest } from "@/config/axiosInterceptor";
import { getCookie } from "cookies-next";
import toast from "react-hot-toast";
const token = getCookie("token");

export const loadChannelData = async (id) => {
  try {
    const response = await getRequest({
      url: getChannel,
      params: `/${id}`,
      token: token,
    });
    const data = response.data.data;
    if (response.status) {
      return data;
    }
  } catch (error) {
    toast.error("Something went wrong");
    console.log(error);
  }
};
