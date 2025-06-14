/*
  # Update Companies RLS Policy for Soft Delete

  1. Changes
    - Update RLS policy to allow setting active status to false
    - Maintain admin-only update restrictions
    - Fix SQL syntax for RLS policy

  2. Security
    - Only admins can update companies
    - Explicitly allow setting active status to false
*/

DROP POLICY IF EXISTS "Admins can update companies" ON companies;

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