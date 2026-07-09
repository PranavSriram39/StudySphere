"use client";
import React, { useEffect, useState, useRef } from "react";
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
  const [users, setUser] = useState({});
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

  const myStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerRef = useRef(null);
  const usersRef = useRef({});
  const userDetailsRef = useRef(userDetails);
  const timeRef = useRef(time);
  const screenShareIdRef = useRef(null);

  useEffect(() => {
    userDetailsRef.current = userDetails;
  }, [userDetails]);

  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        myStreamRef.current = stream;

        setPlayers((prev) => ({
          ...prev,
          null: {
            url: stream,
            playing: urlParams.get("playing") === "false" ? false : true,
            muted: urlParams.get("muted") === "false" ? false : true,
            name: userDetailsRef.current?.name,
            image: userDetailsRef.current?.image,
          },
        }));

        const peer = new Peer();
        peerRef.current = peer;
        setPeerIns(peer);

        peer.on("open", (id) => {
          setMyPeer(id);
          socket.emit(
            "join-room",
            roomId,
            id,
            userDetailsRef.current?.name,
            userDetailsRef.current?.image
          );
        });

        peer.on("call", (call) => {
          if (myStreamRef.current) {
            call.answer(myStreamRef.current);
            setPeerCall(call);

            call.on("stream", (incomingStream) => {
              const userName = call.metadata?.name;
              const nTime = call.metadata?.time;
              const nImage = call.metadata?.image;
              const screenShareId = call.metadata?.screenShareId;

              if (nTime !== undefined) {
                setTime(nTime);
              }
              if (screenShareId) {
                setScreenStream(incomingStream);
                screenStreamRef.current = incomingStream;
              }

              const displayId = screenShareId ? screenShareId : call.peer;
              setPlayers((prev) => ({
                ...prev,
                [displayId]: {
                  url: incomingStream,
                  playing: true,
                  muted: true,
                  name: userName,
                  image: nImage,
                },
              }));

              setUser((prev) => {
                const updated = {
                  ...prev,
                  [displayId]: call,
                };
                usersRef.current = updated;
                return updated;
              });
            });
          }
        });

        peer.on("error", (err) => {
          console.error("PeerJS error: ", err);
        });

        const handleUserConnected = (userId, userName, image) => {
          if (myStreamRef.current && peerRef.current) {
            const call = peerRef.current.call(userId, myStreamRef.current, {
              metadata: {
                name: userDetailsRef.current?.name,
                time: timeRef.current,
                image: userDetailsRef.current?.image,
              },
            });

            if (call) {
              setPeerCall(call);
              call.on("stream", (incomingStream) => {
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

                setUser((prev) => {
                  const updated = {
                    ...prev,
                    [userId]: call,
                  };
                  usersRef.current = updated;
                  return updated;
                });
              });
            } else {
              console.error("Call object is undefined.");
            }
          }
        };

        socket.on("user-connected", handleUserConnected);
        myStreamRef.current._handleUserConnected = handleUserConnected;
      })
      .catch((err) =>
        console.error("Error accessing camera and microphone:", err)
      );

    return () => {
      if (myStreamRef.current && myStreamRef.current._handleUserConnected) {
        socket.off("user-connected", myStreamRef.current._handleUserConnected);
      }

      if (myStreamRef.current) {
        myStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (usersRef.current) {
        Object.values(usersRef.current).forEach((call) => {
          try {
            call.close();
          } catch (e) {
            console.error("Error closing call on unmount:", e);
          }
        });
      }

      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [roomId, setPlayers]);

  useEffect(() => {
    const handleToggleAudio = (userId) => {
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[userId]) {
          copy[userId].muted = !copy[userId].muted;
        }
        return { ...copy };
      });
    };

    const handleToggleVideo = (userId) => {
      setPlayers((prev) => {
        const copy = cloneDeep(prev);
        if (copy[userId]) {
          copy[userId].playing = !copy[userId].playing;
        }
        return { ...copy };
      });
    };

    const handleUserLeave = (userId) => {
      setScreenStream(null);
      if (usersRef.current && usersRef.current[userId]) {
        try {
          usersRef.current[userId].close();
        } catch (e) {
          console.error("Error closing call on user leave:", e);
        }
        setUser((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          usersRef.current = updated;
          return updated;
        });
      }
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
  }, [setPlayers]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toTime = (seconds) => {
    var date = new Date(null);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8);
  };

  const startScreenSharing = () => {
    try {
      let nId = Math.random().toString();
      screenShareIdRef.current = nId;
      setId(nId);
      navigator.mediaDevices
        .getDisplayMedia({
          video: { cursor: "always" },
        })
        .then((stream) => {
          setScreenStream(stream);
          screenStreamRef.current = stream;
          setScreenSharing(true);

          stream.getVideoTracks()[0].onended = () => {
            stopScreenSharing();
          };

          Object.keys(usersRef.current || {}).forEach((userId) => {
            const call = peerRef.current.call(userId, stream, {
              metadata: {
                name: userDetailsRef.current?.name,
                time: timeRef.current,
                screenShareId: nId,
              },
            });

            if (call) {
              setPeerCall(call);
              call.on("stream", (incomingStream) => {
                setUser((prev) => {
                  const updated = {
                    ...prev,
                    [nId]: call,
                  };
                  usersRef.current = updated;
                  return updated;
                });
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
      if (screenStreamRef.current) {
        const tracks = screenStreamRef.current.getTracks();
        tracks.forEach((t) => t.stop());
      }
      setScreenStream(null);
      screenStreamRef.current = null;
      setScreenSharing(false);

      const currentScreenId = screenShareIdRef.current;
      if (currentScreenId) {
        if (usersRef.current && usersRef.current[currentScreenId]) {
          try {
            usersRef.current[currentScreenId].close();
          } catch (e) {
            console.error("Error closing screen share call:", e);
          }
          setUser((prev) => {
            const updated = { ...prev };
            delete updated[currentScreenId];
            usersRef.current = updated;
            return updated;
          });
        }
        socket.emit("user-leave", currentScreenId, roomId);
        screenShareIdRef.current = null;
      }
    } catch (error) {
      console.error("Error stopping screen sharing: ", error);
    }
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
