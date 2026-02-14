import { AnimatePresence, motion } from "framer-motion";
import React from "react";
import { IoDocumentText } from "react-icons/io5";
import { IoMdPhotos } from "react-icons/io";
import { BiSolidMoviePlay } from "react-icons/bi";
import toast from "react-hot-toast";

const MediaPopup = ({
  mediaPicker,
  setFileContent,
  setFilePreview,
  filePreview,
  setMediaPicker,
  setFileType,
}) => {
  const uploadDocument = (file) => {
    if (file === undefined) {
      toast.error("Invalid Image!");
      return;
    } else {
      setFilePreview(URL.createObjectURL(file));
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "study-nex");
      data.append("cloud_name", "doiv24r1h");
      fetch("https://api.cloudinary.com/v1_1/doiv24r1h/auto/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((res) => {
          setMediaPicker(false);
          if (res?.format === "pdf") setFileType("document");
          else setFileType(res?.resource_type?.toString());
          setFileContent(res?.secure_url?.toString());
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };
  return (
    !filePreview && (
      <AnimatePresence>
        {mediaPicker && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0 }}
            animate={{ opacity: 1, y: -100, scale: 1 }}
            exit={{
              opacity: 0,
              y: 0,
              scale: 0,
              type: "spring",
            }}
            transition={{
              duration: 0.5,
              type: "spring",
            }}
            className="absolute  -top-[80px] -left-10 lg:-left-14 grid gap-2 w-fit h-fit p-2 bg-white border border-gray-100 shadow-lg rounded-lg"
          >
            <div className="flex gap-4 relative hover:bg-gray-200 rounded-xl transition-all duration-200">
              <label
                htmlFor="documents"
                className="flex gap-2 py-2 px-3 lg:cursor-pointer"
              >
                <input
                  type="file"
                  id="documents"
                  className="hidden"
                  onChange={(e) => uploadDocument(e.target.files[0])}
                />
                <IoDocumentText className="h-5 w-5" />
                <p className="text-sm">Documents</p>
              </label>
            </div>

            <div className="flex gap-4 relative hover:bg-gray-200 rounded-xl transition-all duration-200">
              <label
                htmlFor="photos"
                className="flex gap-2 py-2 px-3 lg:cursor-pointer"
              >
                <input
                  type="file"
                  id="photos"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => uploadDocument(e.target.files[0])}
                />
                <IoMdPhotos className="h-5 w-5" />
                <p className="text-sm">Photos</p>
              </label>
            </div>

            <div className="flex gap-4 relative hover:bg-gray-200 rounded-xl transition-all duration-200">
              <label
                htmlFor="videos"
                className="flex gap-2 py-2 px-3 lg:cursor-pointer"
              >
                <input
                  type="file"
                  id="videos"
                  className="hidden"
                  accept="video/*"
                  onChange={(e) => uploadDocument(e.target.files[0])}
                />
                <BiSolidMoviePlay className="h-5 w-5" />
                <p className="text-sm">Videos</p>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  );
};

export default MediaPopup;
