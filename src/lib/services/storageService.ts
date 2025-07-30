import { supabase } from '../supabase';

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

export const storageService = {
  async uploadFiles(
    files: File[],
    ticketId: string,
    communicationId: string | null = null
  ): Promise<any[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ticketId', ticketId);
      if (communicationId) {
        formData.append('communicationId', communicationId);
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/upload-attachment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      return response.json();
    });

    return Promise.all(uploadPromises);
  },

  async deleteFile(attachmentId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const response = await fetch(`${supabaseUrl}/functions/v1/delete-attachment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ attachmentId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete file');
    }
  },

  async downloadFile(attachmentId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const response = await fetch(`${supabaseUrl}/functions/v1/download-attachment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ attachmentId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create download URL');
    }

    const { signedUrl, fileName } = await response.json();

    // Use the signed URL to download the file
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};