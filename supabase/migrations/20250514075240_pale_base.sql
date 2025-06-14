/*
  # Fix Companies RLS Policies

  1. Changes
    - Drop existing RLS policies for companies table
    - Create new comprehensive RLS policies that properly handle all operations
    - Ensure admin users can perform all operations
    - Maintain existing read access for authenticated users

  2. Security
    - Enable RLS on companies table (already enabled)
    - Add policies for:
      - SELECT: Anyone can view active companies
      - INSERT: Only admins can create companies
      - UPDATE: Only admins can update companies
      - DELETE: Only admins can delete companies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view companies" ON companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Admins can delete companies" ON companies;

-- Recreate policies with proper conditions
CREATE POLICY "Anyone can view companies"
  ON companies
  FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can insert companies"
  ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND jsonb_path_exists(p.roles, '$[*] ? (@ == "admin")')
    )
  );

CREATE POLICY "Admins can update companies"
  ON companies
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND jsonb_path_exists(p.roles, '$[*] ? (@ == "admin")')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND jsonb_path_exists(p.roles, '$[*] ? (@ == "admin")')
    )
  );

CREATE POLICY "Admins can delete companies"
  ON companies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND jsonb_path_exists(p.roles, '$[*] ? (@ == "admin")')
    )
  );