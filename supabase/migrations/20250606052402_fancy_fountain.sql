/*
  # Fix User Roles RLS Policies

  1. Changes
    - Remove recursive policies from user_roles table
    - Create new, simplified policies that avoid circular dependencies
    
  2. Security
    - Enable RLS on user_roles table
    - Add policies for:
      - Users to view their own roles
      - Admins to manage all roles (using auth.jwt() instead of recursive checks)
*/

-- First, drop existing policies to clean up
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- Create new, non-recursive policies
CREATE POLICY "Users can view own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

CREATE POLICY "Admins can manage all roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id IN (
      SELECT role_id FROM user_roles WHERE user_id = auth.uid()
    )
    AND r.role_name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles r
    WHERE r.id IN (
      SELECT role_id FROM user_roles WHERE user_id = auth.uid()
    )
    AND r.role_name = 'admin'
  )
);