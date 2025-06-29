/*
  # Add captions and enhanced summaries functionality

  1. New Tables
    - `captions` - Real-time speech-to-text captions for debates
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to rooms)
      - `user_id` (uuid, foreign key to auth.users)
      - `participant_side` (vote_side enum)
      - `content` (text, caption content)
      - `confidence` (numeric, speech recognition confidence)
      - `timestamp` (timestamptz)
      - `is_final` (boolean, whether caption is finalized)
      - `created_at` (timestamptz)

    - `discussion_summaries` - Enhanced AI-generated summaries
      - `id` (uuid, primary key)
      - `room_id` (uuid, foreign key to rooms)
      - `summary_type` (text, type of summary)
      - `content` (text, summary content)
      - `vote_results` (jsonb, voting statistics)
      - `key_points` (jsonb, extracted key points)
      - `side_a_arguments` (jsonb, arguments for side A)
      - `side_b_arguments` (jsonb, arguments for side B)
      - `total_messages` (integer, message count)
      - `total_captions` (integer, caption count)
      - `debate_duration` (interval, debate length)
      - `generated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on new tables
    - Add appropriate indexes for performance

  3. Changes
    - Enhanced summary system with captions integration
    - Real-time speech recognition support
    - Comprehensive debate analytics
*/

-- Create captions table only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'captions') THEN
    CREATE TABLE captions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      participant_side vote_side,
      content text NOT NULL,
      confidence numeric(3,2),
      timestamp timestamptz DEFAULT now(),
      is_final boolean DEFAULT false,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create indexes for captions if they don't exist
CREATE INDEX IF NOT EXISTS idx_captions_room_timestamp ON captions(room_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_captions_user_room ON captions(user_id, room_id);

-- Create discussion_summaries table only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'discussion_summaries') THEN
    CREATE TABLE discussion_summaries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
      summary_type text NOT NULL CHECK (summary_type IN ('live', 'final', 'periodic')),
      content text NOT NULL,
      vote_results jsonb,
      key_points jsonb,
      side_a_arguments jsonb,
      side_b_arguments jsonb,
      total_messages integer DEFAULT 0,
      total_captions integer DEFAULT 0,
      debate_duration interval,
      generated_at timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create indexes for discussion_summaries if they don't exist
CREATE INDEX IF NOT EXISTS idx_discussion_summaries_room ON discussion_summaries(room_id);
CREATE INDEX IF NOT EXISTS idx_discussion_summaries_type ON discussion_summaries(summary_type);

-- Enable RLS on captions if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'captions' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE captions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Enable RLS on discussion_summaries if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'discussion_summaries' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE discussion_summaries ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Add RLS policies for discussion_summaries only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discussion_summaries' 
    AND policyname = 'Anyone can view discussion summaries'
  ) THEN
    CREATE POLICY "Anyone can view discussion summaries"
      ON discussion_summaries FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'discussion_summaries' 
    AND policyname = 'System can create discussion summaries'
  ) THEN
    CREATE POLICY "System can create discussion summaries"
      ON discussion_summaries FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;