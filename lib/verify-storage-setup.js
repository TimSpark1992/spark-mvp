/**
 * Supabase Storage Verification and Setup Script
 * This script verifies that storage buckets are properly configured
 */

import { supabase } from './supabase'

export const verifyStorageBuckets = async () => {
  const results = {
    profiles: false,
    mediaKits: false,
    errors: []
  }

  try {
    console.log('🔍 Verifying Supabase storage configuration...')

    // Check if profiles bucket exists and is accessible
    try {
      const { data: profilesBucket, error: profilesError } = await supabase.storage
        .from('profiles')
        .list('', { limit: 1 })

      if (profilesError) {
        console.error('❌ Profiles bucket error:', profilesError)
        results.errors.push(`Profiles bucket: ${profilesError.message}`)
      } else {
        console.log('✅ Profiles bucket is accessible')
        results.profiles = true
      }
    } catch (error) {
      console.error('❌ Profiles bucket check failed:', error)
      results.errors.push(`Profiles bucket: ${error.message}`)
    }

    // Check if media-kits bucket exists and is accessible  
    try {
      const { data: mediaKitsBucket, error: mediaKitsError } = await supabase.storage
        .from('media-kits')
        .list('', { limit: 1 })

      if (mediaKitsError) {
        console.error('❌ Media-kits bucket error:', mediaKitsError)
        results.errors.push(`Media-kits bucket: ${mediaKitsError.message}`)
      } else {
        console.log('✅ Media-kits bucket is accessible')
        results.mediaKits = true
      }
    } catch (error) {
      console.error('❌ Media-kits bucket check failed:', error)
      results.errors.push(`Media-kits bucket: ${error.message}`)
    }

    // Test upload permissions with a tiny test file
    if (results.profiles) {
      try {
        console.log('🧪 Testing upload permissions...')
        const testFile = new Blob(['test'], { type: 'text/plain' })
        const testPath = 'test/upload-test.txt'
        
        const { data: uploadTest, error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(testPath, testFile, { upsert: true })

        if (uploadError) {
          console.warn('⚠️ Upload permission test failed:', uploadError.message)
          results.errors.push(`Upload permissions: ${uploadError.message}`)
        } else {
          console.log('✅ Upload permissions working')
          
          // Clean up test file
          await supabase.storage
            .from('profiles')
            .remove([testPath])
        }
      } catch (error) {
        console.warn('⚠️ Upload test failed:', error)
        results.errors.push(`Upload test: ${error.message}`)
      }
    }

    return results
  } catch (error) {
    console.error('❌ Storage verification failed:', error)
    results.errors.push(`Verification failed: ${error.message}`)
    return results
  }
}

export const getStorageSetupInstructions = () => {
  return `
🛠️  STORAGE SETUP REQUIRED

The Supabase storage buckets need to be configured. Please follow these steps:

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/fgcefqowzkpeivpckljf/sql/new

2. Copy and paste the following SQL commands:

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profiles', 'profiles', true),
  ('media-kits', 'media-kits', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for profiles bucket
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile pictures are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

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

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create RLS policies for media-kits bucket
CREATE POLICY "Users can upload their own media kits"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-kits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Media kits are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'media-kits');

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

CREATE POLICY "Users can delete their own media kits"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-kits' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

3. Click "Run" to execute the SQL commands

4. Verify buckets were created:
SELECT * FROM storage.buckets WHERE id IN ('profiles', 'media-kits');

After completing these steps, the file upload functionality will work correctly.
`
}