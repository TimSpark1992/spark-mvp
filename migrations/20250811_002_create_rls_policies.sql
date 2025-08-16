-- Migration: 20250811_002_create_rls_policies.sql
-- Spark Marketplace Transactional Layer - Row Level Security

-- Enable RLS on all new tables
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Rate Cards RLS
CREATE POLICY "Creators can CRUD their own rate cards" ON rate_cards
  FOR ALL USING (creator_id = auth.uid());

CREATE POLICY "Brands can view active rate cards" ON rate_cards
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage all rate cards" ON rate_cards
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Offers RLS
CREATE POLICY "Participants can view their offers" ON offers
  FOR SELECT USING (
    brand_id = auth.uid() OR 
    creator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Brands can create offers" ON offers
  FOR INSERT WITH CHECK (brand_id = auth.uid());

CREATE POLICY "Participants can update offers based on status" ON offers
  FOR UPDATE USING (
    (brand_id = auth.uid() AND status IN ('drafted', 'sent')) OR
    (creator_id = auth.uid() AND status IN ('sent')) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Payments RLS
CREATE POLICY "Participants can view their payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM offers o 
      WHERE o.id = offer_id AND (o.brand_id = auth.uid() OR o.creator_id = auth.uid())
    ) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can manage payments" ON payments
  FOR ALL USING (true); -- Handled by server-side security

-- Payouts RLS  
CREATE POLICY "Creators can view their payouts" ON payouts
  FOR SELECT USING (
    creator_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can manage payouts" ON payouts
  FOR ALL USING (true); -- Handled by server-side security

-- Platform Settings RLS
CREATE POLICY "Admins can manage platform settings" ON platform_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "All users can read platform settings" ON platform_settings
  FOR SELECT USING (true);