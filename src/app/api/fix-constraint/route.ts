import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    console.log('🔧 Attempting to fix tickets status constraint...')
    
    // Try to execute the SQL commands to fix the constraint
    const sqlCommands = [
      'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;',
      `ALTER TABLE tickets ADD CONSTRAINT tickets_status_check 
       CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'declined'));`
    ]

    for (const sql of sqlCommands) {
      console.log(`Executing: ${sql}`)
      
      // Try using different RPC function names that might be available
      const rpcMethods = ['sql', 'exec_sql', 'execute_sql']
      let success = false
      
      for (const method of rpcMethods) {
        try {
          const { error } = await supabaseAdmin.rpc(method, { 
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
        console.log(`⚠️ Could not execute: ${sql}`)
      }
    }

    // Test if the constraint is now working by trying to update a ticket
    console.log('🧪 Testing constraint...')
    
    const { data: testTickets, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('id, status')
      .limit(1)
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch test tickets',
        details: fetchError.message
      }, { status: 500 })
    }

    if (testTickets && testTickets.length > 0) {
      const testTicket = testTickets[0]
      const originalStatus = testTicket.status
      
      // Try to update to declined status
      const { error: updateError } = await supabaseAdmin
        .from('tickets')
        .update({ status: 'declined' })
        .eq('id', testTicket.id)
      
      if (updateError) {
        return NextResponse.json({
          success: false,
          error: 'Constraint still blocking declined status',
          details: updateError.message,
          solution: {
            message: 'Manual database update required',
            sql: [
              'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;',
              'ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN (\'pending\', \'in_progress\', \'completed\', \'cancelled\', \'not_functioning\', \'declined\'));'
            ]
          }
        }, { status: 500 })
      }
      
      // Revert the test ticket back
      await supabaseAdmin
        .from('tickets')
        .update({ status: originalStatus })
        .eq('id', testTicket.id)
      
      return NextResponse.json({
        success: true,
        message: 'Constraint updated successfully! "declined" status is now allowed.',
        testResult: `Successfully tested with ticket ID ${testTicket.id}`
      })
    }

    return NextResponse.json({
      success: false,
      error: 'No tickets available for testing'
    }, { status: 500 })

  } catch (error) {
    console.error('❌ Error fixing constraint:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fix constraint',
      details: error instanceof Error ? error.message : 'Unknown error',
      solution: {
        message: 'Manual database update required',
        instructions: [
          '1. Access your Supabase dashboard',
          '2. Go to SQL Editor',
          '3. Run these commands:',
          'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;',
          'ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN (\'pending\', \'in_progress\', \'completed\', \'cancelled\', \'not_functioning\', \'declined\'));'
        ]
      }
    }, { status: 500 })
  }
}
