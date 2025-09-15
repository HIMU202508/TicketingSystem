import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Status = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'not_functioning' | 'declined'

type UpdateBody = Partial<{
  status: Status | null
  assigned_to: string | null
  repair_reason: string
  facility: string
  remarks: string | null
  declined_by?: string | null
}>

type DbTicketRow = {
  id: number
  ticket_number: string
  device_type: string
  owner_name: string
  facility: string
  status: Status
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

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const numericId = Number(id)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', numericId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, ticket: mapRowToTicket(data as DbTicketRow) }, { status: 200 })
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const numericId = Number(id)
    const supabase = await createClient()

    const { data: current, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', numericId)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const body = (await request.json()) as UpdateBody

    const allowedStatuses: Status[] = ['pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'declined']
    const cur = current as DbTicketRow
    const nextStatus = typeof body.status === 'string' && allowedStatuses.includes(body.status) ? body.status : cur.status
    const nextAssigned = Object.prototype.hasOwnProperty.call(body, 'assigned_to') ? (body.assigned_to ?? null) : cur.assigned_to
    const nextRepairReason = typeof body.repair_reason === 'string' ? body.repair_reason : cur.description
    const nextFacility = typeof body.facility === 'string' ? body.facility : cur.facility
    const nextRemarks = body.remarks !== undefined && body.remarks !== null ? body.remarks : cur.remarks

    if (nextStatus === 'completed' && (!nextAssigned || (typeof nextAssigned === 'string' && nextAssigned.trim() === ''))) {
      return NextResponse.json({ error: 'Assign a technician before marking the ticket as completed.' }, { status: 400 })
    }

    const isCompletingNow = cur.status !== 'completed' && nextStatus === 'completed'
    const isDecliningNow = (cur.status !== 'declined' && cur.status !== 'cancelled') && (nextStatus === 'declined' || nextStatus === 'cancelled')

    // If declining a ticket (either 'declined' or 'cancelled' status), log it to declined_tickets table
    if (isDecliningNow && nextRemarks) {
      const declinedTicketData = {
        ticket_id: numericId,
        ticket_number: cur.ticket_number,
        device_type: cur.device_type,
        owner_name: cur.owner_name,
        facility: cur.facility,
        original_description: cur.description,
        rejection_reason: nextRemarks, // Using old column name
        rejected_by: body.declined_by || 'System', // Using old column name
        rejected_at: new Date().toISOString() // Using old column name
      }

      const { error: declinedLogError } = await supabaseAdmin
        .from('declined_tickets')
        .insert(declinedTicketData)

      if (declinedLogError) {
        console.error('Failed to log declined ticket:', declinedLogError)
        // Continue with the update even if logging fails
      }
    }

    const updatePayload: Partial<DbTicketRow> = {
      status: nextStatus,
      assigned_to: nextAssigned,
      description: nextRepairReason ?? null,
      facility: nextFacility,
      remarks: nextRemarks,
      completed_at: isCompletingNow ? new Date().toISOString() : cur.completed_at,
    }

    // Use admin client to bypass RLS for trusted server-side update
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update(updatePayload)
      .eq('id', numericId)
      .select('*')
      .single()

    if (updateError || !updated) {
      return NextResponse.json({ error: updateError?.message || 'Update failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true, ticket: mapRowToTicket(updated as DbTicketRow) }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const numericId = Number(id)
  // Use admin client to bypass RLS for trusted server-side delete
  const { error } = await supabaseAdmin.from('tickets').delete().eq('id', numericId)
  if (error) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true }, { status: 200 })
} 