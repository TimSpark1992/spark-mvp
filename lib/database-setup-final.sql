-- CRITICAL FIX: Supabase RLS Policies for Profile Creation
-- This script fixes the 401 errors preventing profile creation during signup

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('creator', 'brand', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  profile_picture TEXT,
  bio TEXT,
  category_tags TEXT[],
  brand_categories TEXT[],
  website_url TEXT,
  social_links JSONB DEFAULT '{}',
  industry TEXT,
  company_name TEXT,
  company_description TEXT,
  company_size TEXT,
  location TEXT,
  media_kit_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_progress INTEGER DEFAULT 0,
  onboarding_skipped BOOLEAN DEFAULT false,
  first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget_range TEXT,
  category TEXT,
  creator_requirements TEXT,
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create applications table if it doesn't exist
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  note TEXT,
  media_kit_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(campaign_id, creator_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Drop all existing policies to start fresh
DO $$ 
DECLARE
    policy_name TEXT;
BEGIN
    -- Drop profiles policies
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON profiles';
    END LOOP;
    
    -- Drop campaigns policies  
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE tablename = 'campaigns' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON campaigns';
    END LOOP;
    
    -- Drop applications policies
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE tablename = 'applications' LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_name || '" ON applications';
    END LOOP;
END $$;

-- PROFILES TABLE POLICIES - CORRECTED FOR SIGNUP
-- Allow all authenticated users to view all profiles
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT 
USING (true);

-- CRITICAL FIX: Allow authenticated users to insert their own profile
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- CAMPAIGNS TABLE POLICIES
-- Allow everyone to view active campaigns
CREATE POLICY "campaigns_select_policy" ON campaigns FOR SELECT 
USING (status = 'active');

-- Allow brands to manage their own campaigns
CREATE POLICY "campaigns_brand_policy" ON campaigns FOR ALL 
USING (brand_id = auth.uid());

-- Allow admins to manage all campaigns
CREATE POLICY "campaigns_admin_policy" ON campaigns FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- APPLICATIONS TABLE POLICIES
-- Allow creators to view their own applications
CREATE POLICY "applications_creator_select_policy" ON applications FOR SELECT 
USING (creator_id = auth.uid());

-- Allow brands to view applications for their campaigns
CREATE POLICY "applications_brand_select_policy" ON applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE id = applications.campaign_id AND brand_id = auth.uid()
  )
);

-- Allow creators to create applications
CREATE POLICY "applications_insert_policy" ON applications FOR INSERT 
WITH CHECK (
  creator_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'creator'
  )
);

-- Allow brands to update applications for their campaigns
CREATE POLICY "applications_update_policy" ON applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE id = applications.campaign_id AND brand_id = auth.uid()
  )
);

-- GRANT PERMISSIONS TO AUTHENTICATED ROLE
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON campaigns TO authenticated;  
GRANT ALL ON applications TO authenticated;

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profiles', 'profiles', true),
  ('media-kits', 'media-kits', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "storage_profiles_insert_policy" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "storage_profiles_select_policy" ON storage.objects FOR SELECT 
USING (bucket_id = 'profiles');

CREATE POLICY "storage_profiles_update_policy" ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "storage_media_kits_insert_policy" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'media-kits' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "storage_media_kits_select_policy" ON storage.objects FOR SELECT 
USING (bucket_id = 'media-kits');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns(category);
CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_creator_id ON applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();