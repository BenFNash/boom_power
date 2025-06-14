/*
  # Add admin policies for reference data tables

  1. Changes
    - Drop existing policies to avoid conflicts
    - Add policies for admin users to:
      - Insert new records
      - Update existing records
      - Delete records
    
  2. Security
    - All policies require admin role
    - Policies apply to companies, sites, site owners, and company contacts
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON companies;

DROP POLICY IF EXISTS "Admins can insert sites" ON sites;
DROP POLICY IF EXISTS "Admins can update sites" ON sites;
DROP POLICY IF EXISTS "Admins can delete sites" ON sites;

DROP POLICY IF EXISTS "Admins can insert site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can update site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can delete site owners" ON site_owners;

DROP POLICY IF EXISTS "Admins can insert company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can update company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can delete company contacts" ON company_contacts;

-- Companies policies
CREATE POLICY "Admins can insert companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

CREATE POLICY "Admins can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

CREATE POLICY "Admins can delete companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

-- Sites policies
CREATE POLICY "Admins can insert sites"
  ON sites
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

CREATE POLICY "Admins can update sites"
  ON sites
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

CREATE POLICY "Admins can delete sites"
  ON sites
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

-- Site owners policies
CREATE POLICY "Admins can insert site owners"
  ON site_owners
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

CREATE POLICY "Admins can update site owners"
  ON site_owners
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

CREATE POLICY "Admins can delete site owners"
  ON site_owners
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

-- Company contacts policies
CREATE POLICY "Admins can insert company contacts"
  ON company_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

CREATE POLICY "Admins can update company contacts"
  ON company_contacts
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));

CREATE POLICY "Admins can delete company contacts"
  ON company_contacts
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  ));