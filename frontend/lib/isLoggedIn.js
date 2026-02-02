const { cookies } = require("next/headers");
const { redirect } = require("next/navigation");

export const isLoggedIn = () => {
  const token = cookies().get("token")?.value;
  const org = cookies().get("org")?.value;
  if (token && org) {
    redirect("/organization/" + org);
  }
};
