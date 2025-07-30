-- Add file_path column to attachments table for easier file operations
ALTER TABLE public.attachments 
ADD COLUMN IF NOT EXISTS file_path text;

-- Add index for file_path for better performance
CREATE INDEX IF NOT EXISTS idx_attachments_file_path ON public.attachments(file_path); 