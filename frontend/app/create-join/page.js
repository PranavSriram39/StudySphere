import CreateJoin from "@/components/auth/CreateJoin";
import { isLoggedIn } from "@/lib/isLoggedIn";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

function Create() {
  const token = cookies().get("token")?.value;
  if (!token) redirect("/login");
  isLoggedIn();
  return (
    <div>
      <CreateJoin />
    </div>
  );
}

export default Create;
