/*
  # User Roles Junction Table Migration

  1. New Tables
    - `user_roles` - Junction table linking users to roles
      - `user_id` (uuid, foreign key to profiles)
      - `role_id` (uuid, foreign key to roles)
      - `created_at` (timestamp)

  2. Data Migration
    - Migrate existing role data from profiles.roles column if it exists
    - Assign default 'read' role to users without roles

  3. Security
    - Enable RLS on user_roles table
    - Add policies for role management
    - Update handle_new_user function

  4. Cleanup
    - Remove roles column from profiles if it exists
*/

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Check if roles column exists and migrate data if it does
DO $$
DECLARE
  roles_column_exists boolean;
  read_role_id uuid;
BEGIN
  -- Check if roles column exists in profiles table
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'roles'
    AND table_schema = 'public'
  ) INTO roles_column_exists;

  -- Get the read role ID
  SELECT id INTO read_role_id FROM roles WHERE role_name = 'read';

  IF roles_column_exists THEN
    -- Migrate existing role data from JSON column
    INSERT INTO user_roles (user_id, role_id)
    SELECT DISTINCT
      p.id as user_id,
      r.id as role_id
    FROM 
      profiles p,
      jsonb_array_elements_text(p.roles) as role_name
      JOIN roles r ON r.role_name = role_name::text
    ON CONFLICT (user_id, role_id) DO NOTHING;

    -- Drop the roles column after migration
    ALTER TABLE profiles DROP COLUMN roles;
  END IF;

  -- Assign default read role to any users who don't have roles yet
  INSERT INTO user_roles (user_id, role_id)
  SELECT p.id, read_role_id
  FROM profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = p.id
  )
  ON CONFLICT (user_id, role_id) DO NOTHING;
END $$;

-- Create policies for user_roles
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.role_name = 'admin'
    )
  );

CREATE POLICY "Admins can manage roles"
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

-- Add a convenience policy for viewing all roles (used by the application)
CREATE POLICY "anyone_view_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
    AND r.role_name = 'admin'
  );
END;
$$;

-- Add policy using the helper function
CREATE POLICY "admins_manage_roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Update handle_new_user function to set default role
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
  VALUES (new.id, new.email);
  
  -- Get read role ID
  SELECT id INTO read_role_id FROM roles WHERE role_name = 'read';
  
  -- Assign read role if it exists
  IF read_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (new.id, read_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;