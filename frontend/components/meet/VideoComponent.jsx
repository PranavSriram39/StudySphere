import { userDetailsStore } from "@/store/userStore";
import { MicOff, VideoOff } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { isMobile } from "react-device-detect";
import ReactPlayer from "react-player";
const MAX_MEMBERS = 5;
const VideoComponent = ({ players, screenStream }) => {
  const numberOfVideos = Object.keys(players).length;
  const userDetails = userDetailsStore((state) => state.userDetails);
  return (
    <div
      className={`grid gap-6 place-items-center transition flex-1 p-4 h-[calc(100vh-68px-78px-42px)]`}
      style={{
        gridTemplateColumns: `${
          !screenStream && !isMobile
            ? `repeat(${Math.min(numberOfVideos, 3)}, minmax(0, 1fr))`
            : "none"
        }`,
        gridTemplateRows: `${
          !screenStream && isMobile
            ? `repeat(${Math.min(numberOfVideos, 3)}, minmax(0, 1fr))`
            : "none"
        }`,
      }}
    >
      {screenStream && (
        <div className="screen w-full h-full grid place-items-center">
          <ReactPlayer
            url={screenStream}
            playing
            muted
            width="80%"
            height="90%"
          ></ReactPlayer>
        </div>
      )}
      {!screenStream &&
        Object.keys(players)
          .slice(0, MAX_MEMBERS)
          .map((playerId) => {
            const { url, playing, muted, name, image } = players[playerId];
            return (
              <div
                // className={`relative ${playing && "w-full"} ${
                className={`relative ${
                  numberOfVideos === 3 ? "md:h-1/2 h-full" : "h-full"
                }`}
                key={playerId}
              >
                <ReactPlayer
                  url={url}
                  playing={playing}
                  muted={muted}
                  width="100%"
                  height="100%"
                />
                {!playing && (
                  <div className="absolute top-0 rounded-2xl bg-black w-full h-full flex justify-center items-center">
                    {image ? (
                      <Image
                        src={image}
                        alt="org logo"
                        width="100"
                        height="100"
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="bg-nack flex justify-center items-center h-24 w-24 rounded-full">
                        <p className="text-2xl text-center">{name[0]}</p>
                      </div>
                    )}
                  </div>
                )}
                {muted && (
                  <div
                    className={` ${
                      numberOfVideos < 3 ? "px-4 py-3" : "px-3 py-2"
                    } absolute top-0 right-0 bg-[rgb(0,0,0,0.7)] text-white p-4 rounded-bl-xl rounded-tr-xl`}
                  >
                    <MicOff size={numberOfVideos < 3 ? 19 : 14} />
                  </div>
                )}
                {!playing && (
                  <div
                    className={` ${
                      numberOfVideos < 3 ? "px-4 py-3" : "px-3 py-2"
                    }
                absolute top-0 left-0 bg-[rgb(0,0,0,0.7)] text-white rounded-br-xl rounded-tl-xl`}
                  >
                    <VideoOff size={numberOfVideos < 3 ? 19 : 14} />
                  </div>
                )}
                <div className="absolute bottom-0 right-0">
                  {name && (
                    <p
                      className={`${
                        numberOfVideos < 3
                          ? "text-sm px-4 py-3"
                          : "text-[9px] px-3 py-2"
                      } bg-[rgb(0,0,0,0.7)] text-white rounded-br-xl rounded-tl-xl`}
                    >
                      {name}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      {Object.keys(players).length > MAX_MEMBERS && (
        <div
          className={`bg-black text-white w-full ${
            numberOfVideos == 3 ? "h-1/2" : "h-full"
          } rounded-md flex justify-center items-center`}
        >
          More {Object.keys(players).length - MAX_MEMBERS} people...
        </div>
      )}
    </div>
  );
};

export default VideoComponent;
