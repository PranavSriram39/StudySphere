"use client";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PrimaryBtn from "../Helpers/PrimaryBtn";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import axios from "axios";
import { ApiUrl, resetPasswordApi } from "../Constants/apiEndpoints";
import toast from "react-hot-toast";
import { postRequest } from "@/config/axiosInterceptor";

const ResetPassword = () => {
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(false);
  const [confirmType, setConfirmType] = useState(true);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue
  } = useForm();

  const password = watch("password");
  const params = useParams();
  const { id } = params;

  useEffect(() => {
    setValue("token", id);
  }, [id]);

  const submitData = async (data) => {
    // console.log(data);
    try {
      setLoading(true);
      const response = await postRequest({
        url: resetPasswordApi,
        body: data,
      });
      // const response = await axios.post(`${ApiUrl}${resetPasswordApi}`, data);
      if (response?.data?.status) {
        reset();
        toast.success(response?.data?.message);
        router.push("/login");
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
      className="md:w-[35%] w-full lg:mx-0 mx-2 lg:px-10 px-4 py-8 pb-12 bg-white rounded-md shadow-md"
    >
      <p className="text-base font-extrabold pt-4  mb-2">Create new password</p>
      <p className="text-xs text-[#838186] mb-6">
        Set your new password so you can login and access{" "}
        <span className="text-blue-500">StudyNex</span>
      </p>
      <form
        action=""
        onSubmit={handleSubmit(submitData)}
        className="flex flex-col gap-4"
      >
        <div className="input-group w-full">
          <input
            id="password"
            type={type ? "text" : "password"}
            required
            className="input"
            {...register("password", {
              required: true,
              minLength: 8,
            })}
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
            <span className="text-red-600 text-xs">password is required</span>
          )}
          {errors.password && errors.password.type === "minLength" && (
            <span className="text-red-600 text-xs">
              Password must be greater than 8 characters
            </span>
          )}
        </div>
        <div className="input-group w-full">
          <input
            id="confirm_password"
            type={confirmType ? "text" : "password"}
            required
            className="input"
            {...register("confirm_password", {
              required: true,
              validate: (value) =>
                value === password || "The passwords do not match",
            })}
          />
          <label htmlFor="confirm_password" className="placeholder">
            Confirm password
          </label>
          <p
            className="absolute right-[10px] top-[11px] cursor-pointer"
            onClick={() => setType(!type)}
          >
            {confirmType ? (
              <AiFillEye className="text-[#808080] text-xl" />
            ) : (
              <AiFillEyeInvisible className="text-[#808080] text-xl" />
            )}
          </p>
          {errors.confirm_password &&
            errors.confirm_password.type === "required" && (
              <span className="text-red-600 text-xs">
                confirm_password is required
              </span>
            )}
          {errors.confirm_password &&
            errors.confirm_password.type === "validate" && (
              <span className="text-red-600 text-xs">
                {errors.confirm_password.message}
              </span>
            )}
        </div>
        <PrimaryBtn
          label="Reset Password"
          className="w-fit text-xs capitalize ml-auto"
          type="submit"
        />
      </form>
    </motion.div>
  );
};

export default ResetPassword;
