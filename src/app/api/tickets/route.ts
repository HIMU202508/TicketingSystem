import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type CreateTicketBody = {
  device: string
  repairReason: string
  ownerName: string
  facility: string
  ticketNumber: string
  serialNumber?: string
}

type DbTicketRow = {
  id: number
  ticket_number: string
  device_type: string
  owner_name: string
  facility: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'not_functioning' | 'declined'
  description: string | null
  serial_number: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  remarks: string | null
}

function mapRowToTicket(row: DbTicketRow) {
  return {
    id: row.id,
    ticket_number: row.ticket_number,
    device_type: row.device_type,
    repair_reason: row.description ?? '',
    owner_name: row.owner_name,
    facility: row.facility,
    status: row.status,
    serial_number: row.serial_number ?? null,
    assigned_to: row.assigned_to ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at,
    remarks: row.remarks,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateTicketBody

    const { device, repairReason, ownerName, facility, ticketNumber, serialNumber } = body

    if (!device || !repairReason || !ownerName || !facility || !ticketNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    // Use admin client to bypass RLS for trusted server-side insert
    const { data, error } = await supabaseAdmin
      .from('tickets')
      .insert({
        ticket_number: ticketNumber,
        device_type: device,
        description: repairReason,
        owner_name: ownerName,
        facility,
        serial_number: serialNumber || null,
        status: 'pending',
        assigned_to: null,
      })
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        ticket: mapRowToTicket(data as DbTicketRow),
        message: 'Ticket created successfully'
      },
      { status: 201 }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('API error:', message)
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const ticketNumber = searchParams.get('ticket_number')

    if (ticketNumber) {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('ticket_number', ticketNumber)
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      }

      return NextResponse.json({ success: true, ticket: mapRowToTicket(data as DbTicketRow) }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }

    const statusParam = searchParams.get('status')
    const isExport = searchParams.get('export') === 'true'

    const pageParam = Number(searchParams.get('page') || '1')
    const rawLimitParam = Number(searchParams.get('limit') || '10')
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1
    const limit = Number.isFinite(rawLimitParam) && rawLimitParam > 0 ? Math.min(rawLimitParam, 200) : 10
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Optimize query by using estimated count for better performance (except for exports)
    let query = supabase
      .from('tickets')
      .select('id, ticket_number, device_type, owner_name, facility, status, description, assigned_to, created_at, updated_at, completed_at, remarks', { count: isExport ? 'exact' : 'estimated' })

    if (statusParam) {
      query = query.eq('status', statusParam)
    }

    query = query.order('created_at', { ascending: false })

    // Apply pagination (skip for export)
    let data, error, count
    if (isExport) {
      const result = await query
      data = result.data
      error = result.error
      count = result.data?.length || 0
    } else {
      const result = await query.range(from, to)
      data = result.data
      error = result.error
      count = result.count
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const tickets = ((data ?? []) as DbTicketRow[]).map(mapRowToTicket)

    const headers: Record<string, string> = { 'Cache-Control': 'no-store' }
    // Allow a tiny bit of caching for completed lists when paginated
    if (statusParam === 'completed') {
      headers['Cache-Control'] = 'public, max-age=5, s-maxage=15, stale-while-revalidate=30'
    }

    return NextResponse.json(
      {
        success: true,
        tickets,
        total: count ?? 0,
        page,
        limit,
        status: statusParam ?? null,
        all: false,
      },
      { status: 200, headers }
    )

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('API error:', message)
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}
