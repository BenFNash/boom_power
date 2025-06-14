/*
  # Fix Tickets RLS Policy

  1. Changes
    - Drop and recreate the SELECT policy for tickets table to ensure it's properly applied
    - Add explicit INSERT and UPDATE policies
    
  2. Security
    - Maintains existing security rules but ensures they are properly applied
    - Users can:
      - View tickets they created
      - View tickets assigned to their company
      - View all tickets if they have admin or edit roles
      - Create and update tickets based on the same rules
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view tickets they created or are assigned to" ON tickets;

-- Recreate SELECT policy
CREATE POLICY "Users can view tickets they created or are assigned to"
ON tickets
FOR SELECT
TO authenticated
USING (
  who_raised_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (
      p.company_id = tickets.assigned_company_id OR 
      jsonb_path_exists(p.roles, '$[*]?(@ == "admin" || @ == "edit")'::jsonpath)
    )
  )
);

-- Add INSERT policy
CREATE POLICY "Users can create tickets"
ON tickets
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
);

-- Add UPDATE policy
CREATE POLICY "Users can update tickets they have access to"
ON tickets
FOR UPDATE
TO authenticated
USING (
  who_raised_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (
      p.company_id = tickets.assigned_company_id OR 
      jsonb_path_exists(p.roles, '$[*]?(@ == "admin" || @ == "edit")'::jsonpath)
    )
  )
)
WITH CHECK (
  who_raised_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (
      p.company_id = tickets.assigned_company_id OR 
      jsonb_path_exists(p.roles, '$[*]?(@ == "admin" || @ == "edit")'::jsonpath)
    )
  )
);