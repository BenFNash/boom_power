/*
  # Create admin profile for user

  1. Changes
    - Insert profile for user with ID dba074fe-ae64-4a11-9011-2ca71cbb0e48
    - Set user role to admin
    - Set email to benfnash@gmail.com

  2. Security
    - No changes to RLS policies required
*/

-- Update or create profile for the specified user
INSERT INTO public.profiles (id, email, name, roles)
VALUES (
  'dba074fe-ae64-4a11-9011-2ca71cbb0e48',
  'benfnash@gmail.com',
  'Ben Nash',
  '["admin"]'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  roles = EXCLUDED.roles;