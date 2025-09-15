-- Performance optimization indexes for the ticketing system
-- Run this script to add additional indexes for better query performance

-- Composite indexes for tickets table
CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON tickets(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_facility_status ON tickets(facility, status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to_status ON tickets(assigned_to, status) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tickets_completed_at_status ON tickets(completed_at DESC, status) WHERE completed_at IS NOT NULL;

-- Text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_tickets_device_type_gin ON tickets USING gin(to_tsvector('english', device_type));
CREATE INDEX IF NOT EXISTS idx_tickets_owner_name_gin ON tickets USING gin(to_tsvector('english', owner_name));
CREATE INDEX IF NOT EXISTS idx_tickets_description_gin ON tickets USING gin(to_tsvector('english', description)) WHERE description IS NOT NULL;

-- Composite indexes for rejected_tickets table
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_facility_rejected_at ON rejected_tickets(facility, rejected_at DESC);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_rejected_by_rejected_at ON rejected_tickets(rejected_by, rejected_at DESC) WHERE rejected_by IS NOT NULL;

-- Text search indexes for rejected tickets
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_device_type_gin ON rejected_tickets USING gin(to_tsvector('english', device_type));
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_owner_name_gin ON rejected_tickets USING gin(to_tsvector('english', owner_name));
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_rejection_reason_gin ON rejected_tickets USING gin(to_tsvector('english', rejection_reason));

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tickets_pending_created_at ON tickets(created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_tickets_in_progress_updated_at ON tickets(updated_at DESC) WHERE status = 'in_progress';
CREATE INDEX IF NOT EXISTS idx_tickets_completed_today ON tickets(completed_at DESC) WHERE status = 'completed' AND completed_at >= CURRENT_DATE;

-- Index for dashboard statistics queries
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_today ON rejected_tickets(rejected_at) WHERE rejected_at >= CURRENT_DATE;

-- Analyze tables to update statistics
ANALYZE tickets;
ANALYZE rejected_tickets;

-- Create materialized view for dashboard statistics (optional, for very high traffic)
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= CURRENT_DATE) as completed_today_count,
    COUNT(*) as total_count
FROM tickets;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_unique ON dashboard_stats ((1));

-- Refresh materialized view (run this periodically or set up a trigger)
-- REFRESH MATERIALIZED VIEW dashboard_stats;
