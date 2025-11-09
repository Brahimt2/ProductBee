-- Migration: Add pending_changes table (Phase 12)
-- Run this SQL in your Supabase SQL Editor to add pending status changes support

-- Create pending_changes table if it doesn't exist
CREATE TABLE IF NOT EXISTS pending_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  account_id TEXT NOT NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pending_changes_feature_id ON pending_changes(feature_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_account_id ON pending_changes(account_id);
CREATE INDEX IF NOT EXISTS idx_pending_changes_proposed_by ON pending_changes(proposed_by);
CREATE INDEX IF NOT EXISTS idx_pending_changes_status ON pending_changes(status);
CREATE INDEX IF NOT EXISTS idx_pending_changes_created_at ON pending_changes(created_at);

-- Add comment to table
COMMENT ON TABLE pending_changes IS 'Tracks pending status change proposals for features (Phase 12: Drag-and-Drop with Two-Way Confirmation)';

-- Enable real-time for pending_changes table (requires Supabase Realtime to be enabled)
-- Note: You may need to enable Realtime in your Supabase project settings
ALTER PUBLICATION supabase_realtime ADD TABLE pending_changes;

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pending_changes' 
ORDER BY ordinal_position;

