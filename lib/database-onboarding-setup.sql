-- Add onboarding support to Supabase database
-- This extends the profiles table with onboarding tracking

-- Add onboarding fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_progress JSONB DEFAULT '{"steps_completed": [], "current_step": 0, "total_steps": 0}',
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false;

-- Update existing users to have onboarding enabled
UPDATE profiles 
SET first_login = true, 
    onboarding_completed = false 
WHERE onboarding_completed IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_first_login ON profiles(first_login);

-- Add admin role support (for future admin dashboard)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('creator', 'brand', 'admin');
        ALTER TABLE profiles ALTER COLUMN role TYPE user_role_enum USING role::user_role_enum;
    END IF;
END$$;