# File Upload Implementation for Ticket Attachments

## Overview

This implementation provides complete file upload functionality for ticket attachments using Supabase storage. Users can upload files when creating tickets and in communications, and download attachments when viewing tickets.

## Features Implemented

### 1. Storage Configuration
- **Storage Bucket**: `ticket-attachments` configured in `supabase/config.toml`
- **File Size Limit**: 10MB per file
- **Allowed File Types**: PDF, DOC, DOCX, JPG, JPEG, CSV, XLS, XLSX
- **Security**: Private bucket with RLS policies

### 2. Database Structure
- **Attachments Table**: Stores metadata for uploaded files
- **Relationships**: Links to tickets and communications
- **Security**: RLS policies for access control

### 3. Services Created

#### Storage Service (`src/lib/services/storageService.ts`)
- `uploadFile()`: Upload single file to Supabase storage
- `uploadFiles()`: Upload multiple files
- `deleteFile()`: Delete file from storage
- `getSignedUrl()`: Generate signed URLs for downloads
- `downloadFile()`: Download file to user's device

#### Attachment Service (`src/lib/services/attachmentService.ts`)
- `getTicketAttachments()`: Get attachments for a ticket
- `getCommunicationAttachments()`: Get attachments for a communication
- `uploadTicketAttachments()`: Upload files and create database records
- `uploadCommunicationAttachments()`: Upload files for communications
- `deleteAttachment()`: Delete attachment and file
- `downloadAttachment()`: Download attachment

### 4. Frontend Components Updated

#### TicketForm (`src/components/tickets/TicketForm.tsx`)
- Real file upload functionality
- Progress indicators
- File removal capability
- File type validation

#### CommunicationThread (`src/components/communications/CommunicationThread.tsx`)
- File upload in communications
- Progress indicators
- File removal capability

#### TicketDetailPage (`src/pages/tickets/TicketDetailPage.tsx`)
- Display ticket-level attachments
- Display communication attachments
- Download functionality for all attachments
- Separate sections for different attachment types

### 5. Security Features
- **File Type Validation**: Only allowed MIME types
- **Size Limits**: 10MB per file
- **Access Control**: Users can only access attachments for tickets they have permission to view
- **Ownership**: Users can only delete their own uploads
- **RLS Policies**: Database-level security

## Usage

### Creating a Ticket with Attachments
1. Fill out the ticket form
2. Click "Upload Files" to select files
3. Files are validated and uploaded after ticket creation
4. Progress is shown during upload

### Adding Attachments to Communications
1. Type a message in the communication thread
2. Click the paperclip icon to attach files
3. Files are uploaded with the message
4. Progress is shown during upload

### Downloading Attachments
1. View a ticket to see all attachments
2. Click "Download" button next to any attachment
3. File is downloaded to user's device

## File Structure
```
ticketId/userId/timestamp.extension
```

## Database Schema
```sql
CREATE TABLE attachments (
  id uuid PRIMARY KEY,
  ticket_id integer REFERENCES tickets(id),
  communication_id uuid REFERENCES communications(id),
  uploaded_by uuid REFERENCES profiles(id),
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

## Migration
Run the migration to set up storage bucket and policies:
```bash
supabase db push
```

## Error Handling
- File type validation
- Size limit enforcement
- Upload progress tracking
- Error messages for failed uploads
- Graceful fallback for storage errors

## Future Enhancements
- Image preview for image files
- Bulk download functionality
- File versioning
- Attachment search and filtering
- Integration with external storage providers 