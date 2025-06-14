/*
  # Update Tickets RLS Policies
  
  1. Changes
    - Drop existing ticket-related policies
    - Create new policies using user_roles table
    - Update related policies for communications and attachments
    
  2. Security
    - Maintain existing access rules but use new role structure
    - Ensure proper access control based on user roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tickets they created or are assigned to" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets they have access to" ON tickets;
DROP POLICY IF EXISTS "Users can view communications for accessible tickets" ON communications;
DROP POLICY IF EXISTS "Users can view attachments for accessible tickets" ON attachments;

-- Create new policies for tickets
CREATE POLICY "Users can view tickets they created or are assigned to"
ON tickets FOR SELECT
TO authenticated
USING (
  who_raised_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND (
      p.company_id = tickets.assigned_company_id OR
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.role_name IN ('admin', 'edit')
      )
    )
  )
);

CREATE POLICY "Users can create tickets"
ON tickets FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name IN ('admin', 'edit')
  )
);

CREATE POLICY "Users can update tickets they have access to"
ON tickets FOR UPDATE
TO authenticated
USING (
  who_raised_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND (
      r.role_name IN ('admin', 'edit') OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.company_id = tickets.assigned_company_id
      )
    )
  )
)
WITH CHECK (
  who_raised_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND (
      r.role_name IN ('admin', 'edit') OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.company_id = tickets.assigned_company_id
      )
    )
  )
);

-- Create new policy for communications
CREATE POLICY "Users can view communications for accessible tickets"
ON communications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = communications.ticket_id
    AND (
      t.who_raised_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND (
          r.role_name IN ('admin', 'edit') OR
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.company_id = t.assigned_company_id
          )
        )
      )
    )
  )
);

-- Create new policy for attachments
CREATE POLICY "Users can view attachments for accessible tickets"
ON attachments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tickets t
    WHERE t.id = attachments.ticket_id
    AND (
      t.who_raised_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND (
          r.role_name IN ('admin', 'edit') OR
          EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.company_id = t.assigned_company_id
          )
        )
      )
    )
  )
);