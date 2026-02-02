import "aos/dist/aos.css";
import MainPage from "@/components/Landing/MainPage";
import ParentLayout from "@/components/Layouts/ParentLayout";
import { isLoggedIn } from "@/lib/isLoggedIn";

export default function Home() {
  isLoggedIn();
  return (
    <ParentLayout id="home" className="scrollbar-none">
      <MainPage />
    </ParentLayout>
  );
}
