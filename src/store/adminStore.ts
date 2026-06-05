import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminStore {
  isLoggedIn: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const ADMIN_PASSWORD = 'admin1234';

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      login: (password) => {
        if (password === ADMIN_PASSWORD) {
          set({ isLoggedIn: true });
          return true;
        }
        return false;
      },
      logout: () => set({ isLoggedIn: false }),
    }),
    { name: 'train-signal-admin' }
  )
);
