/*
  # Update tickets table to use auto-incrementing IDs
  
  1. Changes
    - Drop existing policies and constraints
    - Remove existing data
    - Convert tickets table to use auto-incrementing IDs
    - Update related tables
    - Recreate policies and triggers
*/

-- Drop existing policies that depend on the ticket_id column
DROP POLICY IF EXISTS "Users can view communications for accessible tickets" ON communications;
DROP POLICY IF EXISTS "Users can view attachments for accessible tickets" ON attachments;
DROP POLICY IF EXISTS "Users can view tickets they created or are assigned to" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Users can update tickets they have access to" ON tickets;

-- Drop existing foreign key constraints
ALTER TABLE communications DROP CONSTRAINT IF EXISTS communications_ticket_id_fkey;
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS attachments_ticket_id_fkey;

-- Drop existing data to allow for schema changes
TRUNCATE TABLE communications CASCADE;
TRUNCATE TABLE attachments CASCADE;
TRUNCATE TABLE tickets CASCADE;

-- Create sequence for ticket IDs
CREATE SEQUENCE IF NOT EXISTS ticket_id_seq;

-- Modify tickets table
ALTER TABLE tickets
DROP CONSTRAINT tickets_pkey CASCADE,
ADD COLUMN numeric_id INTEGER DEFAULT nextval('ticket_id_seq'),
ADD PRIMARY KEY (numeric_id);

-- Drop the old id column and rename numeric_id to id
ALTER TABLE tickets 
DROP COLUMN id;

ALTER TABLE tickets
RENAME COLUMN numeric_id TO id;

-- Drop existing ticket_id columns from related tables
ALTER TABLE communications DROP COLUMN ticket_id;
ALTER TABLE attachments DROP COLUMN ticket_id;

-- Add new ticket_id columns with integer type
ALTER TABLE communications
ADD COLUMN ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE;

ALTER TABLE attachments
ADD COLUMN ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE;

-- Recreate policies
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
      jsonb_path_exists(p.roles, '$[*]?(@ == "admin" || @ == "edit")'::jsonpath)
    )
  )
);

CREATE POLICY "Users can create tickets"
ON tickets FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update tickets they have access to"
ON tickets FOR UPDATE
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
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND (
          p.company_id = t.assigned_company_id OR
          jsonb_path_exists(p.roles, '$[*]?(@ == "admin" || @ == "edit")'::jsonpath)
        )
      )
    )
  )
);

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
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND (
          p.company_id = t.assigned_company_id OR
          jsonb_path_exists(p.roles, '$[*]?(@ == "admin" || @ == "edit")'::jsonpath)
        )
      )
    )
  )
);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := 
    CASE 
      WHEN NEW.ticket_type = 'Job' THEN 'T'
      ELSE 'F'
    END || 
    LPAD(NEW.id::text, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket number
DROP TRIGGER IF EXISTS set_ticket_number ON tickets;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();