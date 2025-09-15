import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    // Test if the declined_tickets table exists and is accessible
    const { data, error } = await supabaseAdmin
      .from('declined_tickets')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        suggestion: 'The table migration may not be complete. Try refreshing the Supabase schema cache.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'declined_tickets table is accessible',
      recordCount: data?.length || 0
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check database connection and table existence'
    }, { status: 500 })
  }
}
