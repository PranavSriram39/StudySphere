import { create } from "zustand";

export const channelStore = create((set) => ({
  channelDetails: {},
  setChannelDetails: (data) => set(() => ({ channelDetails: data })),
  isActiveMobile: false,
  setActiveMobile: (data) => set(() => ({ isActiveMobile: data })),
}));
