import Image from "next/image";
import React, { useEffect } from "react";
import Aos from "aos";
import "aos/dist/aos.css";

const OfferCards = ({ data }) => {
  useEffect(() => {
    Aos.init();
  }, []);
  return (
    <div className="rounded-3xl" data-aos="fade-up">
      <div
        className={` bg-cover bg-center py-20 px-6 lg:p-24 relative -z-10 ${data?.class}`}
      >
        <div className="absolute inset-0 bg-black opacity-30 -z-10" />
        <div className="grid gap-8 z-50 place-content-center text-center">
          <p className="uppercase text-white text-2xl font-semibold">
            {data?.label}
          </p>
          <button className="p-4 border-2 border-white rounded-full bg-transparent lg:cursor-pointer">
            <p className="text-white lg:text-xl">{data?.btnText}</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfferCards;
