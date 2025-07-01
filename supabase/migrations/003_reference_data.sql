/*
  # Reference Data Tables
  
  1. Tables
    - `companies` - Organizations that can be assigned work
    - `sites` - Physical locations where work is performed (owned by companies)
    - `company_contacts` - Contact persons within companies
  
  2. Security
    - Enable RLS on all tables
    - Add policies for admin management and user viewing
  
  3. Constraints
    - Add foreign key constraints
    - Add unique constraints
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name text NOT NULL UNIQUE,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create sites table
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name text NOT NULL UNIQUE,
  site_owner_company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create company contacts table
CREATE TABLE IF NOT EXISTS public.company_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, contact_email)
);

-- Add foreign key constraint to profiles table
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for companies
CREATE POLICY "Anyone can view active companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can view all companies"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert companies"
  ON public.companies
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update companies"
  ON public.companies
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete companies"
  ON public.companies
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create policies for sites
CREATE POLICY "Anyone can view active sites"
  ON public.sites
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can view all sites"
  ON public.sites
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can view sites owned by their company"
  ON public.sites
  FOR SELECT
  TO authenticated
  USING (
    site_owner_company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert sites"
  ON public.sites
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update sites"
  ON public.sites
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete sites"
  ON public.sites
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create policies for company contacts
CREATE POLICY "Anyone can view company contacts"
  ON public.company_contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert company contacts"
  ON public.company_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update company contacts"
  ON public.company_contacts
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete company contacts"
  ON public.company_contacts
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid())); 