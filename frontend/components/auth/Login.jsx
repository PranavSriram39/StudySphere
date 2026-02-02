"use client";
import React, { useState } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import PrimaryBtn from "../Helpers/PrimaryBtn";
import { motion } from "framer-motion";
import LottieComponent from "./Lottie";
import axios from "axios";
import { ApiUrl, loginApi } from "../Constants/apiEndpoints";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { setCookie } from "cookies-next";
import { postRequest } from "@/config/axiosInterceptor";
import Title from "../Helpers/Title";
import Description from "../Helpers/Description";
import { userDetailsStore } from "@/store/userStore";
import Loader from "../Loader/Loader";
import { useLoader } from "@/store/loaderStore";

const LoginComponent = () => {
  const [type, setType] = useState(false);
  const setLoading = useLoader((state) => state.setLoading);
  const getUserDetails = userDetailsStore((state) => state.getUserDetails);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const router = useRouter();

  const submitData = async (data) => {
    try {
      setLoading(true);
      const response = await postRequest({
        url: loginApi,
        body: data,
      })
      // const response = await axios.post(`${ApiUrl}${loginApi}`, data);
      if (response?.data?.status) {
        setCookie("token", response?.data?.data?.token);
        reset();
        toast.success("Login Successful!");
        getUserDetails();
        if (response?.data?.data?.org_joined){
          setCookie("org", response?.data?.data?.org_joined);
          router.push("/organization/" + response?.data?.data?.org_joined);
        }else{
          router.push("/create-join");
        }
        setLoading(false);
      } else {
        toast.error(response?.data?.message);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      className="lg:w-[70%] w-full lg:mx-0 mx-2 lg:px-10 px-4 py-8 pb-12 bg-white rounded-md shadow-md"
    >
      <Title>
        <span className="text-blue-500">Welcome</span> Back !
      </Title>
      <Description>
        Not a member?{" "}
        <a className="text-[#4983f6]" href="/register">
          Sign up now
        </a>
      </Description>
      <div className="md:hidden">
        <LottieComponent />
      </div>
      <form
        action=""
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(submitData)}
      >
        <div className="input-group w-full">
          <input
            id="email"
            type="text"
            required
            className="input"
            {...register("email", {
              required: true,
            })}
          />
          <label htmlFor="email" className="placeholder">
            Email or username
          </label>
          {errors.email && errors.email.type === "required" && (
            <span className="text-red-600 text-xs">Email is required</span>
          )}
        </div>
        <div className="input-group w-full">
          <input
            id="password"
            type={type ? "text" : "password"}
            required
            className="input"
            {...register("password", { required: true })}
          />
          <label htmlFor="password" className="placeholder">
            Password
          </label>
          <p
            className="absolute right-[10px] top-[11px] cursor-pointer"
            onClick={() => setType(!type)}
          >
            {type ? (
              <AiFillEye className="text-[#808080] text-xl" />
            ) : (
              <AiFillEyeInvisible className="text-[#808080] text-xl" />
            )}
          </p>
          {errors.password && errors.password.type === "required" && (
            <span className="text-red-600 text-xs">Password is required</span>
          )}
        </div>
        <a
          className="text-[#4983f6] text-end pr-4 text-xs"
          href="/forgot-password"
        >
          Forgot password?
        </a>
        <PrimaryBtn label="Login" type="submit" />
      </form>
    </motion.div>
  );
};

export default LoginComponent;
