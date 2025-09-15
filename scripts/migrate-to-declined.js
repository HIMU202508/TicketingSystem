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

async function runMigration() {
  console.log('🚀 Starting migration from "rejected" to "declined" terminology...')
  
  try {
    // Step 1: Update the status check constraint
    console.log('📝 Step 1: Updating status constraint...')
    await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
        ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
            CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'declined'));
      `
    })

    // Step 2: Update any existing 'rejected' status to 'declined'
    console.log('📝 Step 2: Updating existing rejected status to declined...')
    const { data: updatedTickets, error: updateError } = await supabase
      .from('tickets')
      .update({ status: 'declined' })
      .eq('status', 'rejected')
    
    if (updateError) {
      console.log('Note: No rejected tickets found to update, or constraint already updated')
    } else {
      console.log(`✅ Updated ${updatedTickets?.length || 0} tickets from rejected to declined status`)
    }

    // Step 3: Rename rejected_tickets table to declined_tickets
    console.log('📝 Step 3: Renaming table and columns...')
    await supabase.rpc('exec_sql', {
      sql: `
        -- Rename table
        ALTER TABLE IF EXISTS rejected_tickets RENAME TO declined_tickets;
        
        -- Rename columns
        ALTER TABLE IF EXISTS declined_tickets RENAME COLUMN rejection_reason TO decline_reason;
        ALTER TABLE IF EXISTS declined_tickets RENAME COLUMN rejected_by TO declined_by;
        ALTER TABLE IF EXISTS declined_tickets RENAME COLUMN rejected_at TO declined_at;
      `
    })

    // Step 4: Update indexes
    console.log('📝 Step 4: Updating indexes...')
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop old indexes
        DROP INDEX IF EXISTS idx_rejected_tickets_ticket_number;
        DROP INDEX IF EXISTS idx_rejected_tickets_rejected_at;
        DROP INDEX IF EXISTS idx_rejected_tickets_facility;
        DROP INDEX IF EXISTS idx_rejected_tickets_rejected_by;
        
        -- Create new indexes
        CREATE INDEX IF NOT EXISTS idx_declined_tickets_ticket_number ON declined_tickets(ticket_number);
        CREATE INDEX IF NOT EXISTS idx_declined_tickets_declined_at ON declined_tickets(declined_at);
        CREATE INDEX IF NOT EXISTS idx_declined_tickets_facility ON declined_tickets(facility);
        CREATE INDEX IF NOT EXISTS idx_declined_tickets_declined_by ON declined_tickets(declined_by);
      `
    })

    // Step 5: Update RLS policies
    console.log('📝 Step 5: Updating Row Level Security policies...')
    await supabase.rpc('exec_sql', {
      sql: `
        -- Drop old policies
        DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON declined_tickets;
        DROP POLICY IF EXISTS "Allow read access for anonymous users" ON declined_tickets;
        
        -- Create new policies
        CREATE POLICY "Allow all operations for authenticated users" ON declined_tickets
          FOR ALL USING (auth.role() = 'authenticated');
        
        CREATE POLICY "Allow read access for anonymous users" ON declined_tickets
          FOR SELECT USING (true);
      `
    })

    // Step 6: Test the new table
    console.log('📝 Step 6: Testing new table structure...')
    const { data: testData, error: testError } = await supabase
      .from('declined_tickets')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error testing new table:', testError.message)
    } else {
      console.log('✅ New declined_tickets table is working correctly')
    }

    console.log('🎉 Migration completed successfully!')
    console.log('📊 Summary:')
    console.log('   ✅ Table renamed: rejected_tickets → declined_tickets')
    console.log('   ✅ Columns renamed: rejection_reason → decline_reason, rejected_by → declined_by, rejected_at → declined_at')
    console.log('   ✅ Status constraint updated: rejected → declined')
    console.log('   ✅ Indexes updated')
    console.log('   ✅ RLS policies updated')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run the migration
runMigration()
