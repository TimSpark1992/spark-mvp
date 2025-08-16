-- CORRECT FIX: Based on proper research
-- The issue is we've been using the wrong USING clause for INSERT

-- Clean slate
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Remove all policies
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "select_profiles" ON profiles;  
DROP POLICY IF EXISTS "update_own_profile" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- CORRECT INSERT policy: USING should also check auth.uid() = id for INSERT
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- SELECT policy
CREATE POLICY "select_profiles" ON profiles FOR SELECT 
USING (true);

-- UPDATE policy
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;