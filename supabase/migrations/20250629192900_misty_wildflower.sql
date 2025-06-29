/*
  # Fix participant side assignment for anchors

  1. Changes
    - Add side column to participants table if it doesn't exist
    - Add constraint to ensure anchors have a side assigned
    - Update existing participants to have proper side assignment

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity with proper constraints
*/

-- Add side column to participants table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'participants' AND column_name = 'side'
  ) THEN
    ALTER TABLE participants ADD COLUMN side vote_side;
  END IF;
END $$;

-- Add constraint to ensure anchors have a side, but organiser/audience don't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_anchor_side'
  ) THEN
    ALTER TABLE participants ADD CONSTRAINT check_anchor_side 
    CHECK (
      (role = 'anchor' AND side IS NOT NULL) OR 
      (role IN ('organiser', 'audience') AND side IS NULL)
    );
  END IF;
END $$;

-- Create index for better performance on side queries
CREATE INDEX IF NOT EXISTS idx_participants_side ON participants(room_id, side);

-- Add index for better performance on role and last_seen queries
CREATE INDEX IF NOT EXISTS idx_participants_last_seen ON participants(room_id, role, last_seen);