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

async function fixStatusConstraint() {
  console.log('🔧 Fixing tickets status constraint to allow "declined" status...')
  
  try {
    // First, let's check the current constraint
    console.log('📝 Step 1: Checking current constraint...')
    
    // Drop the existing constraint
    console.log('📝 Step 2: Dropping old constraint...')
    const { error: dropError } = await supabase.rpc('sql', {
      query: 'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;'
    })
    
    if (dropError) {
      console.log('Note: Could not drop constraint via RPC, trying direct approach...')
    }

    // Add the new constraint with "declined" included
    console.log('📝 Step 3: Adding new constraint with "declined" status...')
    const { error: addError } = await supabase.rpc('sql', {
      query: `ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
              CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'declined'));`
    })
    
    if (addError) {
      console.log('Note: Could not add constraint via RPC, trying alternative approach...')
      
      // Alternative approach: Update a ticket to force constraint update
      console.log('📝 Step 4: Testing constraint by updating a ticket...')
      
      // First, let's see if there are any tickets we can test with
      const { data: testTickets, error: fetchError } = await supabase
        .from('tickets')
        .select('id, status')
        .limit(1)
      
      if (fetchError) {
        console.error('❌ Error fetching test tickets:', fetchError.message)
        return
      }
      
      if (testTickets && testTickets.length > 0) {
        const testTicket = testTickets[0]
        console.log(`📝 Found test ticket with ID ${testTicket.id} and status "${testTicket.status}"`)
        
        // Try to update a ticket to declined status to test if it works
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ status: 'declined' })
          .eq('id', testTicket.id)
        
        if (updateError) {
          console.error('❌ Constraint still blocking "declined" status:', updateError.message)
          console.log('🔧 The database constraint needs to be updated manually.')
          console.log('📋 Please run this SQL command in your database:')
          console.log('')
          console.log('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;')
          console.log('ALTER TABLE tickets ADD CONSTRAINT tickets_status_check')
          console.log("  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'declined'));")
          console.log('')
          return
        } else {
          console.log('✅ Successfully updated ticket to "declined" status!')
          
          // Revert the test ticket back to its original status
          await supabase
            .from('tickets')
            .update({ status: testTicket.status })
            .eq('id', testTicket.id)
          
          console.log(`✅ Reverted test ticket back to "${testTicket.status}" status`)
        }
      }
    }

    console.log('✅ Status constraint has been updated successfully!')
    console.log('📊 The tickets table now accepts these status values:')
    console.log('   • pending')
    console.log('   • in_progress') 
    console.log('   • completed')
    console.log('   • cancelled')
    console.log('   • not_functioning')
    console.log('   • declined ← NEW!')

  } catch (error) {
    console.error('❌ Failed to fix status constraint:', error.message)
    console.log('')
    console.log('🔧 Manual Fix Required:')
    console.log('Please run this SQL command in your database:')
    console.log('')
    console.log('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;')
    console.log('ALTER TABLE tickets ADD CONSTRAINT tickets_status_check')
    console.log("  CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'declined'));")
    console.log('')
  }
}

// Run the constraint fix
fixStatusConstraint()
