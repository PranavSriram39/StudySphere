import React from "react";
import PopupContainer from "../Layouts/PopupContainer";
import Swal from "sweetalert2";
import { deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";

const Logout = () => {
  const router = useRouter();
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to access any content!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes",
    cancelButtonText: "No",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteCookie("token");
      deleteCookie("org");
      Swal.fire({
        title: "Logged out successfully!",
        text: "See you again....",
        icon: "success",
      }).then(() => {
        router.push("/login");
      });
    }
  });
  return <></>;
};

export default Logout;
