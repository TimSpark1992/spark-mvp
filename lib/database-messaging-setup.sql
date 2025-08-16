-- Add messaging support to Supabase database
-- This extends the existing database with conversation and messaging functionality

-- Add media_kit_url to profiles table if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS media_kit_url TEXT;

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(brand_id, creator_id, campaign_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for new tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "conversations_select_policy" ON conversations FOR SELECT 
USING (auth.uid() = brand_id OR auth.uid() = creator_id);

CREATE POLICY "conversations_insert_policy" ON conversations FOR INSERT 
WITH CHECK (
  (auth.uid() = brand_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'brand')) OR
  (auth.uid() = creator_id AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'creator'))
);

-- RLS policies for messages  
CREATE POLICY "messages_select_policy" ON messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.brand_id = auth.uid() OR conversations.creator_id = auth.uid())
  )
);

CREATE POLICY "messages_insert_policy" ON messages FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (conversations.brand_id = auth.uid() OR conversations.creator_id = auth.uid())
  )
);

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_brand_id ON conversations(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversations_creator_id ON conversations(creator_id);
CREATE INDEX IF NOT EXISTS idx_conversations_campaign_id ON conversations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Create updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at 
BEFORE UPDATE ON conversations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();