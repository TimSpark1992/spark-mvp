-- FINAL FIX: Correct Supabase RLS Policy for Profile Creation
-- This fixes the critical INSERT policy syntax error

-- Drop the incorrect policy first
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;

-- Create the CORRECT INSERT policy using WITH CHECK (not USING)
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Verify other policies are correct
-- SELECT policy (uses USING clause)
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT 
USING (true);

-- UPDATE policy (uses both USING and WITH CHECK) 
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure permissions are granted
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;