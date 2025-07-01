/*
  # Add active column to reference data tables for soft delete functionality
  
  1. Tables to update
    - companies
    - sites  
    - site_owners
    - company_contacts
  
  2. Changes
    - Add active boolean column (defaults to true)
    - Create indexes for performance
    - Update RLS policies to filter by active
    - Ensure existing data is marked as active
*/

-- Add active column to companies table
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Add active column to sites table
ALTER TABLE public.sites 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Add active column to site_owners table
ALTER TABLE public.site_owners 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Add active column to company_contacts table
ALTER TABLE public.company_contacts 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Ensure all existing records are marked as active
UPDATE public.companies SET active = true WHERE active IS NULL;
UPDATE public.sites SET active = true WHERE active IS NULL;
UPDATE public.site_owners SET active = true WHERE active IS NULL;
UPDATE public.company_contacts SET active = true WHERE active IS NULL;

-- Create indexes for better performance on active column
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON companies(active);
CREATE INDEX IF NOT EXISTS idx_sites_is_active ON sites(active);
CREATE INDEX IF NOT EXISTS idx_site_owners_is_active ON site_owners(active);
CREATE INDEX IF NOT EXISTS idx_company_contacts_is_active ON company_contacts(active);

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
DROP POLICY IF EXISTS "Anyone can view sites" ON sites;
DROP POLICY IF EXISTS "Anyone can view site owners" ON site_owners;
DROP POLICY IF EXISTS "Anyone can view company contacts" ON company_contacts;

-- Create updated policies for companies
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

-- Create updated policies for sites
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

-- Create updated policies for site owners
CREATE POLICY "Anyone can view active site owners"
  ON public.site_owners
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can view all site owners"
  ON public.site_owners
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create updated policies for company contacts
CREATE POLICY "Anyone can view active company contacts"
  ON public.company_contacts
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can view all company contacts"
  ON public.company_contacts
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Add comments to document the soft delete functionality
COMMENT ON COLUMN public.companies.active IS 'Soft delete flag - false means the record is deleted but preserved for audit trails';
COMMENT ON COLUMN public.sites.active IS 'Soft delete flag - false means the record is deleted but preserved for audit trails';
COMMENT ON COLUMN public.site_owners.active IS 'Soft delete flag - false means the record is deleted but preserved for audit trails';
COMMENT ON COLUMN public.company_contacts.active IS 'Soft delete flag - false means the record is deleted but preserved for audit trails';
