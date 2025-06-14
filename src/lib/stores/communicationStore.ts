import { create } from 'zustand';
import { Communication } from '../../types';
import { communicationService } from '../services/communicationService';

interface CommunicationState {
  communications: Communication[];
  loading: boolean;
  error: string | null;
  fetchCommunications: (ticketId: string) => Promise<void>;
  createCommunication: (communication: Omit<Communication, 'id' | 'createdAt'>) => Promise<Communication>;
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  communications: [],
  loading: false,
  error: null,

  fetchCommunications: async (ticketId) => {
    set({ loading: true, error: null });
    try {
      const communications = await communicationService.getCommunications(ticketId);
      set({ communications, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createCommunication: async (communication) => {
    set({ loading: true, error: null });
    try {
      const newCommunication = await communicationService.createCommunication(communication);
      set((state) => ({
        communications: [...state.communications, newCommunication],
        loading: false
      }));
      return newCommunication;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  }
}));