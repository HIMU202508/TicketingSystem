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

async function checkTableStructure() {
  console.log('🔍 Checking declined_tickets table structure...')
  
  try {
    // Try to select with old column names
    console.log('📝 Testing old column names (rejection_reason, rejected_by, rejected_at)...')
    const { data: oldData, error: oldError } = await supabase
      .from('declined_tickets')
      .select('id, ticket_id, ticket_number, device_type, owner_name, facility, original_description, rejection_reason, rejected_by, rejected_at, created_at')
      .limit(1)
    
    if (!oldError) {
      console.log('✅ Old column names work! Table has:', Object.keys(oldData?.[0] || {}))
      console.log('💡 The table still uses old column names: rejection_reason, rejected_by, rejected_at')
    } else {
      console.log('❌ Old column names failed:', oldError.message)
    }

    // Try to select with new column names
    console.log('📝 Testing new column names (decline_reason, declined_by, declined_at)...')
    const { data: newData, error: newError } = await supabase
      .from('declined_tickets')
      .select('id, ticket_id, ticket_number, device_type, owner_name, facility, original_description, decline_reason, declined_by, declined_at, created_at')
      .limit(1)
    
    if (!newError) {
      console.log('✅ New column names work! Table has:', Object.keys(newData?.[0] || {}))
      console.log('💡 The table uses new column names: decline_reason, declined_by, declined_at')
    } else {
      console.log('❌ New column names failed:', newError.message)
    }

    // Try to get any record to see actual structure
    console.log('📝 Getting actual table structure...')
    const { data: anyData, error: anyError } = await supabase
      .from('declined_tickets')
      .select('*')
      .limit(1)
    
    if (!anyError) {
      if (anyData && anyData.length > 0) {
        console.log('📊 Actual table columns:', Object.keys(anyData[0]))
      } else {
        console.log('📊 Table exists but is empty')
      }
    } else {
      console.log('❌ Could not get table structure:', anyError.message)
    }

    // Provide solution
    console.log('\n🔧 Solution:')
    
    if (!oldError) {
      console.log('💡 The table uses OLD column names. Update the code to use:')
      console.log('   - rejection_reason (not decline_reason)')
      console.log('   - rejected_by (not declined_by)')
      console.log('   - rejected_at (not declined_at)')
    } else if (!newError) {
      console.log('💡 The table uses NEW column names. Code should be correct.')
    } else {
      console.log('💡 Need to check table structure manually or create missing columns.')
    }

  } catch (error) {
    console.error('❌ Error checking table structure:', error.message)
  }
}

// Run the check
checkTableStructure()
