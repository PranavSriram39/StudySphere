import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const generalChannelStore = create(
  persist(
    (set) => ({
      generalChannel: {},
      setGeneralChannel: (data) => set(() => ({ generalChannel: data })),
    }),
    {
      name: "generalChannel",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
