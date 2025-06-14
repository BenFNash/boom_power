/*
  # Update admin profiles policy
  
  1. Changes
    - Drop existing admin profiles policy
    - Create new policy using user_roles table
    
  2. Security
    - Only users with admin role can view all profiles
    - Uses proper role check through user_roles table
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create new policy using user_roles table
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
    AND r.role_name = 'admin'
  )
);