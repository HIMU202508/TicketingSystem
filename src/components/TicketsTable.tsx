'use client'

import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react'
import { supabase } from '@/lib/supabase'
import TicketDetailModal from '@/components/TicketDetailModal'

interface Ticket {
  id: number
  ticket_number: string
  device_type: string
  repair_reason: string
  owner_name: string
  facility: string
  status: string
  serial_number?: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  completed_at?: string | null
  remarks?: string | null
}

interface TicketsTableProps {
  user: unknown
}

function TicketsTable({ user }: TicketsTableProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [draftStatus, setDraftStatus] = useState<string>('')
  const [draftAssignedTo, setDraftAssignedTo] = useState<string>('')
  const [draftRemarks, setDraftRemarks] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [draftAssistant, setDraftAssistant] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [limit] = useState<number>(10)
  const [total, setTotal] = useState<number>(0)
  const [viewingTicket, setViewingTicket] = useState<Ticket | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<number | null>(null)

  const fetchTickets = useCallback(async (pageParam = 1, limitParam = 10) => {
    try {
      if (abortRef.current) {
        abortRef.current.abort()
      }
      const controller = new AbortController()
      abortRef.current = controller

      const hasFilters = Boolean(statusFilter) || Boolean(searchQuery.trim())
      // Only show loading for initial load or pagination, not for search/filter
      if (!hasFilters) {
        setLoading(true)
      }

      const params = new URLSearchParams()
      if (hasFilters) {
        params.set('all', 'true')
        if (statusFilter) params.set('status', statusFilter)
      } else {
        params.set('page', String(pageParam))
        params.set('limit', String(limitParam))
      }
      const url = `/api/tickets${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'default',
        headers: {
          'Cache-Control': 'max-age=30'
        }
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tickets')
      }

      setTickets(data.tickets)
      setTotal(data.total ?? data.tickets?.length ?? 0)
    } catch (error) {
      if ((error as any)?.name === 'AbortError') return
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error fetching tickets:', message)
      setError(message)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [statusFilter, searchQuery])

  // Main useEffect for fetching tickets with debouncing
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = window.setTimeout(() => {
      fetchTickets(page, limit)
    }, 100)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [page, limit, statusFilter, searchQuery, fetchTickets])

  // If assigned is cleared, also clear assistant
  useEffect(() => {
    if (!draftAssignedTo.trim() && draftAssistant) {
      setDraftAssistant('')
    }
  }, [draftAssignedTo])

  // Real-time subscription for ticket updates
  useEffect(() => {
    const channel = supabase
      .channel('tickets-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        console.log('Ticket updated:', payload)
        // Refresh the tickets list when any ticket is updated
        fetchTickets(page, limit)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        console.log('New ticket created:', payload)
        // Refresh the tickets list when a new ticket is created
        fetchTickets(page, limit)
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        console.log('Ticket deleted:', payload)
        // Refresh the tickets list when a ticket is deleted
        fetchTickets(page, limit)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [page, limit, fetchTickets])

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300', // Show cancelled as declined
      declined: 'bg-red-100 text-red-800 border-red-300',
      not_functioning: 'bg-orange-100 text-orange-800 border-orange-300'
    }

    const statusLabels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Declined', // Show cancelled as "Declined" to users
      declined: 'Declined',
      not_functioning: 'Not functioning'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status as keyof typeof statusStyles] || statusStyles.pending}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const getTimeAgoHours = (isoString: string) => {
    const createdMs = new Date(isoString).getTime()
    const diffMs = Date.now() - createdMs
    const minutes = Math.floor(diffMs / (1000 * 60))
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    return remHours === 0 ? `${days}d ago` : `${days}d ${remHours}h ago`
  }

  const handleEdit = (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId) || null
    setEditingTicket(ticket)
    if (ticket) {
      setDraftStatus(ticket.status)
      setDraftAssignedTo(ticket.assigned_to || '')
      setDraftRemarks(ticket.remarks || '')
      // Prefill assistant from remarks if formatted as "Assistant: NAME"
      const match = (ticket.remarks || '').match(/Assistant:\s*(.+)/i)
      setDraftAssistant(match?.[1]?.trim() || '')
    }
  }

  const submitEdit = async () => {
    if (!editingTicket) return
    if (draftStatus === 'completed' && !draftAssignedTo.trim()) {
      alert('Assign a technician before marking the ticket as completed.')
      return
    }
    if (draftAssistant && !draftAssignedTo.trim()) {
      alert('Assign an IT OFFICER before selecting an assistant.')
      return
    }
    if (draftAssistant && draftAssistant === draftAssignedTo) {
      alert('Assistant cannot be the same as the assigned IT OFFICER.')
      return
    }
    try {
      setActionLoading(true)
      let newRemarks = (draftRemarks ?? '').trim()
      if (draftAssistant && !newRemarks.includes(`Assistant: ${draftAssistant}`)) {
        newRemarks = newRemarks
          ? `${newRemarks}\nAssistant: ${draftAssistant}`
          : `Assistant: ${draftAssistant}`
      }
      const response = await fetch(`/api/tickets/${editingTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: draftStatus, assigned_to: draftAssignedTo || null, remarks: newRemarks || null })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update ticket')
      setEditingTicket(null)
      await fetchTickets(page, limit)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update ticket'
      alert(message)
    } finally {
      setActionLoading(false)
    }
  }



  const markCompleted = async (ticketId: number) => {
    try {
      setActionLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to mark as completed')
      await fetchTickets(page, limit)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark as completed'
      alert(message)
    } finally {
      setActionLoading(false)
    }
  }

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchesSearch = q
        ? [
            String(ticket.id),
            ticket.ticket_number,
            ticket.device_type,
            ticket.repair_reason,
            ticket.owner_name,
            ticket.serial_number || '',
            ticket.facility,
            ticket.status,
            ticket.assigned_to || '',
            ticket.remarks || ''
          ].some((f) => f.toLowerCase().includes(q))
        : true

      // Handle status filtering - treat both 'cancelled' and 'declined' as 'declined'
      let matchesStatus = true
      if (statusFilter) {
        if (statusFilter === 'declined') {
          matchesStatus = ticket.status === 'declined' || ticket.status === 'cancelled'
        } else {
          matchesStatus = ticket.status === statusFilter
        }
      }

      return matchesSearch && matchesStatus
    })
  }, [tickets, searchQuery, statusFilter])

  // Skeleton loading component
  const SkeletonRow = () => (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 11 }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="animate-pulse bg-gray-200 h-4 rounded"></div>
        </td>
      ))}
    </tr>
  )

  if (initialLoading) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-green-200/50 shadow-xl overflow-hidden">
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">All Tickets</h2>
            <div className="flex items-center gap-4">
              <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-8 w-40 rounded"></div>
              <div className="animate-pulse bg-gray-200 h-8 w-72 rounded"></div>
            </div>
          </div>
        </div>

        {/* Skeleton Table */}
        <div className="bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 text-gray-700 font-semibold">Ticket #</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Device</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Issue</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Owner&apos;s Name</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Serial Number</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Facility</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Status</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Repair By</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Action taken</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Created</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-green-200/50 shadow-xl p-8">
        <div className="text-center text-red-600">
          <p>Error loading tickets: {error}</p>
          <button
            onClick={() => fetchTickets(page, limit)}
            className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-green-200/50 shadow-xl overflow-hidden">
      {/* Table Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">All Tickets</h2>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-gray-600">
              {searchQuery || statusFilter
                ? `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? 's' : ''} found`
                : `${total} ticket${total !== 1 ? 's' : ''} total`}
            </div>
            <div className="relative w-40">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
                className="w-full px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="not_functioning">Not functioning</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div className="relative w-56 md:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                placeholder="Search tickets..."
                className="w-full pl-10 pr-9 py-2 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setPage(1) }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left p-4 text-gray-700 font-semibold">Ticket #</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Device</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Issue</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Owner&apos;s Name</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Serial Number</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Facility</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Status</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Repair By</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Action taken</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Created</th>
              <th className="text-left p-4 text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <span className="text-gray-800 font-mono text-sm bg-green-100 px-2 py-1 rounded">
                    {ticket.ticket_number}
                  </span>
                </td>
                <td className="p-4 text-gray-800">{ticket.device_type}</td>
                <td className="p-4 text-gray-800 max-w-xs">
                  <div className="truncate" title={ticket.repair_reason}>
                    {ticket.repair_reason}
                  </div>
                </td>
                <td className="p-4 text-gray-800">{ticket.owner_name}</td>
                <td className="p-4 text-gray-800">
                  {ticket.serial_number ? (
                    <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                      {ticket.serial_number}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic">N/A</span>
                  )}
                </td>
                <td className="p-4 text-gray-800">{ticket.facility?.toUpperCase?.() || ticket.facility}</td>
                <td className="p-4">{getStatusBadge(ticket.status)}</td>
                <td className="p-4 text-gray-800">
                  {ticket.assigned_to || (
                    <span className="text-gray-500 italic">Unassigned</span>
                  )}
                </td>
                <td className="p-4 text-gray-700 max-w-xs">
                  <div className="truncate" title={ticket.remarks || ''}>
                    {ticket.remarks && ticket.remarks.trim() !== '' ? ticket.remarks : (
                      <span className="text-gray-500 italic">None</span>
                    )}
                  </div>
                </td>
                <td
                  className="p-4 text-gray-700"
                  title={ticket.status === 'completed' ? '' : (ticket.completed_at ? `Completed at: ${new Date(ticket.completed_at).toLocaleString()}` : '')}
                >
                  {ticket.status === 'completed' ? '' : getTimeAgoHours(ticket.created_at)}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingTicket(ticket)}
                      className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
                      title="View ticket details"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(ticket.id)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                      title="Edit ticket"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => markCompleted(ticket.id)}
                      disabled={ticket.status === 'completed' || !ticket.assigned_to || actionLoading}
                      className={`p-2 rounded-lg transition-colors ${ticket.status === 'completed' || !ticket.assigned_to ? 'bg-green-500/10 text-green-400 opacity-60 cursor-not-allowed' : 'bg-green-500/20 hover:bg-green-500/30 text-green-300'}`}
                      title={ticket.assigned_to ? 'Mark as Completed' : 'Assign a technician first'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (hidden when filtering/searching) */}
      {!(statusFilter || searchQuery.trim()) && (
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-gray-600 text-sm">
            Page {page} of {Math.max(1, Math.ceil(total / limit))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className={`px-3 py-2 rounded-lg ${page <= 1 || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => (p < Math.ceil(total / limit) ? p + 1 : p))}
              disabled={page >= Math.ceil(total / limit) || loading}
              className={`px-3 py-2 rounded-lg ${page >= Math.ceil(total / limit) || loading ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filteredTickets.length === 0 && (
        <div className="p-12 text-center bg-white">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-800 mb-2">No tickets {searchQuery ? 'match your search' : 'found'}</h3>
          {!searchQuery && <p className="text-gray-600">Create your first IT support ticket to get started.</p>}
        </div>
      )}
     </div>

     {/* Modals rendered outside to avoid clipping */}
     {editingTicket && (
       <div className="fixed inset-0 z-[100] flex items-center justify-center">
         <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingTicket(null)}></div>
         <div className="relative w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
           <h3 className="text-xl font-semibold text-white mb-4">Edit Ticket</h3>
           <div className="space-y-4">
             <div>
               <label className="block text-sm text-white/80 mb-1">Status</label>
               <select
                 value={draftStatus}
                 onChange={(e) => setDraftStatus(e.target.value)}
                 className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
               >
                 <option value="pending" className="bg-gray-800 text-white">Pending</option>
                 <option value="in_progress" className="bg-gray-800 text-white">In Progress</option>
                 <option value="not_functioning" className="bg-gray-800 text-white">Not functioning</option>
                 <option value="completed" className="bg-gray-800 text-white">Completed</option>
                 <option value="declined" className="bg-gray-800 text-white">Declined</option>
               </select>
             </div>
             <div>
               <label className="block text-sm text-white/80 mb-1">Assigned To</label>
               <select
                 value={draftAssignedTo}
                 onChange={(e) => {
                   const value = e.target.value
                   setDraftAssignedTo(value)
                   if (value.trim() && draftStatus !== 'completed') {
                     setDraftStatus('in_progress')
                   }
                 }}
                 className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
               >
                 <option value="" className="bg-gray-800 text-white">Select IT OFFICER...</option>
                 <option value="DANTE S. GUTIERREZ JR." className="bg-gray-800 text-white">DANTE S. GUTIERREZ JR.</option>
                 <option value="JAY T. CONCON" className="bg-gray-800 text-white">JAY T. CONCON</option>
                 <option value="ISAIAH JOHN B. SAN PEDRO" className="bg-gray-800 text-white">ISAIAH JOHN B. SAN PEDRO</option>
                 <option value="MICHELLE ANN M. CRUTO" className="bg-gray-800 text-white">MICHELLE ANN M. CRUTO</option>
                 <option value="GEORGE D. CALANGIAN" className="bg-gray-800 text-white">GEORGE D. CALANGIAN</option>
                 <option value="JUSTIN RY C. PUNLA" className="bg-gray-800 text-white">JUSTIN RY C. PUNLA</option>
                 <option value="KEN-NIÑO LLAGUNO" className="bg-gray-800 text-white">KEN-NIÑO LLAGUNO</option>
               </select>
               {draftStatus === 'completed' && !draftAssignedTo.trim() && (
                 <p className="text-xs text-red-300 mt-2">Assign a technician before completing the ticket.</p>
               )}
             </div>
             <div>
               <label className="block text-sm text-white/80 mb-1">Assistant</label>
               <select
                 value={draftAssistant}
                 onChange={(e) => {
                   const value = e.target.value
                   if (value && value === draftAssignedTo) {
                     alert('Assistant cannot be the same as the assigned IT OFFICER.')
                     return
                   }
                   setDraftAssistant(value)
                 }}
                 className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
                 disabled={!draftAssignedTo.trim()}
               >
                 <option value="" className="bg-gray-800 text-white">Select Assistant...</option>
                 <option value="DANTE S. GUTIERREZ JR." className="bg-gray-800 text-white">DANTE S. GUTIERREZ JR.</option>
                 <option value="JAY T. CONCON" className="bg-gray-800 text-white">JAY T. CONCON</option>
                 <option value="ISAIAH JOHN B. SAN PEDRO" className="bg-gray-800 text-white">ISAIAH JOHN B. SAN PEDRO</option>
                 <option value="MICHELLE ANN M. CRUTO" className="bg-gray-800 text-white">MICHELLE ANN M. CRUTO</option>
                 <option value="GEORGE D. CALANGIAN" className="bg-gray-800 text-white">GEORGE D. CALANGIAN</option>
                 <option value="JUSTIN RY C. PUNLA" className="bg-gray-800 text-white">JUSTIN RY C. PUNLA</option>
                 <option value="KEN-NIÑO LLAGUNO" className="bg-gray-800 text-white">KEN-NIÑO LLAGUNO</option>
               </select>
               {!draftAssignedTo.trim() && (
                 <p className="text-xs text-white/50 mt-2">Assign an IT OFFICER first to select an assistant.</p>
               )}
             </div>
             <div>
               <label className="block text-sm text-white/80 mb-1">Remarks</label>
               <textarea
                 value={draftRemarks}
                 onChange={(e) => setDraftRemarks(e.target.value)}
                 rows={3}
                 placeholder="Add any additional notes or remarks..."
                 className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
               />
             </div>
             <div className="flex gap-2 justify-end">
               <button
                 onClick={() => setEditingTicket(null)}
                 className="px-4 py-2 rounded-xl bg-white/10 text-white"
                 disabled={actionLoading}
               >
                 Cancel
               </button>
               <button
                 onClick={submitEdit}
                 className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50"
                 disabled={actionLoading || (draftStatus === 'completed' && !draftAssignedTo.trim())}
               >
                 {actionLoading ? 'Saving...' : 'Save'}
               </button>
             </div>
           </div>
         </div>
       </div>
     )}

     {/* Ticket Detail Modal */}
     <TicketDetailModal
       isOpen={!!viewingTicket}
       onClose={() => setViewingTicket(null)}
       ticket={viewingTicket}
     />

    </>
  )
}

export default memo(TicketsTable)
