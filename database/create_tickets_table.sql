-- Create tickets table for IT support ticketing system
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  device_type VARCHAR(100) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  facility VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'rejected')),
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to VARCHAR(255),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on ticket_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_number ON tickets(ticket_number);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);

-- Create index on facility for filtering by location
CREATE INDEX IF NOT EXISTS idx_tickets_facility ON tickets(facility);

-- Enable Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- You may want to restrict this based on your security requirements
CREATE POLICY "Allow all operations for authenticated users" ON tickets
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policy to allow read access for anonymous users (for public ticket status checking)
CREATE POLICY "Allow read access for anonymous users" ON tickets
  FOR SELECT USING (true);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at when a row is modified
CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional)
INSERT INTO tickets (ticket_number, device_type, owner_name, facility, status, description) VALUES
('LA20250811', 'Laptop', 'John Doe', 'Main Office', 'pending', 'Laptop screen flickering issue'),
('DE20250811', 'Desktop', 'Jane Smith', 'IT Department', 'in_progress', 'Computer won''t boot up'),
('PR20250810', 'Printer', 'Bob Johnson', 'Reception', 'completed', 'Printer paper jam resolved')
ON CONFLICT (ticket_number) DO NOTHING;
