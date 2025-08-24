-- Fix Rate Cards Database Constraint
-- =====================================
-- 
-- PROBLEM: The current unique constraint applies to ALL records (including soft-deleted)
-- This prevents users from recreating rate cards after deletion
--
-- SOLUTION: Replace with partial unique index that only applies to active records

-- Step 1: Drop the existing unique constraint
ALTER TABLE rate_cards 
DROP CONSTRAINT IF EXISTS rate_cards_creator_id_deliverable_type_currency_key;

-- Step 2: Create partial unique index for active records only
CREATE UNIQUE INDEX IF NOT EXISTS rate_cards_unique_active
ON rate_cards (creator_id, deliverable_type, currency)
WHERE active = true;

-- Verification query (optional - run after the above)
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'rate_cards' 
AND indexname = 'rate_cards_unique_active';