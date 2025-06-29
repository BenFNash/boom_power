/*
  # Tickets System
  
  1. Tables
    - `tickets` - Main ticketing system for jobs and faults
    - `communications` - Messages and updates on tickets
    - `attachments` - File attachments for tickets and communications
  
  2. Security
    - Enable RLS on all tables
    - Add policies for company-based and role-based access
  
  3. Functions
    - Auto-generate ticket numbers
    - Auto-update timestamps
*/

-- Create sequence for ticket IDs
CREATE SEQUENCE IF NOT EXISTS ticket_id_seq;

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id integer PRIMARY KEY DEFAULT nextval('ticket_id_seq'),
  ticket_number text UNIQUE NOT NULL,
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE RESTRICT,
  site_owner_id uuid NOT NULL REFERENCES public.site_owners(id) ON DELETE RESTRICT,
  ticket_type text NOT NULL CHECK (ticket_type IN ('Job', 'Fault')),
  priority text NOT NULL,
  date_raised timestamptz DEFAULT now(),
  who_raised_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_completion_date date NOT NULL,
  due_date date,
  assigned_company_id uuid REFERENCES public.companies(id) ON DELETE RESTRICT,
  assigned_contact_id uuid REFERENCES public.company_contacts(id) ON DELETE RESTRICT,
  subject_title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved', 'cancelled', 'closed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create communications table
CREATE TABLE IF NOT EXISTS public.communications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id integer NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id integer NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  communication_id uuid REFERENCES public.communications(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_number ON public.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_communications_ticket_created ON public.communications(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON public.attachments(ticket_id);

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

-- Create function to update ticket updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate ticket number
DROP TRIGGER IF EXISTS set_ticket_number ON tickets;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- Create trigger to update ticket timestamp
DROP TRIGGER IF EXISTS update_ticket_timestamp ON tickets;
CREATE TRIGGER update_ticket_timestamp
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

-- Create policies for tickets
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
        is_admin(auth.uid()) OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = auth.uid()
          AND r.role_name = 'edit'
        )
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
  WITH CHECK (
    who_raised_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.company_id = tickets.assigned_company_id OR
        is_admin(auth.uid()) OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = auth.uid()
          AND r.role_name = 'edit'
        )
      )
    )
  );

-- Create policies for communications
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

CREATE POLICY "Users can create communications for accessible tickets"
  ON communications FOR INSERT
  TO authenticated
  WITH CHECK (
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

-- Create policies for attachments
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

CREATE POLICY "Users can create attachments for accessible tickets"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (
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