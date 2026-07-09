"use client";
import React, { useMemo, useState, useEffect } from "react";
import { BsInfoCircle } from "react-icons/bs";
import { MdOutlineLeaderboard, MdOutlineRecentActors } from "react-icons/md";
import { GiProgression } from "react-icons/gi";
import { TbLogout } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";
import Info from "./Info";
import LeadInfo from "./LeadInfo";
import Schedule from "./Schedule";
import Progressbar from "./Progressbar";
import Logout from "./Logout";
import classNames from "classnames";
import { userDetailsStore } from "@/store/userStore";
import { getRequest, patchRequest } from "@/config/axiosInterceptor";
import { getCookie } from "cookies-next";
import toast from "react-hot-toast";
import {
  profileApi,
  profileActivityApi,
  profileProgressApi,
  profileUpcomingApi
} from "@/components/Constants/apiEndpoints";
import { Camera, Trash2, X } from "lucide-react";

const Profile = () => {
  const [active, setActive] = useState("Info");
  const [mounted, setMounted] = useState(false);
  const [isLoading, setLoading] = useState(true);

  // Profile data states
  const [profileData, setProfileData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [progressReport, setProgressReport] = useState(null);
  const [upcomingActivities, setUpcomingActivities] = useState([]);

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    phone: "",
    linkedin: "",
    github: "",
    portfolio: "",
    skills: "",
    image: ""
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const userDetails = userDetailsStore((state) => state.userDetails);
  const getUserDetails = userDetailsStore((state) => state.getUserDetails);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProfileAllData = async () => {
    try {
      setLoading(true);
      const token = getCookie("token");

      // Fetch base profile data
      const baseResponse = await getRequest({
        url: profileApi,
        token
      });

      if (baseResponse.data?.status) {
        const pData = baseResponse.data.data;
        setProfileData(pData);
        setEditForm({
          name: pData.user.name || "",
          bio: pData.user.bio || "",
          phone: pData.user.phone || "",
          linkedin: pData.user.linkedin || "",
          github: pData.user.github || "",
          portfolio: pData.user.portfolio || "",
          skills: pData.user.skills?.join(", ") || "",
          image: pData.user.image || ""
        });
        setImagePreview(pData.user.image || null);
      }

      // Fetch activity logs
      const actResponse = await getRequest({
        url: profileActivityApi,
        token
      });
      if (actResponse.data?.status) {
        setActivities(actResponse.data.data);
      }

      // Fetch progress report
      const progResponse = await getRequest({
        url: profileProgressApi,
        token
      });
      if (progResponse.data?.status) {
        setProgressReport(progResponse.data.data);
      }

      // Fetch upcoming activities
      const upResponse = await getRequest({
        url: profileUpcomingApi,
        token
      });
      if (upResponse.data?.status) {
        setUpcomingActivities(upResponse.data.data);
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchProfileAllData();
    }
  }, [mounted]);

  // Initials Avatar generator
  const getInitials = (name) => {
    if (!name) return "SP";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Profile Picture Upload Handler
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Validate format
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Supported formats are JPG, JPEG, PNG, WEBP");
      return;
    }

    // Set preview locally first
    setImagePreview(URL.createObjectURL(file));

    try {
      setUploadingImage(true);
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", "study-nex");
      data.append("cloud_name", "dgu3ljso6");

      const response = await fetch("https://api.cloudinary.com/v1_1/dgu3ljso6/image/upload", {
        method: "POST",
        body: data,
      });
      const resData = await response.json();
      
      if (resData?.secure_url) {
        setEditForm(prev => ({ ...prev, image: resData.secure_url }));
        toast.success("Image uploaded. Save to apply changes.");
      } else {
        toast.error("Image upload failed.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit Profile Edits
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await patchRequest({
        url: profileApi,
        body: editForm,
        token: getCookie("token")
      });

      if (response.data?.status) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        // Refresh global details store (Zustand)
        await getUserDetails();
        // Reload all stats
        await fetchProfileAllData();
      } else {
        toast.error(response.data?.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  const menuData = useMemo(
    () => [
      {
        label: "Your Info",
        tab: "Info",
        Icon: BsInfoCircle,
      },
      {
        label: "Schedule",
        tab: "Schedule",
        Icon: MdOutlineRecentActors,
      },
      {
        label: "Progress Report",
        tab: "Progressbar",
        Icon: GiProgression,
      },
      {
        label: "Leader board",
        tab: "LeaderInfo",
        Icon: MdOutlineLeaderboard,
      },
      {
        label: "Logout",
        tab: "Logout",
        Icon: TbLogout,
      },
    ],
    []
  );

  // Error / Retry State if load fails
  if (!isLoading && !profileData) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 max-w-md mx-auto text-center min-h-[50vh] text-slate-200">
        <div className="text-rose-500 font-black text-lg">Failed to Load Profile</div>
        <p className="text-xs text-slate-450">
          We couldn&apos;t retrieve your profile data from the server. Please check your connection and retry.
        </p>
        <button
          onClick={fetchProfileAllData}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
        >
          Retry Fetch
        </button>
      </div>
    );
  }

  // Skeleton UI
  if (isLoading || !profileData) {
    return (
      <div className="flex flex-col animate-pulse px-6 py-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="h-44 bg-slate-800 rounded-2xl flex items-end p-6 gap-6">
          <div className="w-28 h-28 rounded-full bg-slate-700 border-4 border-slate-900" />
          <div className="space-y-3 pb-2">
            <div className="h-6 w-48 bg-slate-700 rounded" />
            <div className="h-4 w-32 bg-slate-700 rounded" />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-60 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-slate-800 rounded-lg" />
            ))}
          </div>
          <div className="flex-1 h-96 bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const { user, organization, channels, leaderboard, roleData } = profileData;

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full px-4 lg:px-8 py-6">
      
      {/* Profile Cover Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800/80 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl mb-8">
        
        {/* User Details Left */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl bg-slate-800 flex items-center justify-center text-3xl font-black text-white uppercase">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{getInitials(user.name)}</span>
              )}
            </div>
            {/* Status indicator */}
            <span className="absolute bottom-1 right-1 w-5.5 h-5.5 bg-emerald-500 border-4 border-slate-950 rounded-full" title="Online" />
          </div>

          {/* Titles */}
          <div className="text-center md:text-left space-y-1.5">
            <h1 className="text-2xl font-black text-white leading-tight flex flex-wrap items-center justify-center md:justify-start gap-2">
              {user.name}
              <span className="text-xs font-semibold px-2 py-0.5 bg-blue-900/60 border border-blue-800 text-blue-300 rounded-full">
                {roleData.role || "Member"}
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">@{user.username} | {user.email}</p>
            <p className="text-xs text-slate-500">
              Joined {new Date(user.createdAt).toLocaleDateString()} | Last Active: {new Date(user.lastLogin || Date.now()).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Buttons / Quick stats right */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center md:text-right">
          <div className="bg-slate-900/80 border border-slate-800/60 p-4 rounded-2xl flex gap-6 text-xs text-slate-350">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Rank</span>
              <strong className="text-base text-blue-400 font-mono font-black">#{leaderboard.currentRank}</strong>
            </div>
            <div className="w-[1px] bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Streak</span>
              <strong className="text-base text-orange-400 font-mono font-black">{user.currentStreak}d</strong>
            </div>
            <div className="w-[1px] bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Level</span>
              <strong className="text-base text-purple-400 font-black">{leaderboard.performanceLevel}</strong>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            Edit Profile
          </button>
        </div>

      </div>

      {/* Main Body Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-60 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-900/80 shrink-0 select-none scrollbar-none pb-3 lg:pb-2">
          {menuData.map((item, index) => {
            const Icon = item.Icon;
            const isActive = active === item.tab;
            return (
              <button
                key={index}
                onClick={() => setActive(item.tab)}
                className={classNames(
                  "flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold transition w-full whitespace-nowrap",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Tab Panel Content Box */}
        <div className="flex-1 bg-slate-900/40 border border-slate-850 rounded-2xl p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {active === "Info" && (
              <motion.div
                key="info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Info profileData={profileData} />
              </motion.div>
            )}
            {active === "Schedule" && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Schedule activities={activities} upcoming={upcomingActivities} />
              </motion.div>
            )}
            {active === "Progressbar" && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Progressbar report={progressReport} />
              </motion.div>
            )}
            {active === "LeaderInfo" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <LeadInfo profileData={profileData} />
              </motion.div>
            )}
            {active === "Logout" && (
              <motion.div key="logout">
                <Logout />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Profile Edit Overlay Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-white text-base">Edit User Profile</h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveProfile} className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-200">
                
                {/* Photo uploader */}
                <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-800/80 pb-5">
                  <div className="relative group shrink-0 w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-850 flex items-center justify-center text-2xl font-bold uppercase text-slate-300">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span>{getInitials(editForm.name)}</span>
                    )}

                    {uploadingImage && (
                      <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center text-xs">
                        Loading...
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                      <Camera size={14} /> Upload Picture
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/jpg,image/webp"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </label>
                    
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setEditForm(prev => ({ ...prev, image: "" }));
                        }}
                        className="px-3.5 py-2 bg-rose-950/60 border border-rose-900 text-rose-400 hover:bg-rose-900 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450 block">Full Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450 block">Phone Number</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450 block">Bio Description</label>
                    <textarea
                      rows={2.5}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition resize-none"
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Write a brief overview about yourself..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450 block">LinkedIn Profile</label>
                    <input
                      type="url"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm(prev => ({ ...prev, linkedin: e.target.value }))}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450 block">GitHub Profile</label>
                    <input
                      type="url"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                      value={editForm.github}
                      onChange={(e) => setEditForm(prev => ({ ...prev, github: e.target.value }))}
                      placeholder="https://github.com/..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450 block">Portfolio Website</label>
                    <input
                      type="url"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                      value={editForm.portfolio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, portfolio: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-450 block">Skills (comma separated)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      value={editForm.skills}
                      onChange={(e) => setEditForm(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="React, NextJS, Python, MongoDB"
                    />
                  </div>
                </div>

                {/* Submit button footer inside form */}
                <div className="pt-4 border-t border-slate-800/80 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-800 bg-slate-950 hover:bg-slate-850 rounded-xl text-xs font-bold text-slate-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImage}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Profile;
