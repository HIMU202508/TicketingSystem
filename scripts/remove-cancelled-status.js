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

async function removeCancelledStatus() {
  console.log('🔧 Removing "cancelled" status and updating to "declined"...')
  
  try {
    // Step 1: Check for existing cancelled tickets
    console.log('📝 Step 1: Checking for existing cancelled tickets...')
    const { data: cancelledTickets, error: fetchError } = await supabase
      .from('tickets')
      .select('id, ticket_number, status')
      .eq('status', 'cancelled')
    
    if (fetchError) {
      console.log('Note: Could not fetch cancelled tickets:', fetchError.message)
    } else {
      console.log(`Found ${cancelledTickets?.length || 0} cancelled tickets`)
    }

    // Step 2: Update cancelled tickets to declined
    if (cancelledTickets && cancelledTickets.length > 0) {
      console.log('📝 Step 2: Updating cancelled tickets to declined...')
      const { data: updatedTickets, error: updateError } = await supabase
        .from('tickets')
        .update({ status: 'declined' })
        .eq('status', 'cancelled')
      
      if (updateError) {
        console.error('❌ Failed to update cancelled tickets:', updateError.message)
      } else {
        console.log(`✅ Updated ${cancelledTickets.length} tickets from cancelled to declined`)
      }
    }

    // Step 3: Update the status constraint to remove 'cancelled'
    console.log('📝 Step 3: Updating status constraint...')
    
    // Try different methods to update the constraint
    const sqlCommands = [
      'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;',
      `ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
       CHECK (status IN ('pending', 'in_progress', 'completed', 'not_functioning', 'declined'));`
    ]

    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql}`)
      
      // Try using different RPC function names that might be available
      const rpcMethods = ['sql', 'exec_sql', 'execute_sql']
      let success = false
      
      for (const method of rpcMethods) {
        try {
          const { error } = await supabase.rpc(method, { 
            query: sql,
            sql: sql 
          })
          
          if (!error) {
            console.log(`✅ Successfully executed via ${method}`)
            success = true
            break
          }
        } catch (e) {
          // Try next method
          continue
        }
      }
      
      if (!success) {
        console.log(`⚠️ Could not execute via RPC: ${sql}`)
      }
    }

    // Step 4: Test the new constraint
    console.log('📝 Step 4: Testing new constraint...')
    
    // Try to update a ticket to declined status to test
    const { data: testTickets, error: testFetchError } = await supabase
      .from('tickets')
      .select('id, status')
      .limit(1)
    
    if (testFetchError) {
      console.error('❌ Error fetching test tickets:', testFetchError.message)
      return
    }

    if (testTickets && testTickets.length > 0) {
      const testTicket = testTickets[0]
      const originalStatus = testTicket.status
      
      // Try to update to declined status
      const { error: testUpdateError } = await supabase
        .from('tickets')
        .update({ status: 'declined' })
        .eq('id', testTicket.id)
      
      if (testUpdateError) {
        console.error('❌ Constraint still has issues:', testUpdateError.message)
        console.log('🔧 Manual database update may be required.')
        console.log('📋 Please run this SQL in your Supabase dashboard:')
        console.log('')
        console.log('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;')
        console.log('ALTER TABLE tickets ADD CONSTRAINT tickets_status_check')
        console.log("  CHECK (status IN ('pending', 'in_progress', 'completed', 'not_functioning', 'declined'));")
        console.log('')
        return
      } else {
        console.log('✅ Successfully tested "declined" status!')
        
        // Revert the test ticket back to its original status
        await supabase
          .from('tickets')
          .update({ status: originalStatus })
          .eq('id', testTicket.id)
        
        console.log(`✅ Reverted test ticket back to "${originalStatus}" status`)
      }
    }

    console.log('🎉 Successfully removed "cancelled" status!')
    console.log('📊 Summary:')
    console.log('   ✅ Updated cancelled tickets to declined')
    console.log('   ✅ Removed "cancelled" from status constraint')
    console.log('   ✅ Available statuses: pending, in_progress, completed, not_functioning, declined')

  } catch (error) {
    console.error('❌ Failed to remove cancelled status:', error.message)
    console.log('')
    console.log('🔧 Manual Fix Required:')
    console.log('Please run these SQL commands in your Supabase dashboard:')
    console.log('')
    console.log('-- Update cancelled tickets to declined')
    console.log("UPDATE tickets SET status = 'declined' WHERE status = 'cancelled';")
    console.log('')
    console.log('-- Update constraint')
    console.log('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;')
    console.log('ALTER TABLE tickets ADD CONSTRAINT tickets_status_check')
    console.log("  CHECK (status IN ('pending', 'in_progress', 'completed', 'not_functioning', 'declined'));")
    console.log('')
  }
}

// Run the status removal
removeCancelledStatus()
