/*
  # Minimal user_roles migration

  This migration ensures the user_roles table has all necessary policies
  and the handle_new_user function works correctly with the existing structure.
*/

-- Ensure RLS is enabled on user_roles (should already be enabled)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

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
  
  -- Assign read role if it doesn't already exist
  IF read_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id)
    VALUES (new.id, read_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;
  
  RETURN new;
END;
$$;