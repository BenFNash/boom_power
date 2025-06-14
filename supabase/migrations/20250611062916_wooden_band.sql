/*
  # Fix RLS Policy Infinite Recursion

  1. Problem
    - Infinite recursion detected in policy for relation "user_roles"
    - Circular dependency between profiles and user_roles policies
    - Admin check functions causing recursive loops

  2. Solution
    - Create a simple is_admin function that doesn't cause recursion
    - Simplify user_roles policies to avoid circular references
    - Update profiles policies to use direct auth checks
    - Ensure policies are self-contained and don't create loops

  3. Changes
    - Drop existing problematic policies
    - Create new simplified policies
    - Add a safe admin check function
*/

-- First, drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

DROP POLICY IF EXISTS "Admins can delete user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all user roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- Create a simple function to check if a user is admin without recursion
CREATE OR REPLACE FUNCTION is_admin_simple(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND r.role_name = 'admin'
  );
$$;

-- Create simplified policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin_simple(auth.uid()));

-- Create simplified policies for user_roles table
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (is_admin_simple(auth.uid()));

CREATE POLICY "Admins can insert user roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_simple(auth.uid()));

CREATE POLICY "Admins can update user roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_admin_simple(auth.uid()))
  WITH CHECK (is_admin_simple(auth.uid()));

CREATE POLICY "Admins can delete user roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (is_admin_simple(auth.uid()));

-- Update the existing is_admin function to use the simple version
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT is_admin_simple(user_uuid);
$$;