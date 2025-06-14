/*
  # Add admin read access policy for profiles
  
  1. Changes
    - Add new RLS policy allowing admins to read all profiles
    - Keep existing policies intact
    
  2. Security
    - Only admins can read all profiles
    - Regular users can still only read their own profile
*/

-- Add new policy for admin read access
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND jsonb_path_exists(p.roles, '$[*]?(@ == "admin")'::jsonpath)
  )
);