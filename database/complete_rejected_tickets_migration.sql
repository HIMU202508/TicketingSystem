-- Complete migration for rejected tickets functionality
-- This script adds the rejected status to existing tickets table and creates the rejected_tickets tracking table

-- Step 1: Add remarks column to tickets table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'remarks') THEN
        ALTER TABLE tickets ADD COLUMN remarks TEXT;
    END IF;
END $$;

-- Step 2: Update the status check constraint to include 'rejected'
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'rejected'));

-- Step 3: Create index on remarks for searching rejection reasons (optional)
CREATE INDEX IF NOT EXISTS idx_tickets_remarks ON tickets(remarks) WHERE remarks IS NOT NULL;

-- Step 4: Create rejected_tickets table to track all rejected tickets with reasons
CREATE TABLE IF NOT EXISTS rejected_tickets (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL,
  ticket_number VARCHAR(20) NOT NULL,
  device_type VARCHAR(100) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  facility VARCHAR(255) NOT NULL,
  original_description TEXT,
  rejection_reason TEXT NOT NULL,
  rejected_by VARCHAR(255),
  rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for better performance on rejected_tickets
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_ticket_number ON rejected_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_rejected_at ON rejected_tickets(rejected_at);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_facility ON rejected_tickets(facility);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_rejected_by ON rejected_tickets(rejected_by);

-- Step 6: Enable Row Level Security (RLS) on rejected_tickets
ALTER TABLE rejected_tickets ENABLE ROW LEVEL SECURITY;

-- Step 7: Create policies for rejected_tickets table (drop existing ones first)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON rejected_tickets;
DROP POLICY IF EXISTS "Allow read access for anonymous users" ON rejected_tickets;

CREATE POLICY "Allow all operations for authenticated users" ON rejected_tickets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for anonymous users" ON rejected_tickets
  FOR SELECT USING (true);

-- Step 8: Create a function to automatically update the created_at timestamp
CREATE OR REPLACE FUNCTION update_rejected_tickets_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 9: Create trigger to automatically update created_at when a row is modified
CREATE TRIGGER update_rejected_tickets_created_at 
    BEFORE UPDATE ON rejected_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_rejected_tickets_created_at_column();

-- Step 10: Migrate any existing rejected tickets from tickets table to rejected_tickets table
-- (This will only run if there are existing rejected tickets)
INSERT INTO rejected_tickets (
    ticket_id, 
    ticket_number, 
    device_type, 
    owner_name, 
    facility, 
    original_description, 
    rejection_reason, 
    rejected_by, 
    rejected_at
)
SELECT 
    id,
    ticket_number,
    device_type,
    owner_name,
    facility,
    description,
    COALESCE(remarks, 'No reason provided'),
    'System Migration',
    updated_at
FROM tickets 
WHERE status = 'rejected'
ON CONFLICT DO NOTHING;

-- Step 11: Create a view for easy reporting of rejected tickets with additional context
CREATE OR REPLACE VIEW rejected_tickets_report AS
SELECT 
    rt.*,
    t.priority,
    t.assigned_to as last_assigned_to,
    t.created_at as original_created_at,
    t.updated_at as last_updated_at,
    EXTRACT(EPOCH FROM (rt.rejected_at - t.created_at))/3600 as hours_to_rejection
FROM rejected_tickets rt
LEFT JOIN tickets t ON rt.ticket_id = t.id
ORDER BY rt.rejected_at DESC;

-- Step 12: Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT ON rejected_tickets TO your_read_only_role;
-- GRANT SELECT ON rejected_tickets_report TO your_read_only_role;

-- Migration completed successfully
-- You can now use the rejected tickets functionality
