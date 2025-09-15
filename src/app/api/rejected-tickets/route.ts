import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type DeclinedTicketRow = {
  id: number
  ticket_id: number
  ticket_number: string
  device_type: string
  owner_name: string
  facility: string
  original_description: string | null
  decline_reason: string
  declined_by: string | null
  declined_at: string
  created_at: string
}

type DeclinedTicket = {
  id: number
  ticketId: number
  ticketNumber: string
  deviceType: string
  ownerName: string
  facility: string
  originalDescription: string | null
  declineReason: string
  declinedBy: string | null
  declinedAt: string
  createdAt: string
}

function mapRowToDeclinedTicket(row: DeclinedTicketRow): DeclinedTicket {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    ticketNumber: row.ticket_number,
    deviceType: row.device_type,
    ownerName: row.owner_name,
    facility: row.facility,
    originalDescription: row.original_description,
    declineReason: row.decline_reason,
    declinedBy: row.declined_by,
    declinedAt: row.declined_at,
    createdAt: row.created_at
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = searchParams.get('search')?.trim() || ''
    const facility = searchParams.get('facility')?.trim() || ''
    const rejectedBy = searchParams.get('rejected_by')?.trim() || ''
    const isExport = searchParams.get('export') === 'true'

    // Optimize query by selecting only needed columns and using estimated count for better performance
    let query = supabaseAdmin
      .from('declined_tickets')
      .select('id, ticket_id, ticket_number, device_type, owner_name, facility, original_description, decline_reason, declined_by, declined_at, created_at', { count: isExport ? 'exact' : 'estimated' })
      .order('declined_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`ticket_number.ilike.%${search}%,device_type.ilike.%${search}%,owner_name.ilike.%${search}%,decline_reason.ilike.%${search}%`)
    }

    if (facility) {
      query = query.eq('facility', facility)
    }

    if (rejectedBy) {
      query = query.eq('declined_by', rejectedBy)
    }

    // Apply pagination (skip for export)
    if (!isExport) {
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const declinedTickets = (data as DeclinedTicketRow[]).map(mapRowToDeclinedTicket)

    const headers: Record<string, string> = {}

    // Add caching headers for better performance
    if (!isExport && !search && !facility && !rejectedBy) {
      headers['Cache-Control'] = 'public, max-age=30, s-maxage=60, stale-while-revalidate=120'
    } else {
      headers['Cache-Control'] = 'public, max-age=10, s-maxage=20, stale-while-revalidate=60'
    }

    return NextResponse.json({
      declinedTickets,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}

// Export statistics endpoint
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'stats') {
      // Get decline statistics
      const { data: totalCount } = await supabaseAdmin
        .from('declined_tickets')
        .select('id', { count: 'exact', head: true })

      const { data: todayCount } = await supabaseAdmin
        .from('declined_tickets')
        .select('id', { count: 'exact', head: true })
        .gte('declined_at', new Date().toISOString().split('T')[0])

      const { data: facilityStats } = await supabaseAdmin
        .from('declined_tickets')
        .select('facility')
        .then(({ data }) => {
          const stats: Record<string, number> = {}
          data?.forEach(item => {
            stats[item.facility] = (stats[item.facility] || 0) + 1
          })
          return { data: stats }
        })

      const { data: declinedByStats } = await supabaseAdmin
        .from('declined_tickets')
        .select('declined_by')
        .then(({ data }) => {
          const stats: Record<string, number> = {}
          data?.forEach(item => {
            const declinedBy = item.declined_by || 'Unknown'
            stats[declinedBy] = (stats[declinedBy] || 0) + 1
          })
          return { data: stats }
        })

      return NextResponse.json({
        totalDeclined: totalCount?.count || 0,
        declinedToday: todayCount?.count || 0,
        byFacility: facilityStats?.data || {},
        byDeclinedBy: declinedByStats?.data || {}
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}
