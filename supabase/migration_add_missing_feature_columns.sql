-- Migration: Add missing feature columns
-- Run this SQL in your Supabase SQL Editor to fix database schema issues

-- Add story_points column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'story_points'
  ) THEN
    ALTER TABLE features ADD COLUMN story_points INTEGER;
    RAISE NOTICE 'Added story_points column';
  ELSE
    RAISE NOTICE 'story_points column already exists';
  END IF;
END $$;

-- Add acceptance_criteria column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'acceptance_criteria'
  ) THEN
    ALTER TABLE features ADD COLUMN acceptance_criteria TEXT;
    RAISE NOTICE 'Added acceptance_criteria column';
  ELSE
    RAISE NOTICE 'acceptance_criteria column already exists';
  END IF;
END $$;

-- Add labels column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'labels'
  ) THEN
    ALTER TABLE features ADD COLUMN labels TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added labels column';
  ELSE
    RAISE NOTICE 'labels column already exists';
  END IF;
END $$;

-- Add ticket_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'ticket_type'
  ) THEN
    ALTER TABLE features ADD COLUMN ticket_type TEXT CHECK (ticket_type IN ('feature', 'bug', 'epic', 'story')) DEFAULT 'feature';
    RAISE NOTICE 'Added ticket_type column';
  ELSE
    RAISE NOTICE 'ticket_type column already exists';
  END IF;
END $$;

-- Add assigned_to column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE features ADD COLUMN assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added assigned_to column';
  ELSE
    RAISE NOTICE 'assigned_to column already exists';
  END IF;
END $$;

-- Add reporter column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'reporter'
  ) THEN
    ALTER TABLE features ADD COLUMN reporter UUID REFERENCES users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added reporter column';
  ELSE
    RAISE NOTICE 'reporter column already exists';
  END IF;
END $$;

-- Add start_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'start_date'
  ) THEN
    ALTER TABLE features ADD COLUMN start_date DATE;
    RAISE NOTICE 'Added start_date column';
  ELSE
    RAISE NOTICE 'start_date column already exists';
  END IF;
END $$;

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'end_date'
  ) THEN
    ALTER TABLE features ADD COLUMN end_date DATE;
    RAISE NOTICE 'Added end_date column';
  ELSE
    RAISE NOTICE 'end_date column already exists';
  END IF;
END $$;

-- Add duration column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'features' 
    AND column_name = 'duration'
  ) THEN
    ALTER TABLE features ADD COLUMN duration INTEGER;
    RAISE NOTICE 'Added duration column';
  ELSE
    RAISE NOTICE 'duration column already exists';
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_features_story_points ON features(story_points);
CREATE INDEX IF NOT EXISTS idx_features_labels ON features USING GIN (labels);
CREATE INDEX IF NOT EXISTS idx_features_ticket_type ON features(ticket_type) WHERE ticket_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_features_start_date ON features(start_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_features_end_date ON features(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_features_assigned_to ON features(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_features_reporter ON features(reporter) WHERE reporter IS NOT NULL;

-- Verify all columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'features' 
ORDER BY ordinal_position;


