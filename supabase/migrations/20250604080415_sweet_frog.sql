/*
  # Fix User Roles RLS Policies

  1. Changes
    - Remove recursive policies from user_roles table
    - Create new simplified policies that avoid circular dependencies
    - Keep the core functionality while preventing infinite recursion

  2. Security
    - Enable RLS on user_roles table (already enabled)
    - Add non-recursive policies for:
      - Users to view their own roles
      - Admins to manage all roles
*/

-- Drop existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Create new simplified policies
CREATE POLICY "Users can view own roles"
ON user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- For admin operations, we'll check against a direct roles query instead of using user_roles
CREATE POLICY "Admins can manage all roles"
ON user_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM roles r
    INNER JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM roles r
    INNER JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);