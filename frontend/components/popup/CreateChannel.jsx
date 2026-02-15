import React, { useEffect } from "react";
import PopupContainer from "../Layouts/PopupContainer";
import Title from "../Helpers/Title";
import Description from "../Helpers/Description";
import PrimaryBtn from "../Helpers/PrimaryBtn";
import { useForm } from "react-hook-form";
import { createChannelApi } from "../Constants/apiEndpoints";
import { getCookie } from "cookies-next";
import toast from "react-hot-toast";
import { postRequest } from "@/config/axiosInterceptor";
import { loadChannelData } from "@/lib/ChannelApi";
import { channelStore } from "@/store/channelStore";
import { activeOrgChannel } from "@/store/activeOrgChannel";
const CreateChannel = ({ orgDetails, setPopup, channelsData }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm();

  const setChannelDetails = channelStore((state) => state.setChannelDetails);
  const setOrgActiveChannel = activeOrgChannel((state) => state.setOrgChannel);

  useEffect(() => {
    setValue("org_id", orgDetails._id);
  }, [orgDetails, setValue]);

  const handleChannelCreation = async (data) => {
    setOrgActiveChannel(data.name);
    const channelData = await loadChannelData(data?._id);
    setChannelDetails(channelData ? channelData : null);
  };

  const onSubmit = async (data) => {
    try {
      const response = await postRequest({
        url: createChannelApi,
        body: data,
        token: getCookie("token"),
      });
      if (response?.data?.status) {
        reset();
        toast.success("Channel created Successfully!");
        setPopup(false);
        channelsData.unshift(response.data.data);
        // setOrgActiveChannel(response.data.data.name);
        handleChannelCreation(response.data.data);
      } else {
        toast.error(response?.data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <PopupContainer setPopup={setPopup} closeBtn>
      <div className="bg-white w-[90vw] md:w-[30vw] rounded-md shadow-md py-6 lg:px-10 px-4 flex flex-col gap-3">
        <Title>Create Your Channel</Title>
        <Description>
          Create your own channel and build the community of the like minded
          peoples like you.
        </Description>
        <form
          action=""
          className="flex flex-col gap-3"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="relative h-10 w-full">
            <input
              className="peer h-full w-full rounded-[7px] border border-blue-gray-200 border-t bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-black focus:border-t-transparent focus:outline-0 disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              id="name"
              type="text"
              required="true"
              {...register("name", { required: true, maxLength: 30 })}
            />
            <label
              htmlFor="name"
              className="text-gray-500 before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-black peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-black peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-black peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
            >
              Channel Name
            </label>
          </div>
          <div className="relative w-full min-w-[200px]">
            <textarea
              className="peer h-full min-h-[100px] w-full resize-none rounded-[7px] border border-blue-gray-200 border-t bg-transparent px-3 py-2.5 font-sans text-sm font-normal text-blue-gray-700 outline outline-0 transition-all placeholder-shown:border placeholder-shown:border-blue-gray-200 placeholder-shown:border-t-blue-gray-200 focus:border-2 focus:border-black focus:border-t-transparent focus:outline-0 disabled:resize-none disabled:border-0 disabled:bg-blue-gray-50"
              placeholder=" "
              required="true"
              id="description"
              {...register("description", { required: true, maxLength: 1000 })}
            ></textarea>
            <label
              htmlFor="description"
              className="text-gray-500 before:content[' '] after:content[' '] pointer-events-none absolute left-0 -top-1.5 flex h-full w-full select-none text-[11px] font-normal leading-tight text-blue-gray-400 transition-all before:pointer-events-none before:mt-[6.5px] before:mr-1 before:box-border before:block before:h-1.5 before:w-2.5 before:rounded-tl-md before:border-t before:border-l before:border-blue-gray-200 before:transition-all after:pointer-events-none after:mt-[6.5px] after:ml-1 after:box-border after:block after:h-1.5 after:w-2.5 after:flex-grow after:rounded-tr-md after:border-t after:border-r after:border-blue-gray-200 after:transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:leading-[3.75] peer-placeholder-shown:text-blue-gray-500 peer-placeholder-shown:before:border-transparent peer-placeholder-shown:after:border-transparent peer-focus:text-[11px] peer-focus:leading-tight peer-focus:text-black peer-focus:before:border-t-2 peer-focus:before:border-l-2 peer-focus:before:border-black peer-focus:after:border-t-2 peer-focus:after:border-r-2 peer-focus:after:border-black peer-disabled:text-transparent peer-disabled:before:border-transparent peer-disabled:after:border-transparent peer-disabled:peer-placeholder-shown:text-blue-gray-500"
            >
              Description
            </label>
          </div>
          <PrimaryBtn label="Create" type="submit" className="mb-4" />
        </form>
      </div>
    </PopupContainer>
  );
};

export default CreateChannel;
