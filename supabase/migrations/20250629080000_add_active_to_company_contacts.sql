/*
  # Add active column to company_contacts table
  
  1. Changes
    - Add active boolean column with default true
    - Update RLS policies to filter by active column
    - Add index for better performance
    - Update sample data to set active true
  
  2. Benefits
    - Soft delete functionality for company contacts
    - Maintains referential integrity
    - Preserves audit trail
*/

-- Add active column to company_contacts table
ALTER TABLE public.company_contacts 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Set existing records to active if they don't have the column set
UPDATE public.company_contacts SET active = true WHERE active IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.company_contacts 
ALTER COLUMN active SET NOT NULL;

-- Create index for better performance on active filtering
CREATE INDEX IF NOT EXISTS idx_company_contacts_active ON company_contacts(active);

-- Drop existing policies that don't filter by active
DROP POLICY IF EXISTS "Anyone can view company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can insert company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can update company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can delete company contacts" ON company_contacts;

-- Create updated policies that filter by active column
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

-- Add comment to document the new column
COMMENT ON COLUMN public.company_contacts.active IS 'Soft delete flag - false means the record is deleted but preserved for audit trails'; 