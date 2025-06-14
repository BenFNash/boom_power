/*
  # Update tickets table RLS policies

  1. Changes
    - Remove existing restrictive RLS policy
    - Add new policy allowing users to:
      - View tickets they created
      - View tickets assigned to their company
      - View all tickets if they have admin or edit roles

  2. Security
    - Maintains RLS protection while expanding access appropriately
    - Ensures users can only see tickets they should have access to
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view tickets they created or are assigned to" ON tickets;

-- Create new policy with proper access rules
CREATE POLICY "Users can view tickets they created or are assigned to" ON tickets
FOR SELECT TO authenticated
USING (
  who_raised_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE 
      p.id = auth.uid() AND (
        p.company_id = tickets.assigned_company_id OR
        jsonb_path_exists(p.roles, '$[*] ? (@ == "admin" || @ == "edit")'::jsonpath)
      )
  )
);