import { supabase } from '../supabase';
import { Attachment } from '@boom-power/types';
import { storageService } from './storageService';

export const attachmentService = {
  async getTicketAttachments(ticketId: string): Promise<Attachment[]> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .is('communication_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(attachment => ({
      id: attachment.id,
      name: attachment.file_name,
      size: attachment.file_size,
      type: attachment.file_type,
      url: attachment.file_url,
      createdAt: attachment.created_at
    }));
  },

  async getCommunicationAttachments(communicationId: string): Promise<Attachment[]> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('communication_id', communicationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(attachment => ({
      id: attachment.id,
      name: attachment.file_name,
      size: attachment.file_size,
      type: attachment.file_type,
      url: attachment.file_url,
      createdAt: attachment.created_at
    }));
  },

  async uploadTicketAttachments(
    files: File[],
    ticketId: string,
  ): Promise<Attachment[]> {
    if (files.length === 0) return [];
    const uploadedFiles = await storageService.uploadFiles(files, ticketId);
    return uploadedFiles.map((file: any) => ({
      id: file.id,
      name: file.file_name,
      size: file.file_size,
      type: file.file_type,
      url: file.file_url,
      createdAt: file.created_at
    }));
  },

  async uploadCommunicationAttachments(
    files: File[],
    ticketId: string,
    communicationId: string,
  ): Promise<Attachment[]> {
    if (files.length === 0) return [];
    const uploadedFiles = await storageService.uploadFiles(files, ticketId, communicationId);
    return uploadedFiles.map((file: any) => ({
      id: file.id,
      name: file.file_name,
      size: file.file_size,
      type: file.file_type,
      url: file.file_url,
      createdAt: file.created_at
    }));
  },

  async deleteAttachment(attachmentId: string): Promise<void> {
    await storageService.deleteFile(attachmentId);
  },

  async downloadAttachment(attachment: Attachment): Promise<void> {
    await storageService.downloadFile(attachment.id);
  }
};