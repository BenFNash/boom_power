import { create } from 'zustand';
import { User } from '../../types';
import { userService } from '../services/userService';

interface UserState {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await userService.getUsers();
      set({ users, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateUser: async (id: string, data: Partial<User>) => {
    set({ loading: true, error: null });
    try {
      await userService.updateUser(id, data);
      const users = await userService.getUsers();
      set({ users, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  deleteUser: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await userService.deleteUser(id);
      const users = await userService.getUsers();
      set({ users, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  sendPasswordResetEmail: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await userService.sendPasswordResetEmail(email);
      set({ loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error; // Re-throw to allow handling in the component
    }
  }
}));
