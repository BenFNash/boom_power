/*
  # Update role management system
  
  1. Changes
    - Create user_roles junction table if it doesn't exist
    - Update policies to use new role structure
    - Use existing is_admin function for admin checks
    
  2. Security
    - Maintain existing security rules
    - Update policies to use junction table
    - Preserve admin access control
*/

-- Create user_roles junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might cause conflicts
DROP POLICY IF EXISTS "Admins can delete companies" ON companies;
DROP POLICY IF EXISTS "Admins can delete company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can delete site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can delete sites" ON sites;
DROP POLICY IF EXISTS "Admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Admins can insert company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can insert site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can insert sites" ON sites;
DROP POLICY IF EXISTS "Admins can update companies" ON companies;
DROP POLICY IF EXISTS "Admins can update company contacts" ON company_contacts;
DROP POLICY IF EXISTS "Admins can update site owners" ON site_owners;
DROP POLICY IF EXISTS "Admins can update sites" ON sites;
DROP POLICY IF EXISTS "Users can update tickets they have access to" ON tickets;
DROP POLICY IF EXISTS "Users can view attachments for accessible tickets" ON attachments;
DROP POLICY IF EXISTS "Users can view communications for accessible tickets" ON communications;
DROP POLICY IF EXISTS "Users can view tickets they created or are assigned to" ON tickets;

-- Drop any existing user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Create policies for user_roles using is_admin function
CREATE POLICY "Users can view own roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert user roles"
  ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update user roles"
  ON user_roles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete user roles"
  ON user_roles
  FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Recreate policies using the new user_roles table and is_admin function
CREATE POLICY "Admins can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Recreate policies for sites
CREATE POLICY "Admins can delete sites"
  ON sites FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update sites"
  ON sites FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Recreate policies for site owners
CREATE POLICY "Admins can delete site owners"
  ON site_owners FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert site owners"
  ON site_owners FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update site owners"
  ON site_owners FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Recreate policies for company contacts
CREATE POLICY "Admins can delete company contacts"
  ON company_contacts FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert company contacts"
  ON company_contacts FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update company contacts"
  ON company_contacts FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Recreate policies for tickets
CREATE POLICY "Users can view tickets they created or are assigned to"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    who_raised_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.company_id = tickets.assigned_company_id OR
        is_admin(auth.uid()) OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = auth.uid()
          AND r.role_name = 'edit'
        )
      )
    )
  );

CREATE POLICY "Users can update tickets they have access to"
  ON tickets FOR UPDATE
  TO authenticated
  USING (
    who_raised_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.company_id = tickets.assigned_company_id OR
        is_admin(auth.uid()) OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = auth.uid()
          AND r.role_name = 'edit'
        )
      )
    )
  )
  WITH CHECK (
    who_raised_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        p.company_id = tickets.assigned_company_id OR
        is_admin(auth.uid()) OR
        EXISTS (
          SELECT 1 FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = auth.uid()
          AND r.role_name = 'edit'
        )
      )
    )
  );

-- Recreate policies for communications
CREATE POLICY "Users can view communications for accessible tickets"
  ON communications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = communications.ticket_id
      AND (
        t.who_raised_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND (
            p.company_id = t.assigned_company_id OR
            is_admin(auth.uid()) OR
            EXISTS (
              SELECT 1 FROM user_roles ur
              JOIN roles r ON r.id = ur.role_id
              WHERE ur.user_id = auth.uid()
              AND r.role_name = 'edit'
            )
          )
        )
      )
    )
  );

-- Recreate policies for attachments
CREATE POLICY "Users can view attachments for accessible tickets"
  ON attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = attachments.ticket_id
      AND (
        t.who_raised_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid()
          AND (
            p.company_id = t.assigned_company_id OR
            is_admin(auth.uid()) OR
            EXISTS (
              SELECT 1 FROM user_roles ur
              JOIN roles r ON r.id = ur.role_id
              WHERE ur.user_id = auth.uid()
              AND r.role_name = 'edit'
            )
          )
        )
      )
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
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  
  -- Get read role ID
  SELECT id INTO read_role_id FROM roles WHERE role_name = 'read';
  
  -- Assign read role if it doesn't already exist
  IF read_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (new.id, read_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;