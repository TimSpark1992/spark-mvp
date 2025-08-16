-- SUPABASE STORAGE BUCKET SETUP
-- Execute this in Supabase SQL Editor to fix profile picture upload

-- Create the profiles storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Create the media-kits storage bucket if it doesn't exist (for creator media kits)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-kits', 'media-kits', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profiles bucket
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow everyone to view profile pictures (public access)
CREATE POLICY "Profile pictures are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Set up storage policies for media-kits bucket
-- Allow authenticated users to upload their own media kits
CREATE POLICY "Users can upload their own media kits"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-kits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow everyone to view media kits (public access)
CREATE POLICY "Media kits are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-kits');

-- Allow users to update their own media kits
CREATE POLICY "Users can update their own media kits"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media-kits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'media-kits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own media kits
CREATE POLICY "Users can delete their own media kits"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-kits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify buckets were created
SELECT * FROM storage.buckets WHERE id IN ('profiles', 'media-kits');