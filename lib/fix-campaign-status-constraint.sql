-- FIX: Add 'draft' status to campaigns table constraint
-- Execute this in Supabase SQL Editor to fix the draft save error

-- Drop the existing constraint
ALTER TABLE campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;

-- Add the new constraint with 'draft' included
ALTER TABLE campaigns ADD CONSTRAINT campaigns_status_check 
CHECK (status IN ('active', 'paused', 'completed', 'cancelled', 'draft'));

-- Verify the constraint was updated
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'campaigns' 
  AND n.nspname = 'public'
  AND conname = 'campaigns_status_check';