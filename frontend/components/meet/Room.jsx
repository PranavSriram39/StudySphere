"use client";
import React, { useEffect, useState } from "react";
import usePlayer from "./usePlayer";
import socket from "@/lib/socketInstance";
import { useParams } from "next/navigation";
import Peer from "peerjs";
import { userDetailsStore } from "@/store/userStore";
import BottomControl from "./BottomControl";
import { cloneDeep, isEmpty } from "lodash";
import VideoComponent from "./VideoComponent";
import UserSideBar from "./UserSideBar";
import MeetHeader from "./MeetHeader";

const Room = () => {
  const [myPeer, setMyPeer] = useState(null);
  const [peerIns, setPeerIns] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const roomId = useParams().id;
  const { players, setPlayers, toggleAudio, toggleVideo, leaveRoom } =
    usePlayer(myPeer, peerIns);
  const [users, setUser] = useState([]);
  const [show, setShow] = useState(false);
  const [peerCall, setPeerCall] = useState(null);
  const [time, setTime] = useState(0);
  const userDetails = userDetailsStore((state) => state.userDetails);
  const [messageDetails, setMessageDetails] = useState([
    {
      name: "",
      content: "",
    },
  ]);
  const [id, setId] = useState(0);
  const [isScreenSharing, setScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initPeer = () => {
      const peer = new Peer();
      peer.on("open", (id) => {
        // console.log("Your peer id is " + id);
        setMyPeer(id);
        socket.emit(
          "join-room",
          roomId,
          id,
          userDetails?.name,
          userDetails?.image
        );
      });

      peer.on("call", (call) => {
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: true })
          .then((stream) => {
            setMyStream(stream);
            setPlayers((prev) => ({
              ...prev,
              [myPeer]: {
                url: stream,
                playing: urlParams.get("playing") == "false" ? false : true,
                muted: urlParams.get("muted") == "false" ? false : true,
                name: userDetails.name,
                image: userDetails.image,
              },
            }));
            call.answer(stream);
            setPeerCall(call);
            call.on("stream", (incomingStream) => {
              const userName = call.metadata.name;
              const nTime = call.metadata.time;
              const nImage = call.metadata.image;
              const screenShareId = call.metadata.screenShareId;
              setTime(nTime);
              // console.log("Incoming Stream: ", incomingStream);
              if (screenShareId) {
                setScreenStream(incomingStream);
              }
              setPlayers((prev) => ({
                ...prev,
                [screenShareId ? screenShareId : call.peer]: {
                  url: incomingStream,
                  playing: true,
                  muted: true,
                  name: userName,
                  image: nImage,
                },
              }));
              setUser((prev) => ({
                ...prev,
                [screenShareId ? screenShareId : call.peer]: call,
              }));
            });
          })
          .catch((err) =>
            console.error("Error while accessing video stream: ", err)
          );
      });

      peer.on("error", (err) => {
        console.error("PeerJS error: ", err);
      });

      return peer;
    };

    const connectToNewUser = (userId, stream, peer, userName, image) => {
      const call = peer.call(userId, stream, {
        metadata: {
          name: userDetails.name,
          time: time,
          image: userDetails.image,
        },
      });

      if (call) {
        setPeerCall(call);
        call.on("stream", (incomingStream) => {
          // console.log("Incoming Stream: ", incomingStream);
          setPlayers((prev) => ({
            ...prev,
            [userId]: {
              url: incomingStream,
              playing: true,
              muted: true,
              name: userName,
              image: image,
            },
          }));
          setUser((prev) => ({
            ...prev,
            [userId]: call,
          }));
        });
      } else {
        console.error("Call object is undefined.");
      }
    };

    const peerInstance = initPeer();
    setPeerIns(peerInstance);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        setPlayers((prev) => ({
          ...prev,
          [myPeer]: {
            url: stream,
            playing: urlParams.get("playing") == "false" ? false : true,
            muted: urlParams.get("muted") == "false" ? false : true,
            name: userDetails.name,
            image: userDetails.image,
          },
        }));
        socket.on("user-connected", (userId, userName, image) => {
          connectToNewUser(userId, stream, peerInstance, userName, image);
        });
      })
      .catch((err) =>
        console.error("Error accessing camera and microphone:", err)
      );

    return () => {
      socket.off("user-connected", (userId) => {
        // cleanup
      });
      peerInstance.destroy();
    };
  }, []);

  useEffect(() => {
    const handleToggleAudio = (userId) => {
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].muted = !copy[userId].muted;
        return { ...copy };
      });
    };

    const handleToggleVideo = (userId) => {
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        copy[userId].playing = !copy[userId].playing;
        return { ...copy };
      });
    };

    const handleUserLeave = (userId) => {
      setScreenStream(null);
      users[userId]?.close();
      setPlayers((prevPlayers) => {
        const { [userId]: _, ...newPlayers } = prevPlayers;
        return newPlayers;
      });
    };

    const handleMessageEvent = (message, userName) => {
      setMessageDetails((prev) => [
        ...prev,
        { name: userName, content: message },
      ]);
    };

    socket.on("user-toggle-audio", handleToggleAudio);
    socket.on("user-toggle-video", handleToggleVideo);
    socket.on("user-send-message", handleMessageEvent);
    socket.on("user-leave", handleUserLeave);
    return () => {
      socket.off("user-toggle-audio", handleToggleAudio);
      socket.off("user-toggle-video", handleToggleVideo);
      socket.off("user-send-message", handleMessageEvent);
      socket.off("user-leave", handleUserLeave);
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setTime(time + 1);
    }, 1000);
  }, [time]);

  const toTime = (seconds) => {
    var date = new Date(null);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8);
  };

  const startScreenSharing = () => {
    try {
      let nId = Math.random().toString();
      setId(nId);
      navigator.mediaDevices
        .getDisplayMedia({
          video: { cursor: "always" },
        })
        .then((stream) => {
          setScreenStream(stream);
          setScreenSharing(true);
          Object.keys(users).forEach((userId) => {
            const call = peerIns.call(userId, stream, {
              metadata: {
                name: userDetails?.name,
                time: time,
                screenShareId: nId,
              },
            });

            if (call) {
              setPeerCall(call);
              call.on("stream", (incomingStream) => {
                // console.log("Incoming Stream2: ", incomingStream);
                setUser((prev) => ({
                  ...prev,
                  [id]: call,
                }));
              });
            } else {
              console.error("Call object is undefined.");
            }
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (error) {
      console.error("Error while accessing video stream: ", error);
    }
  };

  const stopScreenSharing = () => {
    try {
      const tracks = screenStream.getTracks();
      tracks.forEach((t) => t.stop());
      setScreenStream(null);
      setScreenSharing(false);
      users[id]?.close();
      socket.emit("user-leave", id, roomId);
    } catch (error) {}
  };

  const toggleScreenSharing = () => {
    if (isScreenSharing) {
      stopScreenSharing();
    } else {
      startScreenSharing();
    }
  };


  return (
    <div className="h-screen flex w-full bg-[#101825] overflow-hidden">
      <div className="flex-1">
        {/* Header */}
        <MeetHeader time={time} toTime={toTime} />

        <div className="rounded-md flex flex-col gap-3 h-[calc(100vh-68px)]">
          {/* Video Component */}
          <VideoComponent
            players={players}
            screenStream={screenStream}
            isScreenSharing={isScreenSharing}
          />

          {/* BottomControl */}
          {!isEmpty(players) && (
            <BottomControl
              playing={players[null].playing}
              muted={players[null].muted}
              toggleAudio={toggleAudio}
              toggleVideo={toggleVideo}
              leaveRoom={leaveRoom}
              setShow={setShow}
              show={show}
              isScreenSharing={isScreenSharing}
              toggleScreenSharing={toggleScreenSharing}
            />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <UserSideBar
        players={players}
        setShow={setShow}
        show={show}
        setMessageDetails={setMessageDetails}
        messageDetails={messageDetails}
      />
    </div>
  );
};

export default Room;
