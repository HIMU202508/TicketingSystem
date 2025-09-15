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

async function createDeclinedTable() {
  console.log('🚀 Creating declined_tickets table...')
  
  try {
    // First, let's check if rejected_tickets exists and copy its data
    console.log('📝 Step 1: Checking existing rejected_tickets table...')
    const { data: existingData, error: checkError } = await supabase
      .from('rejected_tickets')
      .select('*')
    
    if (checkError) {
      console.log('No existing rejected_tickets table found, creating new declined_tickets table...')
    } else {
      console.log(`Found ${existingData?.length || 0} records in rejected_tickets table`)
    }

    // Create the declined_tickets table with the correct structure
    console.log('📝 Step 2: Creating declined_tickets table...')
    
    // Use raw SQL to create the table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS declined_tickets (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL,
        ticket_number VARCHAR(255) NOT NULL,
        device_type VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        facility VARCHAR(255) NOT NULL,
        original_description TEXT,
        decline_reason TEXT NOT NULL,
        declined_by VARCHAR(255),
        declined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_declined_tickets_ticket_number ON declined_tickets(ticket_number);
      CREATE INDEX IF NOT EXISTS idx_declined_tickets_declined_at ON declined_tickets(declined_at);
      CREATE INDEX IF NOT EXISTS idx_declined_tickets_facility ON declined_tickets(facility);
      CREATE INDEX IF NOT EXISTS idx_declined_tickets_declined_by ON declined_tickets(declined_by);
      
      -- Enable RLS
      ALTER TABLE declined_tickets ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY IF NOT EXISTS "Allow all operations for authenticated users" ON declined_tickets
        FOR ALL USING (auth.role() = 'authenticated');
      
      CREATE POLICY IF NOT EXISTS "Allow read access for anonymous users" ON declined_tickets
        FOR SELECT USING (true);
    `

    // Execute the SQL using a function call (if available)
    try {
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
      if (sqlError) {
        console.log('Direct SQL execution not available, trying alternative approach...')
        throw sqlError
      }
    } catch (sqlError) {
      console.log('Creating table using alternative method...')
      
      // Alternative: Create a sample record to force table creation
      const { error: insertError } = await supabase
        .from('declined_tickets')
        .insert({
          ticket_id: 0,
          ticket_number: 'SAMPLE-000',
          device_type: 'Sample',
          owner_name: 'Sample',
          facility: 'Sample',
          original_description: 'Sample record to create table',
          decline_reason: 'Sample decline reason',
          declined_by: 'System',
          declined_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
      
      if (insertError) {
        console.error('❌ Failed to create table:', insertError.message)
        return
      }
      
      // Delete the sample record
      await supabase
        .from('declined_tickets')
        .delete()
        .eq('ticket_number', 'SAMPLE-000')
    }

    // If we have existing data, migrate it
    if (existingData && existingData.length > 0) {
      console.log('📝 Step 3: Migrating existing data...')
      
      const migratedData = existingData.map(record => ({
        ticket_id: record.ticket_id,
        ticket_number: record.ticket_number,
        device_type: record.device_type,
        owner_name: record.owner_name,
        facility: record.facility,
        original_description: record.original_description,
        decline_reason: record.rejection_reason,
        declined_by: record.rejected_by,
        declined_at: record.rejected_at,
        created_at: record.created_at
      }))

      const { error: insertError } = await supabase
        .from('declined_tickets')
        .insert(migratedData)

      if (insertError) {
        console.error('❌ Failed to migrate data:', insertError.message)
      } else {
        console.log(`✅ Migrated ${migratedData.length} records to declined_tickets`)
      }
    }

    // Test the new table
    console.log('📝 Step 4: Testing new table...')
    const { data: testData, error: testError } = await supabase
      .from('declined_tickets')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error testing new table:', testError.message)
    } else {
      console.log('✅ declined_tickets table is working correctly')
      console.log(`📊 Current record count: ${testData?.length || 0}`)
    }

    console.log('🎉 Table creation completed successfully!')

  } catch (error) {
    console.error('❌ Table creation failed:', error.message)
    process.exit(1)
  }
}

// Run the table creation
createDeclinedTable()
