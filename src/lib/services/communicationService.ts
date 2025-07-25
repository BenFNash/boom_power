import { supabase } from '../supabase';
import { Communication } from '@boom-power/types';

export const communicationService = {
  async getCommunications(ticketId: string): Promise<Communication[]> {
    if (!ticketId || typeof ticketId !== 'string') {
      throw new Error('Invalid ticket ID');
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const response = await fetch(`${supabaseUrl}/functions/v1/get-communications-for-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ticketId: ticketId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch ticket');
    }

    const result = await response.json();
    return result.data;
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
