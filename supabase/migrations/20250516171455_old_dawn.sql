/*
  # Update RLS policies for reference data tables
  
  1. Changes
    - Drop and recreate UPDATE policies for all reference data tables
    - Allow admins to update active status
    - Maintain existing security rules
    
  2. Security
    - Only admins can update records
    - Maintain RLS protection
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Admins can update sites" ON sites;
DROP POLICY IF EXISTS "Admins can update site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can update company contacts" ON company_contacts;

-- Recreate policies with proper conditions
CREATE POLICY "Admins can update companies"
ON companies
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
);

CREATE POLICY "Admins can update sites"
ON sites
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
);

CREATE POLICY "Admins can update site owners"
ON site_owners
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
);

CREATE POLICY "Admins can update company contacts"
ON company_contacts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
);