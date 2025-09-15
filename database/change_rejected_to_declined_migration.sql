-- Migration to change "rejected" terminology to "declined" throughout the system
-- This script updates database constraints, table names, column names, and views

-- Step 1: Update the status check constraint to use 'declined' instead of 'rejected'
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'declined'));

-- Step 2: Update any existing 'rejected' status to 'declined' in tickets table
UPDATE tickets SET status = 'declined' WHERE status = 'rejected';

-- Step 3: Rename rejected_tickets table to declined_tickets
ALTER TABLE IF EXISTS rejected_tickets RENAME TO declined_tickets;

-- Step 4: Rename columns in declined_tickets table
ALTER TABLE IF EXISTS declined_tickets RENAME COLUMN rejection_reason TO decline_reason;
ALTER TABLE IF EXISTS declined_tickets RENAME COLUMN rejected_by TO declined_by;
ALTER TABLE IF EXISTS declined_tickets RENAME COLUMN rejected_at TO declined_at;

-- Step 5: Update indexes to reflect new table and column names
DROP INDEX IF EXISTS idx_rejected_tickets_ticket_number;
DROP INDEX IF EXISTS idx_rejected_tickets_rejected_at;
DROP INDEX IF EXISTS idx_rejected_tickets_facility;
DROP INDEX IF EXISTS idx_rejected_tickets_rejected_by;

-- Create new indexes with declined naming
CREATE INDEX IF NOT EXISTS idx_declined_tickets_ticket_number ON declined_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_declined_tickets_declined_at ON declined_tickets(declined_at);
CREATE INDEX IF NOT EXISTS idx_declined_tickets_facility ON declined_tickets(facility);
CREATE INDEX IF NOT EXISTS idx_declined_tickets_declined_by ON declined_tickets(declined_by);

-- Step 6: Update performance optimization indexes
DROP INDEX IF EXISTS idx_rejected_tickets_facility_rejected_at;
DROP INDEX IF EXISTS idx_rejected_tickets_rejected_by_rejected_at;
DROP INDEX IF EXISTS idx_rejected_tickets_device_type_gin;
DROP INDEX IF EXISTS idx_rejected_tickets_owner_name_gin;
DROP INDEX IF EXISTS idx_rejected_tickets_rejection_reason_gin;
DROP INDEX IF EXISTS idx_rejected_tickets_today;

-- Create new performance indexes with declined naming
CREATE INDEX IF NOT EXISTS idx_declined_tickets_facility_declined_at ON declined_tickets(facility, declined_at DESC);
CREATE INDEX IF NOT EXISTS idx_declined_tickets_declined_by_declined_at ON declined_tickets(declined_by, declined_at DESC) WHERE declined_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_declined_tickets_device_type_gin ON declined_tickets USING gin(to_tsvector('english', device_type));
CREATE INDEX IF NOT EXISTS idx_declined_tickets_owner_name_gin ON declined_tickets USING gin(to_tsvector('english', owner_name));
CREATE INDEX IF NOT EXISTS idx_declined_tickets_decline_reason_gin ON declined_tickets USING gin(to_tsvector('english', decline_reason));
CREATE INDEX IF NOT EXISTS idx_declined_tickets_today ON declined_tickets(declined_at) WHERE declined_at >= CURRENT_DATE;

-- Step 7: Update Row Level Security policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON declined_tickets;
DROP POLICY IF EXISTS "Allow read access for anonymous users" ON declined_tickets;

-- Recreate policies for declined_tickets table
CREATE POLICY "Allow all operations for authenticated users" ON declined_tickets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for anonymous users" ON declined_tickets
  FOR SELECT USING (true);

-- Step 8: Drop and recreate the view with new naming
DROP VIEW IF EXISTS rejected_tickets_report;

CREATE OR REPLACE VIEW declined_tickets_report AS
SELECT 
    dt.*,
    t.priority,
    t.assigned_to as last_assigned_to,
    t.created_at as original_created_at,
    t.updated_at as last_updated_at,
    EXTRACT(EPOCH FROM (dt.declined_at - t.created_at))/3600 as hours_to_decline
FROM declined_tickets dt
LEFT JOIN tickets t ON dt.ticket_id = t.id
ORDER BY dt.declined_at DESC;

-- Step 9: Update any triggers or functions that reference the old table/column names
-- (Add any custom triggers or functions here if they exist)

-- Step 10: Analyze tables to update statistics
ANALYZE tickets;
ANALYZE declined_tickets;

-- Verification queries (uncomment to run)
-- SELECT COUNT(*) as declined_count FROM tickets WHERE status = 'declined';
-- SELECT COUNT(*) as total_declined_tickets FROM declined_tickets;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'declined_tickets';
