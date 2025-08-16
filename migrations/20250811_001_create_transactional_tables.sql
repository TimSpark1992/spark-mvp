-- Migration: 20250811_001_create_transactional_tables.sql
-- Spark Marketplace Transactional Layer - Core Tables

-- 1) Creator Rate Cards
CREATE TABLE rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN ('IG_Reel', 'IG_Story', 'TikTok_Post', 'YouTube_Video', 'Bundle')),
  base_price_cents INTEGER NOT NULL CHECK (base_price_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'MYR', 'SGD')),
  rush_pct INTEGER DEFAULT 0 CHECK (rush_pct >= 0 AND rush_pct <= 200),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, deliverable_type, currency)
);

-- 2) Marketplace Offers
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  platform_fee_pct INTEGER DEFAULT 20 CHECK (platform_fee_pct >= 0 AND platform_fee_pct <= 50),
  platform_fee_cents INTEGER NOT NULL CHECK (platform_fee_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'MYR', 'SGD')),
  status TEXT NOT NULL DEFAULT 'drafted' CHECK (status IN (
    'drafted', 'sent', 'accepted', 'paid_escrow', 'in_progress', 
    'submitted', 'approved', 'released', 'completed', 'cancelled', 'refunded'
  )),
  expires_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Payment Records
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'MYR', 'SGD')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid_escrow', 'released', 'refunded', 'failed'
  )),
  webhook_events JSONB DEFAULT '[]'::jsonb,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4) Creator Payouts
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'MYR', 'SGD')),
  stripe_transfer_id TEXT,
  method TEXT NOT NULL DEFAULT 'stripe' CHECK (method IN ('stripe', 'manual')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'released', 'failed', 'refunded'
  )),
  reference_number TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5) Platform Configuration
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_pct INTEGER DEFAULT 20 CHECK (platform_fee_pct >= 0 AND platform_fee_pct <= 50),
  auto_release_days INTEGER DEFAULT 7 CHECK (auto_release_days >= 1),
  relay_enabled BOOLEAN DEFAULT false,
  fallback_manual_payouts BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO platform_settings (platform_fee_pct, auto_release_days, relay_enabled, fallback_manual_payouts)
VALUES (20, 7, false, false);

-- 6) Extend existing messages table for anti-disintermediation
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS redacted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS original_content TEXT;

-- Indexes for performance
CREATE INDEX idx_rate_cards_creator_id ON rate_cards(creator_id);
CREATE INDEX idx_rate_cards_active ON rate_cards(active) WHERE active = true;
CREATE INDEX idx_offers_brand_id ON offers(brand_id);
CREATE INDEX idx_offers_creator_id ON offers(creator_id);
CREATE INDEX idx_offers_campaign_id ON offers(campaign_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE INDEX idx_payments_offer_id ON payments(offer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payouts_creator_id ON payouts(creator_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rate_cards_updated_at BEFORE UPDATE ON rate_cards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON platform_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();