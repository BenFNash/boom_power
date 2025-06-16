/*
  # Update roles schema to use junction table
  
  1. Changes
    - Create user_roles junction table
    - Migrate existing role data from profiles.roles
    - Drop roles column from profiles
    - Update RLS policies
    
  2. Security
    - Maintain existing security rules
    - Add appropriate policies for user_roles table
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

-- Migrate existing role data
INSERT INTO user_roles (user_id, role_id)
SELECT 
  p.id as user_id,
  r.id as role_id
FROM 
  profiles p,
  jsonb_array_elements_text(p.roles) as role_name
  JOIN roles r ON r.role_name = role_name::text;

-- Drop roles column from profiles
ALTER TABLE profiles DROP COLUMN roles;

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
  
  -- Assign read role
  INSERT INTO user_roles (user_id, role_id)
  VALUES (new.id, read_role_id);
  
  RETURN new;
END;
$$;