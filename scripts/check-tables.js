const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '')
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
  console.log('🔍 Checking database tables...')
  
  try {
    // Check if rejected_tickets table exists
    console.log('📝 Checking for rejected_tickets table...')
    const { data: rejectedData, error: rejectedError } = await supabase
      .from('rejected_tickets')
      .select('*')
      .limit(1)
    
    if (rejectedError) {
      console.log('❌ rejected_tickets table does not exist:', rejectedError.message)
    } else {
      console.log('✅ rejected_tickets table exists with', rejectedData?.length || 0, 'sample records')
    }

    // Check if declined_tickets table exists
    console.log('📝 Checking for declined_tickets table...')
    const { data: declinedData, error: declinedError } = await supabase
      .from('declined_tickets')
      .select('*')
      .limit(1)
    
    if (declinedError) {
      console.log('❌ declined_tickets table does not exist:', declinedError.message)
    } else {
      console.log('✅ declined_tickets table exists with', declinedData?.length || 0, 'sample records')
    }

    // Check tickets table
    console.log('📝 Checking tickets table...')
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select('status')
      .limit(5)
    
    if (ticketsError) {
      console.log('❌ tickets table error:', ticketsError.message)
    } else {
      console.log('✅ tickets table exists')
      const statuses = ticketsData?.map(t => t.status) || []
      console.log('📊 Sample statuses:', [...new Set(statuses)])
    }

    // Provide recommendations
    console.log('\n🔧 Recommendations:')
    
    if (rejectedError && declinedError) {
      console.log('📋 Neither rejected_tickets nor declined_tickets table exists.')
      console.log('💡 Solution: Create the rejected_tickets table first, then migrate to declined_tickets later.')
      console.log('')
      console.log('🛠️ Run this SQL in your Supabase dashboard:')
      console.log(`
CREATE TABLE IF NOT EXISTS rejected_tickets (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL,
  ticket_number VARCHAR(255) NOT NULL,
  device_type VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  facility VARCHAR(255) NOT NULL,
  original_description TEXT,
  rejection_reason TEXT NOT NULL,
  rejected_by VARCHAR(255),
  rejected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_ticket_number ON rejected_tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_rejected_at ON rejected_tickets(rejected_at);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_facility ON rejected_tickets(facility);
CREATE INDEX IF NOT EXISTS idx_rejected_tickets_rejected_by ON rejected_tickets(rejected_by);

-- Enable RLS
ALTER TABLE rejected_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations for authenticated users" ON rejected_tickets
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access for anonymous users" ON rejected_tickets
  FOR SELECT USING (true);
      `)
    } else if (rejectedError && !declinedError) {
      console.log('📋 declined_tickets table exists, but rejected_tickets does not.')
      console.log('💡 Solution: Update code to use declined_tickets table.')
    } else if (!rejectedError && declinedError) {
      console.log('📋 rejected_tickets table exists, but declined_tickets does not.')
      console.log('💡 Solution: Current setup is correct - using rejected_tickets temporarily.')
    } else {
      console.log('📋 Both tables exist.')
      console.log('💡 Solution: Choose which table to use and update code accordingly.')
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error.message)
  }
}

// Run the check
checkTables()
