-- CLEAN FIX: Simple and clean RLS policy fix

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Clean up existing policies
DROP POLICY IF EXISTS "Insert profiles for authenticated users" ON profiles;
DROP POLICY IF EXISTS "View profiles" ON profiles;  
DROP POLICY IF EXISTS "Update own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT 
USING (auth.uid() IS NOT NULL) 
WITH CHECK (id = auth.uid());

-- Create SELECT policy  
CREATE POLICY "select_profiles" ON profiles FOR SELECT 
USING (true);

-- Create UPDATE policy
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Grant permissions
GRANT ALL ON profiles TO authenticated;