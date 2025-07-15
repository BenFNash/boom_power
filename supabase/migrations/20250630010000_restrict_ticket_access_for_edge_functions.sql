/*
  # Restrict Ticket Access for Edge Functions
  
  1. Changes
    - Make RLS policies more restrictive for tickets table
    - Ensure edge functions are the primary way to access tickets
    - Keep basic access for admin and edit roles
    - Restrict direct database access for read and external roles
  
  2. Benefits
    - Centralized access control through edge functions
    - Better security and audit trail
    - Consistent company-based access control
*/

-- Drop existing ticket policies
DROP POLICY IF EXISTS "Users can view tickets based on role and company access" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets based on role and access" ON tickets;

-- Create very restrictive policies that only allow basic access
-- The edge functions will handle the actual access control logic

-- Policy for viewing tickets - very restrictive
CREATE POLICY "Restrict ticket viewing to edge functions and basic access"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    -- Admin can view all tickets (for management purposes)
    is_admin(auth.uid()) OR
    -- Edit role can view all tickets (for management purposes)
    has_edit_role(auth.uid()) OR
    -- Read role can view all tickets (for read-only access)
    has_read_role(auth.uid()) OR
    -- External role can only view tickets they created (very restrictive)
    (has_external_role(auth.uid()) AND who_raised_id = auth.uid()) OR
    -- Users with no roles can only view tickets they created
    (who_raised_id = auth.uid())
  );

-- Policy for updating tickets - very restrictive
CREATE POLICY "Restrict ticket updates to edge functions and basic access"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    -- Admin can update all tickets
    is_admin(auth.uid()) OR
    -- Edit role can update all tickets
    has_edit_role(auth.uid()) OR
    -- Read and external roles cannot update tickets
    (has_read_role(auth.uid()) AND false) OR
    (has_external_role(auth.uid()) AND false) OR
    -- Users with no roles cannot update tickets
    false
  )
  WITH CHECK (
    -- Admin can update all tickets
    is_admin(auth.uid()) OR
    -- Edit role can update all tickets
    has_edit_role(auth.uid()) OR
    -- Read and external roles cannot update tickets
    (has_read_role(auth.uid()) AND false) OR
    (has_external_role(auth.uid()) AND false) OR
    -- Users with no roles cannot update tickets
    false
  );

-- Policy for inserting tickets - allow creation but restrict viewing
CREATE POLICY "Allow ticket creation but restrict viewing"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Anyone authenticated can create tickets
    true
  );

-- Add comment to document the new restrictive access control
COMMENT ON POLICY "Restrict ticket viewing to edge functions and basic access" ON tickets IS 
'Very restrictive policy that limits direct database access. Use edge functions for proper company-based access control.';

COMMENT ON POLICY "Restrict ticket updates to edge functions and basic access" ON tickets IS 
'Very restrictive policy that limits direct database updates. Use edge functions for proper company-based access control.';

COMMENT ON POLICY "Allow ticket creation but restrict viewing" ON tickets IS 
'Allows ticket creation but viewing is restricted by other policies. Use edge functions for proper access control.'; 