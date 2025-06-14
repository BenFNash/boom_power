/*
  # Add is_admin function and update policies
  
  1. Changes
    - Create function to check if a user is admin
    - Update policies to use the new function
    - Maintain existing functionality
    
  2. Security
    - Function is security definer to ensure proper access
    - Policies use the new function for consistency
*/

-- Create function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
    AND r.role_name = 'admin'
  );
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "anyone_view_roles" ON user_roles;
DROP POLICY IF EXISTS "admins_manage_roles" ON user_roles;

-- Create new policies using the is_admin function
CREATE POLICY "anyone_view_roles"
ON user_roles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "admins_manage_roles"
ON user_roles
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));