-- Fix for policy conflict error
-- Run this script to resolve the "policy already exists" error

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON rejected_tickets;
DROP POLICY IF EXISTS "Allow read access for anonymous users" ON rejected_tickets;

-- Recreate the policies
CREATE POLICY "Allow all operations for authenticated users" ON rejected_tickets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for anonymous users" ON rejected_tickets
  FOR SELECT USING (true);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'rejected_tickets';
