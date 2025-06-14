/*
  # Add missing policies and functions for user_roles table

  1. Helper Functions
    - `is_admin()` function to check if current user is admin
  
  2. Security Policies
    - Add missing policies for user_roles table access
    - Ensure proper RLS is configured

  Note: This migration assumes user_roles table already exists
*/

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id
    AND r.role_name = 'admin'
  );
END;
$$;

-- Ensure RLS is enabled on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "admins_manage_roles" ON user_roles;
DROP POLICY IF EXISTS "anyone_view_roles" ON user_roles;

-- Create comprehensive policies for user_roles
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Additional policies for broader access patterns
CREATE POLICY "admins_manage_roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "anyone_view_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Update handle_new_user function to work with user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  read_role_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Get read role ID
  SELECT id INTO read_role_id FROM roles WHERE role_name = 'read';
  
  -- Assign read role if it exists and user doesn't already have it
  IF read_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (new.id, read_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;