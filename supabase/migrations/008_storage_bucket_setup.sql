-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  false,
  10485760, -- 10MB in bytes
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the ticket-attachments bucket
CREATE POLICY "Users can upload attachments for accessible tickets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments' AND
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = (storage.foldername(name))[1]::integer
    AND (
      t.who_raised_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND (
          p.company_id = t.assigned_company_id OR
          p.company_id = t.site_owner_company_id OR
          is_admin(auth.uid()) OR
          EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND r.role_name = 'edit'
          )
        )
      )
    )
  )
);

CREATE POLICY "Users can view attachments for accessible tickets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = (storage.foldername(name))[1]::integer
    AND (
      t.who_raised_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND (
          p.company_id = t.assigned_company_id OR
          p.company_id = t.site_owner_company_id OR
          is_admin(auth.uid()) OR
          EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid()
            AND r.role_name = 'edit'
          )
        )
      )
    )
  )
);

CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ticket-attachments' AND
  (storage.foldername(name))[2]::uuid = auth.uid()
); 