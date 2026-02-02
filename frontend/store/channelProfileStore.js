import { create } from "zustand";

export const channelProfileStore = create((set) => ({
  showChannelProfile: false,
  setShowChannelProfile: (data) => set(() => ({ showChannelProfile: data })),
}));
