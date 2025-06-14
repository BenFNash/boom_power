/*
  # Fix profiles table RLS policies

  1. Changes
    - Remove existing recursive policies
    - Add simplified policies for profiles table:
      - Users can view their own profile
      - Admins can view all profiles
      - Users can update their own profile
  
  2. Security
    - Maintains RLS security while preventing recursion
    - Ensures users can only access their own data
    - Preserves admin access to all profiles
*/

-- Drop existing policies to replace them with fixed versions
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Create new, simplified policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);