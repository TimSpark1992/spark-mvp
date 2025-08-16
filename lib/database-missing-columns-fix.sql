-- URGENT FIX: Add missing columns to profiles table
-- Execute this in Supabase SQL Editor to fix Brand profile save errors

-- Add missing columns to profiles table (only if they don't exist)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS brand_categories TEXT[],
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS media_kit_url TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT true;

-- Handle onboarding_progress separately since it might already exist as jsonb
DO $$
BEGIN
    -- Check if onboarding_progress column exists and what type it is
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'onboarding_progress'
    ) THEN
        -- Column exists, check if it's jsonb type
        IF (
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'onboarding_progress'
        ) = 'jsonb' THEN
            -- Update existing profiles with jsonb value
            UPDATE profiles 
            SET 
              brand_categories = COALESCE(brand_categories, '{}'),
              onboarding_completed = COALESCE(onboarding_completed, false),
              onboarding_progress = COALESCE(onboarding_progress, '0'::jsonb),
              onboarding_skipped = COALESCE(onboarding_skipped, false),
              first_login = COALESCE(first_login, true)
            WHERE brand_categories IS NULL OR onboarding_progress IS NULL;
        ELSE
            -- Update with integer value if it's integer type
            UPDATE profiles 
            SET 
              brand_categories = COALESCE(brand_categories, '{}'),
              onboarding_completed = COALESCE(onboarding_completed, false),
              onboarding_progress = COALESCE(onboarding_progress, 0),
              onboarding_skipped = COALESCE(onboarding_skipped, false),
              first_login = COALESCE(first_login, true)
            WHERE brand_categories IS NULL OR onboarding_progress IS NULL;
        END IF;
    ELSE
        -- Column doesn't exist, create it as integer
        ALTER TABLE profiles ADD COLUMN onboarding_progress INTEGER DEFAULT 0;
        UPDATE profiles SET onboarding_progress = 0 WHERE onboarding_progress IS NULL;
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('brand_categories', 'company_description', 'company_size', 'location', 'media_kit_url', 'onboarding_completed', 'onboarding_progress', 'onboarding_skipped', 'first_login')
ORDER BY column_name;