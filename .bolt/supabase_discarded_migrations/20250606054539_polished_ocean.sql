/*
  # Fix profile update to preserve roles
  
  1. Changes
    - Add trigger to prevent role removal during profile updates
    - Update profile update policy to use is_admin function
    
  2. Security
    - Maintains existing security rules
    - Ensures admins keep their roles when updating profiles
*/

-- Create trigger function to prevent role removal
CREATE OR REPLACE FUNCTION prevent_role_removal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If updating own profile and is admin, preserve roles
  IF auth.uid() = OLD.id AND is_admin(OLD.id) THEN
    -- Keep the existing roles
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS prevent_role_removal_trigger ON profiles;
CREATE TRIGGER prevent_role_removal_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_removal();

-- Update profile policies to use is_admin function
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

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
USING (auth.uid() = id OR is_admin(auth.uid()));