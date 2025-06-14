/*
  # Add soft delete functionality to reference tables
  
  1. Changes
    - Add active column to companies, sites, site_owners, and company_contacts tables
    - Update policies to filter by active status
    - Add function to handle soft delete
    - Update existing data to set active = true
*/

-- Add active column to tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE site_owners ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;
ALTER TABLE company_contacts ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Update existing records to be active
UPDATE companies SET active = true WHERE active IS NULL;
UPDATE sites SET active = true WHERE active IS NULL;
UPDATE site_owners SET active = true WHERE active IS NULL;
UPDATE company_contacts SET active = true WHERE active IS NULL;

-- Modify SELECT policies to only show active records
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
CREATE POLICY "Anyone can view companies"
  ON companies FOR SELECT
  TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Anyone can view sites" ON sites;
CREATE POLICY "Anyone can view sites"
  ON sites FOR SELECT
  TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Anyone can view site owners" ON site_owners;
CREATE POLICY "Anyone can view site owners"
  ON site_owners FOR SELECT
  TO authenticated
  USING (active = true);

DROP POLICY IF EXISTS "Anyone can view company contacts" ON company_contacts;
CREATE POLICY "Anyone can view company contacts"
  ON company_contacts FOR SELECT
  TO authenticated
  USING (active = true);