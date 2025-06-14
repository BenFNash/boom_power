/*
  # Fix user_roles RLS policies

  1. Changes
    - Remove recursive admin policy that was causing infinite recursion
    - Add simplified policies for user_roles table:
      - Users can read their own roles
      - Users with admin role can manage all roles (using auth.jwt())
  
  2. Security
    - Maintains RLS protection
    - Uses JWT claims for admin checks instead of recursive queries
    - Preserves principle of least privilege
*/

-- Drop existing policies to replace them
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;

-- Create new non-recursive policies
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
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);