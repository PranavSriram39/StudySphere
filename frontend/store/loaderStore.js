import { create } from "zustand";

export const useLoader = create((set) => ({
  isLoading: false,
  setLoading: (data) => set(() => ({ isLoading: data })),
})); 