-- Migration script to add serial_number column to existing tickets table
-- This script safely adds the serial_number column if it doesn't already exist

DO $$ 
BEGIN
    -- Check if serial_number column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'tickets' AND column_name = 'serial_number') THEN
        ALTER TABLE tickets ADD COLUMN serial_number VARCHAR(255);
        RAISE NOTICE 'Added serial_number column to tickets table';
    ELSE
        RAISE NOTICE 'serial_number column already exists in tickets table';
    END IF;
END $$;

-- Create index on serial_number for faster lookups (optional)
CREATE INDEX IF NOT EXISTS idx_tickets_serial_number ON tickets(serial_number);

-- Update any existing sample data to include serial numbers (optional)
-- This is just an example - you can remove this if you don't want to modify existing data
UPDATE tickets 
SET serial_number = CASE 
    WHEN device_type = 'Laptop' THEN 'SN-LAP-' || LPAD(id::text, 6, '0')
    WHEN device_type = 'Desktop' THEN 'SN-DES-' || LPAD(id::text, 6, '0')
    WHEN device_type = 'Printer' THEN 'SN-PRT-' || LPAD(id::text, 6, '0')
    ELSE 'SN-DEV-' || LPAD(id::text, 6, '0')
END
WHERE serial_number IS NULL AND id <= 3; -- Only update the sample data

COMMIT;
