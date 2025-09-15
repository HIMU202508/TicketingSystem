-- Create rejected_tickets table to track all rejected tickets with reasons
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_ticket_number ON rejected_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_rejected_at ON rejected_tickets(rejected_at);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_facility ON rejected_tickets(facility);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_rejected_by ON rejected_tickets(rejected_by);

-- Enable Row Level Security (RLS)
ALTER TABLE rejected_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON rejected_tickets;
DROP POLICY IF EXISTS "Allow read access for anonymous users" ON rejected_tickets;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON rejected_tickets
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow read access for anonymous users (for reporting purposes)
CREATE POLICY "Allow read access for anonymous users" ON rejected_tickets
  FOR SELECT USING (true);

-- Create a function to automatically update the created_at timestamp
CREATE OR REPLACE FUNCTION update_rejected_tickets_created_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update created_at when a row is modified
CREATE TRIGGER update_rejected_tickets_created_at 
    BEFORE UPDATE ON rejected_tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_rejected_tickets_created_at_column();
