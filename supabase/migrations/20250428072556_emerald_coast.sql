/*
  # Complete Database Schema Setup

  1. New Tables
    - roles (Reference table for role types)
    - companies (Organization information)
    - sites (Location information)
    - site_owners (Site ownership information)
    - company_contacts (Contact information for companies)
    - tickets (Main ticket tracking)
    - communications (Ticket communications)
    - attachments (File attachments for tickets and communications)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for data access
    - Set up cascading deletes where appropriate

  3. Indexes
    - Create indexes for frequently queried fields
    - Optimize for common query patterns

  4. Triggers
    - Auto-update timestamps
    - Handle user creation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Insert default roles
INSERT INTO public.roles (role_name) VALUES
  ('admin'),
  ('edit'),
  ('read'),
  ('external')
ON CONFLICT (role_name) DO NOTHING;

-- Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Drop existing profiles table if it exists and recreate with updated schema
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  roles jsonb NOT NULL DEFAULT '["read"]'::jsonb,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Sites table
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Site owners table
CREATE TABLE IF NOT EXISTS public.site_owners (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Company contacts table
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, contact_email)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number text NOT NULL UNIQUE,
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

-- Communications table
CREATE TABLE IF NOT EXISTS public.communications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  communication_id uuid REFERENCES public.communications(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_number ON public.tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.tickets(priority);
CREATE INDEX IF NOT EXISTS idx_communications_ticket_created ON public.communications(ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON public.attachments(ticket_id);

-- Enable RLS on all tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Companies policies
CREATE POLICY "Anyone can view companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (true);

-- Sites policies
CREATE POLICY "Anyone can view sites"
  ON public.sites
  FOR SELECT
  TO authenticated
  USING (true);

-- Site owners policies
CREATE POLICY "Anyone can view site owners"
  ON public.site_owners
  FOR SELECT
  TO authenticated
  USING (true);

-- Company contacts policies
CREATE POLICY "Anyone can view company contacts"
  ON public.company_contacts
  FOR SELECT
  TO authenticated
  USING (true);

-- Tickets policies
CREATE POLICY "Users can view tickets they created or are assigned to"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    who_raised_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND (
        p.company_id = tickets.assigned_company_id OR
        jsonb_path_exists(p.roles, '$[*] ? (@ == "admin" || @ == "edit")')
      )
    )
  );

-- Communications policies
CREATE POLICY "Users can view communications for accessible tickets"
  ON public.communications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
      AND (
        t.who_raised_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.company_id = t.assigned_company_id OR
            jsonb_path_exists(p.roles, '$[*] ? (@ == "admin" || @ == "edit")')
          )
        )
      )
    )
  );

-- Attachments policies
CREATE POLICY "Users can view attachments for accessible tickets"
  ON public.attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id
      AND (
        t.who_raised_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid()
          AND (
            p.company_id = t.assigned_company_id OR
            jsonb_path_exists(p.roles, '$[*] ? (@ == "admin" || @ == "edit")')
          )
        )
      )
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, roles)
  VALUES (
    new.id,
    new.email,
    '["read"]'::jsonb
  );
  RETURN new;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update ticket updated_at
CREATE OR REPLACE FUNCTION public.update_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for ticket updates
DROP TRIGGER IF EXISTS update_ticket_timestamp ON public.tickets;
CREATE TRIGGER update_ticket_timestamp
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_ticket_updated_at();