-- ULTIMATE FIX: Based on troubleshooting research
-- The issue is likely that we need both USING and WITH CHECK clauses with proper conditions

-- Clean slate approach
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Remove all existing policies completely
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON profiles';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create the correct policy with both USING and WITH CHECK
-- Based on research: USING for authenticated check, WITH CHECK for ID validation
CREATE POLICY "Insert profiles for authenticated users"
ON profiles
FOR INSERT
USING (auth.uid() IS NOT NULL)
WITH CHECK (id = auth.uid());

-- Allow users to view profiles (simple approach)
CREATE POLICY "View profiles"
ON profiles
FOR SELECT
USING (true);

-- Allow users to update their own profiles
CREATE POLICY "Update own profiles"
ON profiles
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Ensure proper permissions
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;