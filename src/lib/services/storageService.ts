import { supabase } from '../supabase';

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
  path: string;
}

export const storageService = {
  /**
   * Upload a file to Supabase storage
   */
  async uploadFile(
    file: File,
    ticketId: string,
    userId: string
  ): Promise<UploadedFile> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${ticketId}/${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get a signed URL for the file
    const { data: urlData, error: urlError } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(fileName, 3600 * 24 * 365); // 1 year expiry

    if (urlError) {
      throw new Error(`Failed to create signed URL: ${urlError.message}`);
    }

    return {
      url: urlData.signedUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      path: fileName // Store the file path for future operations
    };
  },

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    ticketId: string,
    userId: string
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(file, ticketId, userId)
    );
    
    return Promise.all(uploadPromises);
  },

  /**
   * Delete a file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .remove([filePath]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  },

  /**
   * Get a signed URL for downloading a file
   */
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  },

  /**
   * Download a file
   */
  async downloadFile(filePath: string, fileName: string): Promise<void> {
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .download(filePath);

    if (error) {
      throw new Error(`Download failed: ${error.message}`);
    }

    // Create a download link
    const url = window.URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}; 