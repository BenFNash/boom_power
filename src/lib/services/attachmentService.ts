import { supabase } from '../supabase';
import { Attachment } from '../../types';
import { storageService, UploadedFile } from './storageService';

export const attachmentService = {
  /**
   * Get attachments for a ticket
   */
  async getTicketAttachments(ticketId: string): Promise<Attachment[]> {

    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('ticket_id', ticketId)
      .is('communication_id', null) // Only ticket-level attachments
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

  /**
   * Get attachments for a communication
   */
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

  /**
   * Upload files and create attachment records for a ticket
   */
  async uploadTicketAttachments(
    files: File[],
    ticketId: string,
    userId: string
  ): Promise<Attachment[]> {
    if (files.length === 0) return [];

    // Upload files to storage
    const uploadedFiles = await storageService.uploadFiles(files, ticketId, userId);

    // Create attachment records in database
    const attachmentRecords = uploadedFiles.map(file => ({
      ticket_id: ticketId,
      communication_id: null,
      uploaded_by: userId,
      file_url: file.url,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: file.path // Store the file path for future operations
    }));

    const { data, error } = await supabase
      .from('attachments')
      .insert(attachmentRecords)
      .select('*');

    if (error) {
      console.error('Error creating attachment records:', error);
      throw error;
    }

    return data.map(attachment => ({
      id: attachment.id,
      name: attachment.file_name,
      size: attachment.file_size,
      type: attachment.file_type,
      url: attachment.file_url,
      createdAt: attachment.created_at
    }));
  },

  /**
   * Upload files and create attachment records for a communication
   */
  async uploadCommunicationAttachments(
    files: File[],
    ticketId: string,
    communicationId: string,
    userId: string
  ): Promise<Attachment[]> {
    if (files.length === 0) return [];

    // Upload files to storage
    const uploadedFiles = await storageService.uploadFiles(files, ticketId, userId);

    // Create attachment records in database

    const attachmentRecords = uploadedFiles.map(file => ({
      ticket_id: ticketId,
      communication_id: communicationId,
      uploaded_by: userId,
      file_url: file.url,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: file.path
    }));

    const { data, error } = await supabase
      .from('attachments')
      .insert(attachmentRecords)
      .select('*');

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

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    // Get attachment details first
    const { data: attachment, error: fetchError } = await supabase
      .from('attachments')
      .select('*')
      .eq('id', attachmentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from database
    const { error: deleteError } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) throw deleteError;

    // Use stored file path or extract from URL as fallback
    const filePath = attachment.file_path || (() => {
      const urlParts = attachment.file_url.split('/');
      return urlParts.slice(-3).join('/');
    })();
    
    try {
      await storageService.deleteFile(filePath);
    } catch (storageError) {
      console.warn('Failed to delete file from storage:', storageError);
      // Don't throw error as the database record is already deleted
    }
  },

  /**
   * Download an attachment
   */
  async downloadAttachment(attachment: Attachment): Promise<void> {
    // Get the full attachment record to access file_path
    const { data: fullAttachment, error } = await supabase
      .from('attachments')
      .select('file_path, file_name')
      .eq('id', attachment.id)
      .single();

    if (error) throw error;

    const filePath = fullAttachment.file_path || (() => {
      const urlParts = attachment.url.split('/');
      return urlParts.slice(-3).join('/');
    })();
    
    await storageService.downloadFile(filePath, attachment.name);
  }
}; 
