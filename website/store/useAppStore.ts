import { create } from 'zustand'

interface User {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
}

interface AppStore {
  showUpload: boolean;
  setShowUpload: (show: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  showUpload: false,
  setShowUpload: (showUpload) => set({ showUpload }),
}))
