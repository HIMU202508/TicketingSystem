-- Migration to add 'rejected' status and remarks column to existing tickets table
-- Run this if you already have a tickets table without the rejected status

-- Add remarks column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'remarks') THEN
        ALTER TABLE tickets ADD COLUMN remarks TEXT;
    END IF;
END $$;

-- Update the status check constraint to include 'rejected'
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'rejected'));

-- Create index on remarks for searching rejection reasons (optional)
CREATE INDEX IF NOT EXISTS idx_tickets_remarks ON tickets(remarks) WHERE remarks IS NOT NULL;
