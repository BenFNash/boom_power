import { supabase } from '../supabase';
import { Communication } from '../../types';

export const communicationService = {
  async getCommunications(ticketId: string) {
    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error('Invalid ticket ID');
    }

    // Extract the numeric portion and convert to integer
    const numericId = parseInt(ticketId.replace(/\D/g, ''));
    if (isNaN(numericId)) {
      throw new Error('Invalid ticket ID format');
    }

    const { data, error } = await supabase
      .from('communications')
      .select(`
        *,
        user:profiles(name)
      `)
      .eq('ticket_id', numericId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as Communication[];
  },

  async createCommunication(communication: Omit<Communication, 'id' | 'createdAt'>) {
    // Ensure ticket_id is converted to integer if it's a string with format 'T00007'
    if (typeof communication.ticket_id === 'string') {
      const numericId = parseInt(communication.ticket_id.replace(/\D/g, ''));
      if (isNaN(numericId)) {
        throw new Error('Invalid ticket ID format');
      }
      communication.ticket_id = numericId;
    }

    const { data, error } = await supabase
      .from('communications')
      .insert([communication])
      .select()
      .single();

    if (error) throw error;
    return data as Communication;
  }
};