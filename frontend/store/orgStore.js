import { create } from "zustand";

export const orgStore = create((set) => ({
  orgDetails: {},
  setOrgDetails: (data) => set(() => ({ orgDetails: data })),
}));
