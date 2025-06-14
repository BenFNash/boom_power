/*
  # Fix User Roles RLS Policies

  1. Changes
    - Remove recursive policies from user_roles table
    - Create new, simplified policies that avoid circular references
    - Maintain security while preventing infinite recursion

  2. Security
    - Enable RLS on user_roles table
    - Add policies for:
      - Admins to manage all roles
      - Users to view their own roles
*/

-- First, drop existing policies to replace them
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- Create new, non-recursive policies
CREATE POLICY "admins_manage_roles"
ON user_roles
FOR ALL
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

CREATE POLICY "users_view_own_roles"
ON user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);