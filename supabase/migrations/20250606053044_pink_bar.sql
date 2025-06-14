/*
  # Update user_roles RLS policies to allow all authenticated users to view all roles
  
  1. Changes
    - Drop existing policies
    - Create new simplified policies:
      - All authenticated users can view all roles
      - Only admins can manage roles
    
  2. Security
    - Maintains admin-only management
    - Opens up role visibility to all authenticated users
*/

-- Drop existing policies
DROP POLICY IF EXISTS "admins_manage_roles" ON user_roles;
DROP POLICY IF EXISTS "users_view_own_roles" ON user_roles;

-- Create new policies
CREATE POLICY "anyone_view_roles"
ON user_roles
FOR SELECT
TO authenticated
USING (true);

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