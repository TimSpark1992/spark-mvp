-- Migration: 20250811_003_create_anti_disintermediation_tables.sql
-- Anti-disintermediation system tables and enhancements

-- Create violation logs table for tracking contact info sharing attempts
CREATE TABLE IF NOT EXISTS violation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  risk_score INTEGER NOT NULL DEFAULT 0,
  violations JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_snippet TEXT,
  admin_action TEXT CHECK (admin_action IN ('reviewed', 'dismissed', 'escalated', 'user_warned', 'user_suspended')),
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create conversation files table for gated file sharing
CREATE TABLE IF NOT EXISTS conversation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  public_url TEXT NOT NULL,
  is_gated BOOLEAN DEFAULT false,
  risk_score INTEGER DEFAULT 0,
  upload_ip TEXT,
  admin_approved BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add anti-disintermediation columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_warning_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Enable RLS on new tables
ALTER TABLE violation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for violation_logs
CREATE POLICY "Admins can view all violation logs" ON violation_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can create violation logs" ON violation_logs
  FOR INSERT WITH CHECK (true); -- Server-side only

CREATE POLICY "Admins can update violation logs" ON violation_logs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS policies for conversation_files
CREATE POLICY "Conversation participants can view files" ON conversation_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Conversation participants can upload files" ON conversation_files
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.brand_id = auth.uid() OR c.creator_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage all files" ON conversation_files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Indexes for performance
CREATE INDEX idx_violation_logs_sender_id ON violation_logs(sender_id);
CREATE INDEX idx_violation_logs_risk_score ON violation_logs(risk_score);
CREATE INDEX idx_violation_logs_created_at ON violation_logs(created_at);
CREATE INDEX idx_violation_logs_admin_action ON violation_logs(admin_action);

CREATE INDEX idx_conversation_files_conversation_id ON conversation_files(conversation_id);
CREATE INDEX idx_conversation_files_sender_id ON conversation_files(sender_id);
CREATE INDEX idx_conversation_files_offer_id ON conversation_files(offer_id);
CREATE INDEX idx_conversation_files_is_gated ON conversation_files(is_gated);

CREATE INDEX idx_profiles_warning_count ON profiles(warning_count);
CREATE INDEX idx_profiles_is_suspended ON profiles(is_suspended);

-- Update triggers for timestamps
CREATE TRIGGER update_conversation_files_updated_at 
  BEFORE UPDATE ON conversation_files 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create storage bucket for conversation files (if not exists)
-- Note: This should be run in Supabase storage settings or via dashboard
-- INSERT INTO storage.buckets (id, name, public) VALUES ('conversation-files', 'conversation-files', true)
-- ON CONFLICT (id) DO NOTHING;

-- Create policy for storage bucket (if not exists)
-- CREATE POLICY "Authenticated users can upload files" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'conversation-files' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can view files in conversations they participate in" ON storage.objects
--   FOR SELECT USING (bucket_id = 'conversation-files' AND auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE violation_logs IS 'Logs all detected attempts to share contact information or bypass the platform';
COMMENT ON TABLE conversation_files IS 'Tracks all files shared in conversations with gating controls';
COMMENT ON COLUMN profiles.warning_count IS 'Number of platform policy warnings issued to user';
COMMENT ON COLUMN profiles.is_suspended IS 'Whether user is currently suspended for policy violations';