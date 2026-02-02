import { create } from "zustand";

export const activeOrgChannel = create((set) => ({
  orgChannel: "General",
  setOrgChannel: (data) => set(() => ({ orgChannel: data })),
}));
