import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const activeOrgChannel = create(
  persist(
    (set) => ({
      orgChannel: "General",
      setOrgChannel: (data) => set(() => ({ orgChannel: data })),
    }),
    {
      name: "ss-active-org-channel", // unique key in sessionStorage
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
