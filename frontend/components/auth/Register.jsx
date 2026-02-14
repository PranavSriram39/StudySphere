"use client";
import React, { useState } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import PrimaryBtn from "../Helpers/PrimaryBtn";
import Image from "next/image";
import { AvatarReg } from "../Constants/imageContants";
import { BiSolidCamera } from "react-icons/bi";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { setCookie } from "cookies-next";
import axios from "axios";
import { ApiUrl, registerApi } from "../Constants/apiEndpoints";
import { useRouter } from "next/navigation";
import { postRequest } from "@/config/axiosInterceptor";
import Title from "../Helpers/Title";
import Description from "../Helpers/Description";
import { userDetailsStore } from "@/store/userStore";
import { useLoader } from "@/store/loaderStore";

const RegisterComponent = () => {
  const [type, setType] = useState(false);
  const [image, setImage] = useState(null);
  const getUserDetails = userDetailsStore((state) => state.getUserDetails);
  const setLoading = useLoader((state) => state.setLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
    reset,
  } = useForm();

  const router = useRouter();

  const submitData = async (data) => {
    try {
      setLoading(true);
      const response = await postRequest({
        url: registerApi,
        body: data,
      });
      if (response?.data?.status) {
        setCookie("token", response?.data?.data?.token);
        reset();
        toast.success("Registration Successful!");
        router.push("/create-join");
        getUserDetails();
        setLoading(false);
      } else {
        toast.error(response?.data?.message);
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const uploadImage = (file) => {
    if (file === undefined) {
      toast.error("Invalid Image!");
      return;
    }
    if (
      file.type == "image/png" ||
      file.type == "image/jpg" ||
      file.type == "image/jpeg"
    ) {
      setImage(URL.createObjectURL(file));
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "study-nex");
      data.append("cloud_name", "doiv24r1h");
      fetch("https://api.cloudinary.com/v1_1/doiv24r1h/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((res) => {
          // console.log(res.url);
          setValue("image", res?.secure_url?.toString());
        });
    } else {
      toast.error("Invalid Image!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      className="lg:w-[70%] w-full lg:mx-0 mx-2 lg:px-10 px-4 py-8 pb-12 bg-white rounded-md shadow-md"
    >
      <Title>
        Welcome to <span className="text-blue-500">StudyNex</span> !
      </Title>
      <Description>
        Already a member?{" "}
        <a className="text-[#4983f6]" href="/login">
          Log in now
        </a>
      </Description>
      <form
        action=""
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(submitData)}
      >
        <label className="m-auto relative flex justify-center" htmlFor="image">
          {image ? (
            <img
              src={image}
              alt=""
              className="w-24 h-24 cursor-pointer rounded-full object-cover bg-center"
            />
          ) : (
            <Image
              src={AvatarReg}
              alt=""
              className="w-24 h-24 cursor-pointer rounded-full"
            ></Image>
          )}
          <BiSolidCamera className="absolute bottom-0 right-2 text-white text-2xl bg-blue-500 rounded-full p-1 cursor-pointer" />
          <input
            id="image"
            type="file"
            accept="image/*"
            className="opacity-0 text-[0.4rem] absolute"
            onChange={(e) => uploadImage(e.target.files[0])}
          />
        </label>
        <div className="input-group w-full">
          <input
            id="name"
            type="text"
            required
            className="input"
            {...register("name", { required: true, maxLength: 30 })}
          />
          <label htmlFor="name" className="placeholder">
            Name
          </label>
          {errors.name && errors.name.type === "required" && (
            <span className="text-red-600 text-xs">Name is required</span>
          )}
          {errors.name && errors.name.type === "maxLength" && (
            <span className="text-red-600 text-xs">Max length exceeded</span>
          )}
        </div>
        <div className="input-group w-full">
          <input
            id="mobile_number"
            type="tel"
            required
            maxLength={10}
            className="input"
            {...register("mobile_number", {
              required: true,
              maxLength: 10,
              minLength: 10,
            })}
          />
          <label htmlFor="mobile_number" className="placeholder">
            Mobile number
          </label>
          {errors.mobile_number && errors.mobile_number.type === "required" && (
            <span className="text-red-600 text-xs">
              Mobile number is required
            </span>
          )}
          {(errors.mobile_number &&
            errors.mobile_number?.type === "maxLength") ||
            (errors.mobile_number?.type === "minLength" && (
              <span className="text-red-600 text-xs">
                Mobile number must be of 10 digits long
              </span>
            ))}
        </div>
        <div className="input-group w-full">
          <input
            id="email"
            type="text"
            required
            className="input"
            {...register("email", {
              required: true,
              pattern: {
                value: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
                message: "Email is invalid",
              },
            })}
          />
          <label htmlFor="email" className="placeholder">
            Email
          </label>
          {errors.email && errors.email.type === "required" && (
            <span className="text-red-600 text-xs">Email is required</span>
          )}
          {errors.email && errors.email.type === "pattern" && (
            <span className="text-red-600 text-xs">{errors.email.message}</span>
          )}
        </div>
        <div className="input-group w-full">
          <input
            id="username"
            type="text"
            required
            className="input"
            {...register("username", {
              required: true,
            })}
          />
          <label htmlFor="username" className="placeholder">
            Username
          </label>
          {errors.username && errors.username.type === "required" && (
            <span className="text-red-600 text-xs">Username is required</span>
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
        <PrimaryBtn label="Sign Up" type="submit" />
      </form>
    </motion.div>
  );
};

export default RegisterComponent;
