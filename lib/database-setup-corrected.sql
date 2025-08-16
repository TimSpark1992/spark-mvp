-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('creator', 'brand', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  profile_picture TEXT,
  bio TEXT,
  category_tags TEXT[],
  website_url TEXT,
  social_links JSONB DEFAULT '{}',
  industry TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create campaigns table
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

-- Create applications table
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

-- Create storage buckets (ignore if they already exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('profiles', 'profiles', true),
  ('media-kits', 'media-kits', false)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (now that tables exist)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Everyone can view active campaigns" ON campaigns;
    DROP POLICY IF EXISTS "Brands can manage own campaigns" ON campaigns;
    DROP POLICY IF EXISTS "Admins can manage all campaigns" ON campaigns;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Creators can view own applications" ON applications;
    DROP POLICY IF EXISTS "Brands can view applications for own campaigns" ON applications;
    DROP POLICY IF EXISTS "Creators can create applications" ON applications;
    DROP POLICY IF EXISTS "Brands can update applications for own campaigns" ON applications;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Campaigns policies
CREATE POLICY "Everyone can view active campaigns" ON campaigns FOR SELECT 
USING (status = 'active');

CREATE POLICY "Brands can manage own campaigns" ON campaigns FOR ALL 
USING (brand_id = auth.uid());

CREATE POLICY "Admins can manage all campaigns" ON campaigns FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Applications policies
CREATE POLICY "Creators can view own applications" ON applications FOR SELECT 
USING (creator_id = auth.uid());

CREATE POLICY "Brands can view applications for own campaigns" ON applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE id = applications.campaign_id AND brand_id = auth.uid()
  )
);

CREATE POLICY "Creators can create applications" ON applications FOR INSERT 
WITH CHECK (
  creator_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'creator'
  )
);

CREATE POLICY "Brands can update applications for own campaigns" ON applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM campaigns 
    WHERE id = applications.campaign_id AND brand_id = auth.uid()
  )
);

-- Storage policies (drop existing first)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can upload own profile pictures" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view profile pictures" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects;
    DROP POLICY IF EXISTS "Creators can upload media kits" ON storage.objects;
    DROP POLICY IF EXISTS "Brands can view media kits for applications" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE POLICY "Users can upload own profile pictures" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view profile pictures" ON storage.objects FOR SELECT 
USING (bucket_id = 'profiles');

CREATE POLICY "Users can update own profile pictures" ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Creators can upload media kits" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'media-kits' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Brands can view media kits for applications" ON storage.objects FOR SELECT 
USING (bucket_id = 'media-kits');

-- Create indexes for better performance (ignore if they exist)
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

-- Create triggers for updated_at (drop first if they exist)
DO $$ BEGIN
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
    DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();