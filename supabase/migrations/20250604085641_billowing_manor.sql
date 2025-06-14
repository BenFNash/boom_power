/*
  # Add read access policy for roles table
  
  1. Changes
    - Add RLS policy allowing all authenticated users to read from roles table
    
  2. Security
    - Maintains existing security while allowing role name lookups
    - Read-only access for authenticated users
*/

-- Create policy for reading roles
CREATE POLICY "Anyone can view roles"
ON roles
FOR SELECT
TO authenticated
USING (true);