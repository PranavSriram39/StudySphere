import Profile from "@/components/Profile/Profile";
import { isLoggedIn } from "@/lib/isLoggedIn";
import { getCookie } from "cookies-next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const profile = () => {
  const token = cookies().get("token")?.value;
  if (!token) {
    redirect("/login");
  }
  return (
    <div className="overflow-y-hidden">
      <Profile />
    </div>
  );
};

export default profile;
