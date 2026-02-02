import React, { useEffect, useState } from "react";
import Aos from "aos";
import "aos/dist/aos.css";

const InfoCards = ({ data }) => {
  const Icon = data.icon;
  useEffect(() => {
    Aos.init();
  }, []);

  return (
    <div
      className="bg-white rounded-3xl shadow-xl p-14"
      data-aos={data.animation_type}
      data-aos-duration="1500"
      data-aos-delay="100"
    >
      <div className="grid gap-10 place-items-center">
        <div className="p-4 rounded-full bg-orange-100 shadow-lg">
          <Icon className="h-8 w-8 text-orange-400" />
        </div>
        <p className="text-2xl text-blue-900 text-center">{data.label}</p>
        <p className="text-center">{data.desc}</p>
      </div>
    </div>
  );
};

export default InfoCards;
