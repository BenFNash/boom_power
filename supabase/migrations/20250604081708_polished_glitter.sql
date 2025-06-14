/*
  # Update RLS policies for reference data tables
  
  1. Changes
    - Drop existing policies
    - Create new policies using user_roles table
    - Maintain existing functionality but use new role structure
    
  2. Security
    - Only admins can modify reference data
    - All authenticated users can view reference data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON companies;

DROP POLICY IF EXISTS "Anyone can view sites" ON sites;
DROP POLICY IF EXISTS "Admins can insert sites" ON sites;
DROP POLICY IF EXISTS "Admins can update sites" ON sites;
DROP POLICY IF EXISTS "Admins can delete sites" ON sites;

DROP POLICY IF EXISTS "Anyone can view site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can insert site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can update site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can delete site owners" ON site_owners;

DROP POLICY IF EXISTS "Anyone can view company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can insert company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can update company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can delete company contacts" ON company_contacts;

-- Create new policies for companies
CREATE POLICY "Anyone can view companies"
ON companies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert companies"
ON companies FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

CREATE POLICY "Admins can update companies"
ON companies FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

CREATE POLICY "Admins can delete companies"
ON companies FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

-- Create new policies for sites
CREATE POLICY "Anyone can view sites"
ON sites FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert sites"
ON sites FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

CREATE POLICY "Admins can update sites"
ON sites FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

CREATE POLICY "Admins can delete sites"
ON sites FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

-- Create new policies for site owners
CREATE POLICY "Anyone can view site owners"
ON site_owners FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert site owners"
ON site_owners FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

CREATE POLICY "Admins can update site owners"
ON site_owners FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

CREATE POLICY "Admins can delete site owners"
ON site_owners FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

-- Create new policies for company contacts
CREATE POLICY "Anyone can view company contacts"
ON company_contacts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can insert company contacts"
ON company_contacts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

CREATE POLICY "Admins can update company contacts"
ON company_contacts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);

CREATE POLICY "Admins can delete company contacts"
ON company_contacts FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);