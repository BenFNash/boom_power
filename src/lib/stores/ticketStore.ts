import { create } from 'zustand';
import { Ticket } from '../../types';
import { ticketService } from '../services/ticketService';

interface TicketCounts {
  total: number;
  open: number;
  assigned: number;
  resolved: number;
  cancelled: number;
  closed: number;
  overdue: number;
}

interface TicketState {
  tickets: Ticket[];
  ticketCounts: TicketCounts;
  isLoading: boolean;
  error: string | null;
  fetchTickets: () => Promise<void>;
  fetchTicketCounts: () => Promise<void>;
  createTicket: (ticket: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTicket: (id: string, ticket: Partial<Ticket>) => Promise<void>;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  ticketCounts: {
    total: 0,
    open: 0,
    assigned: 0,
    resolved: 0,
    cancelled: 0,
    closed: 0,
    overdue: 0
  },
  isLoading: false,
  error: null,

  fetchTickets: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await ticketService.getTickets();
      set({ tickets: response.data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false, tickets: [] });
    }
  },

  fetchTicketCounts: async () => {
    try {
      set({ isLoading: true, error: null });
      const counts = await ticketService.getTicketCounts();
      set({ ticketCounts: counts, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTicket: async (ticket) => {
    try {
      set({ isLoading: true, error: null });

      // Validation checks
      if (!ticket.whoRaisedId) {
        throw new Error('User ID is required to create a ticket');
      }

      if (!ticket.site) {
        throw new Error('Site is required');
      }

      if (!ticket.siteOwnerCompany) {
        throw new Error('Site owner company is required');
      }

      const newTicket = await ticketService.createTicket(ticket);
      
      set(state => ({
        tickets: [newTicket, ...state.tickets],
        isLoading: false,
        error: null
      }));

      // Refresh ticket counts
      await ticketService.getTicketCounts();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating the ticket';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  },

  updateTicket: async (id: string, ticket: Partial<Ticket>) => {
    try {
      set({ isLoading: true, error: null });
      const updatedTicket = await ticketService.updateTicket(id, ticket);
      
      set(state => ({
        tickets: state.tickets.map((t) => t.id === id ? updatedTicket : t),
        isLoading: false,
        error: null
      }));

      // Refresh ticket counts
      await ticketService.getTicketCounts();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating the ticket';
      set({ 
        isLoading: false, 
        error: errorMessage 
      });
      throw error;
    }
  }
}));