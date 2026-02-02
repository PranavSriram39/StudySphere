import React from 'react'
import PopupContainer from '../Layouts/PopupContainer'
import Title from '../Helpers/Title';
import Description from '../Helpers/Description';
import PrimaryBtn from '../Helpers/PrimaryBtn';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { postRequest } from '@/config/axiosInterceptor';
import {  joinOrgApi } from '../Constants/apiEndpoints';
import { getCookie, setCookie } from 'cookies-next';
import toast from 'react-hot-toast';
import { userDetailsStore } from '@/store/userStore';
import { useLoader } from '@/store/loaderStore';

const JoinOrgPopup = ({setPopup}) => {

  const getUserDetails = userDetailsStore((state) => state.getUserDetails);
  const setLoading = useLoader((state) => state.setLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const router = useRouter();

  const submit = async (data) => {
    try {
      setLoading(true);
      const response = await postRequest({
        url: joinOrgApi,
        body: data,
        token: getCookie("token"),
      });
      if (response?.data?.status) {
        reset();
        toast.success("Joined Successfully!");
        getUserDetails();
        setCookie("org", response?.data?.data?.slug);
        router.push("/organization/" + response?.data?.data?.slug);
      } else {
        toast.error(response?.data?.message);
      }
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };


  return (
    <PopupContainer setPopup={setPopup} closeBtn>
      <div className="bg-white w-[90vw] md:w-[50vw] rounded-md shadow-md py-6 lg:px-10 px-4 flex flex-col gap-3">
        <Title>Join Organization</Title>
        <Description>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Saepe,
          veritatis! Asperiores id possimus provident recusandae. In autem
          mollitia atque necessitatibus!
        </Description>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
          <div className="input-group w-full">
            <input
              id="code"
              type="text"
              required
              className="input"
              {...register("org_code", { required: true, maxLength: 30 })}
            />
            <label htmlFor="code" className="placeholder">
              Organization Code
            </label>
            {errors.name && errors.org_code.type === "required" && (
              <span className="text-red-600 text-xs">Code is required</span>
            )}
          </div>
          <div className="mb-4 leading-10">
            <p className="font-bold">To sign in with a organization code</p>
            <li className="text-xs text-[#838186]">
              Use an authorized account
            </li>
            <li className="text-xs text-[#838186]">
              Use a class code with 6-7 letters and numbers and no space or
              symbols
            </li>
          </div>
          <PrimaryBtn label="Join" type="submit" className="mb-4" />
        </form>
      </div>
    </PopupContainer>
  );
}

export default JoinOrgPopup