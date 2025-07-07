import { supabase } from '../supabase';
import { Communication } from '../../types';

export const communicationService = {
  async getCommunications(ticketId: string) {
    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error('Invalid ticket ID');
    }

    const { data, error } = await supabase
      .from('communications')
      .select(`
        *,
        user:profiles(name),
        attachments:attachments(*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    
    // Transform the data to match the Communication interface
    return data.map(comm => ({
      id: comm.id,
      ticketId: comm.ticket_id,
      userId: comm.user_id,
      user: {
        firstName: comm.user?.name?.split(' ')[0] || '',
        lastName: comm.user?.name?.split(' ')[1] || '',
        email: comm.user?.email || ''
      },
      message: comm.message,
      attachments: (comm.attachments || []).map((att: any) => ({
        id: att.id,
        name: att.file_name,
        size: att.file_size,
        type: att.file_type,
        url: att.file_url,
        createdAt: att.created_at
      })),
      createdAt: comm.created_at
    })) as Communication[];
  },

  async createCommunication(communication: Omit<Communication, 'id' | 'createdAt'>) {
    // Ensure ticketId is converted to integer if it's a string with format 'T00007'

    const { data, error } = await supabase
      .from('communications')
      .insert([{
        ticket_id: communication.ticketId,
        user_id: communication.userId,
        message: communication.message
      }])
      .select(`
        *,
        user:profiles(name),
        attachments:attachments(*)
      `)
      .single();

    if (error) throw error;
    
    // Transform the data to match the Communication interface
    const transformedData = {
      id: data.id,
      ticketId: data.ticket_id,
      userId: data.user_id,
      user: {
        firstName: data.user?.name?.split(' ')[0] || '',
        lastName: data.user?.name?.split(' ')[1] || '',
        email: data.user?.email || ''
      },
      message: data.message,
      attachments: (data.attachments || []).map((att: any) => ({
        id: att.id,
        name: att.file_name,
        size: att.file_size,
        type: att.file_type,
        url: att.file_url,
        createdAt: att.created_at
      })),
      createdAt: data.created_at
    };
    
    return transformedData as Communication;
  }
};
