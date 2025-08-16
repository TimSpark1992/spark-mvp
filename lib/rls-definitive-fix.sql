-- DEFINITIVE FIX: Correct Supabase RLS Policy Configuration
-- Based on working examples from Supabase documentation

-- First, disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;  
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create the correct INSERT policy using exact working syntax
CREATE POLICY "Users can insert their own profiles"
ON profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- Create SELECT policy to allow users to view profiles
CREATE POLICY "Users can view profiles"
ON profiles
FOR SELECT
USING (true);

-- Create UPDATE policy for users to update their own profiles
CREATE POLICY "Users can update their own profiles"
ON profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Ensure proper permissions are granted
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the policy was created correctly
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles';