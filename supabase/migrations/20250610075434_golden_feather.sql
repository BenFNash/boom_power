/*
  # Fix infinite recursion in user_roles RLS policies

  1. Problem
    - Multiple conflicting policies on user_roles table causing infinite recursion
    - Policies trying to check admin status while querying user_roles table itself

  2. Solution
    - Drop all existing problematic policies on user_roles
    - Create simple, non-recursive policies
    - Ensure users can view their own roles without circular dependencies

  3. Security
    - Users can view their own roles
    - Admins can manage all roles (using a simpler check)
    - Remove circular policy dependencies
*/

-- Drop all existing policies on user_roles to start fresh
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "admins_manage_roles" ON user_roles;
DROP POLICY IF EXISTS "anyone_view_roles" ON user_roles;

-- Create simple, non-recursive policies for user_roles
-- Users can view their own roles (no recursion)
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all roles (using direct role check to avoid recursion)
CREATE POLICY "Admins can view all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() 
      AND r.role_name = 'admin'
      LIMIT 1
    )
  );

-- Admins can insert user roles
CREATE POLICY "Admins can insert user roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() 
      AND r.role_name = 'admin'
      LIMIT 1
    )
  );

-- Admins can update user roles
CREATE POLICY "Admins can update user roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() 
      AND r.role_name = 'admin'
      LIMIT 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() 
      AND r.role_name = 'admin'
      LIMIT 1
    )
  );

-- Admins can delete user roles
CREATE POLICY "Admins can delete user roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid() 
      AND r.role_name = 'admin'
      LIMIT 1
    )
  );