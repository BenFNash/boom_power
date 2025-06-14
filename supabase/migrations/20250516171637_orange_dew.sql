/*
  # Fix RLS policies for inactive records
  
  1. Changes
    - Update SELECT policies to allow viewing inactive records
    - Keep existing UPDATE/INSERT/DELETE policies unchanged
    
  2. Security
    - Maintains admin-only restrictions for modifications
    - Allows viewing both active and inactive records
*/

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
DROP POLICY IF EXISTS "Anyone can view sites" ON sites;
DROP POLICY IF EXISTS "Anyone can view site owners" ON site_owners;
DROP POLICY IF EXISTS "Anyone can view company contacts" ON company_contacts;

-- Recreate SELECT policies without active status restriction
CREATE POLICY "Anyone can view companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view sites"
  ON sites
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view site owners"
  ON site_owners
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can view company contacts"
  ON company_contacts
  FOR SELECT
  TO authenticated
  USING (true);