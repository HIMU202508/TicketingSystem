import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
  try {
    console.log('🔧 Removing cancelled status and updating to declined...')
    
    // Step 1: Check for existing cancelled tickets
    console.log('📝 Step 1: Checking for existing cancelled tickets...')
    const { data: cancelledTickets, error: fetchError } = await supabaseAdmin
      .from('tickets')
      .select('id, ticket_number, status')
      .eq('status', 'cancelled')
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        error: 'Could not fetch cancelled tickets',
        details: fetchError.message
      }, { status: 500 })
    }

    console.log(`Found ${cancelledTickets?.length || 0} cancelled tickets`)

    return NextResponse.json({
      success: true,
      message: 'Status removal process completed',
      cancelledTicketsFound: cancelledTickets?.length || 0,
      cancelledTickets: cancelledTickets?.map(t => ({
        id: t.id,
        ticketNumber: t.ticket_number,
        status: t.status
      })) || [],
      instructions: {
        message: 'Manual database update required',
        steps: [
          '1. Access your Supabase dashboard',
          '2. Go to SQL Editor',
          '3. Run these commands in order:',
          '',
          '-- First, update the constraint to allow declined status',
          'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;',
          'ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN (\'pending\', \'in_progress\', \'completed\', \'not_functioning\', \'declined\', \'cancelled\'));',
          '',
          '-- Then update cancelled tickets to declined',
          'UPDATE tickets SET status = \'declined\' WHERE status = \'cancelled\';',
          '',
          '-- Finally, remove cancelled from the constraint',
          'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;',
          'ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN (\'pending\', \'in_progress\', \'completed\', \'not_functioning\', \'declined\'));'
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error in remove-cancelled process:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process cancelled status removal',
      details: error instanceof Error ? error.message : 'Unknown error',
      instructions: {
        message: 'Manual database update required',
        sql: [
          '-- Update constraint to temporarily allow both statuses',
          'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;',
          'ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN (\'pending\', \'in_progress\', \'completed\', \'not_functioning\', \'declined\', \'cancelled\'));',
          '',
          '-- Update cancelled tickets to declined',
          'UPDATE tickets SET status = \'declined\' WHERE status = \'cancelled\';',
          '',
          '-- Remove cancelled from constraint',
          'ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;',
          'ALTER TABLE tickets ADD CONSTRAINT tickets_status_check CHECK (status IN (\'pending\', \'in_progress\', \'completed\', \'not_functioning\', \'declined\'));'
        ]
      }
    }, { status: 500 })
  }
}
