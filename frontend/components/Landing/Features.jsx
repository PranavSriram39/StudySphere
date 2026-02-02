import Image from "next/image";
import React, { useEffect } from "react";
import Aos from "aos";
import "aos/dist/aos.css";
import Lottie from "react-lottie";

const Features = ({ data }) => {
  useEffect(() => {
    Aos.init();
  }, []);
  return (
    <div className="flex flex-col lg:flex-row gap-20 even:lg:flex-row-reverse items-center">
      <div className="flex flex-col gap-6 flex-1" data-aos="fade-right">
        <p className="text-2xl text-blue-900 font-semibold">
          <span className="text-orange-500">{data.mainLabel}</span> {data.label}
        </p>
        <p className="text-lg">{data.desc}</p>

        {data?.details && (
          <div className="grid gap-6">
            {data?.details?.map((item, index) => {
              const Icon = item.logo;
              return (
                <div className="flex gap-4 items-center" key={index}>
                  <div className="p-3 rounded-full bg-white shadow-lg shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="text-lg">{item.desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data.isLottie ? (
        <div  data-aos="fade-left" className="flex-1">
          <Lottie options={data.options}/>
        </div>
      ) : (
        <Image
          data-aos="fade-left"
          src={data.logo.src}
          width={500}
          height={500}
          alt="features"
          className="flex-1 aspect-[8/4] rounded-tr-3xl rounded-bl-3xl"
        />
      )}
    </div>
  );
};

export default Features;
