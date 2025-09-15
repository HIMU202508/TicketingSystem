'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'

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

type DeclinedTicketsStats = {
  totalDeclined: number
  declinedToday: number
  byFacility: Record<string, number>
  byDeclinedBy: Record<string, number>
}

interface DeclinedTicketsTableProps {
  className?: string
}

function DeclinedTicketsTable({ className = '' }: DeclinedTicketsTableProps) {
  const [declinedTickets, setDeclinedTickets] = useState<DeclinedTicket[]>([])
  const [stats, setStats] = useState<DeclinedTicketsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [declinedByFilter, setDeclinedByFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const limit = 20

  const fetchDeclinedTickets = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })

      if (searchQuery.trim()) params.append('search', searchQuery.trim())
      if (facilityFilter) params.append('facility', facilityFilter)
      if (declinedByFilter) params.append('declined_by', declinedByFilter)

      const response = await fetch(`/api/declined-tickets?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch declined tickets')
      }

      setDeclinedTickets(data.declinedTickets)
      setTotal(data.pagination.total)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, facilityFilter, declinedByFilter])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/declined-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stats' })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch stats')
      }

      setStats(data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  useEffect(() => {
    fetchDeclinedTickets()
  }, [page, searchQuery, facilityFilter, declinedByFilter])

  useEffect(() => {
    fetchStats()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleExportToExcel = useCallback(async () => {
    try {
      // Fetch all declined tickets for export (without pagination)
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.append('search', searchQuery.trim())
      if (facilityFilter) params.append('facility', facilityFilter)
      if (declinedByFilter) params.append('declined_by', declinedByFilter)
      params.append('export', 'true') // Flag to get all records

      const response = await fetch(`/api/declined-tickets?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch data for export')
      }

      // Create CSV content
      const headers = [
        'Ticket Number',
        'Device Type',
        'Owner Name',
        'Facility',
        'Original Description',
        'Decline Reason',
        'Declined By',
        'Declined At',
        'Created At'
      ]

      const csvContent = [
        headers.join(','),
        ...data.declinedTickets.map((ticket: DeclinedTicket) => [
          `"${ticket.ticketNumber}"`,
          `"${ticket.deviceType}"`,
          `"${ticket.ownerName}"`,
          `"${ticket.facility}"`,
          `"${ticket.originalDescription || ''}"`,
          `"${ticket.declineReason}"`,
          `"${ticket.declinedBy || 'Unknown'}"`,
          `"${formatDate(ticket.declinedAt)}"`,
          `"${formatDate(ticket.createdAt)}"`
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `declined-tickets-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    }
  }, [])

  const uniqueFacilities = useMemo(() => {
    const facilities = new Set(declinedTickets.map(t => t.facility))
    return Array.from(facilities).sort()
  }, [declinedTickets])

  const uniqueDeclinedBy = useMemo(() => {
    const declinedBy = new Set(declinedTickets.map(t => t.declinedBy).filter(Boolean))
    return Array.from(declinedBy).sort()
  }, [declinedTickets])

  if (error) {
    return (
      <div className={`bg-white rounded-3xl border border-gray-200 shadow-xl p-8 ${className}`}>
        <div className="text-center text-red-600">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Declined Tickets</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => { setError(null); fetchDeclinedTickets() }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden ${className}`}>
      {/* Enhanced Header with Export */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Declined Tickets</h2>
              <p className="text-gray-600 text-sm">Tickets that were declined with reasons</p>
            </div>
          </div>

          <button
            onClick={handleExportToExcel}
            disabled={loading || declinedTickets.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-400 hover:to-orange-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export to Excel
          </button>
        </div>

        {/* Enhanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              placeholder="Search tickets, devices, owners, or reasons..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(1) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <select
            value={facilityFilter}
            onChange={(e) => { setFacilityFilter(e.target.value); setPage(1) }}
            className="px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
          >
            <option value="">All Facilities</option>
            {uniqueFacilities.map(facility => (
              <option key={facility} value={facility}>
                {facility.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={declinedByFilter}
            onChange={(e) => { setDeclinedByFilter(e.target.value); setPage(1) }}
            className="px-4 py-3 rounded-xl bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent shadow-sm"
          >
            <option value="">All IT Officers</option>
            {uniqueDeclinedBy.map(declinedBy => (
              <option key={declinedBy} value={declinedBy}>
                {declinedBy}
              </option>
            ))}
          </select>
        </div>

        {/* Stats Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-gray-600 text-sm font-medium">
            <span className="text-red-600 font-bold">{total}</span> declined ticket{total !== 1 ? 's' : ''} found
            {(searchQuery || facilityFilter || declinedByFilter) && (
              <span className="ml-2 text-gray-500">
                (filtered results)
              </span>
            )}
          </div>

          {(searchQuery || facilityFilter || declinedByFilter) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFacilityFilter('')
                setDeclinedByFilter('')
                setPage(1)
              }}
              className="text-gray-500 hover:text-gray-700 text-sm underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
            </div>
            <p className="text-gray-600 font-medium">Loading declined tickets...</p>
          </div>
        ) : declinedTickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">No declined tickets found</h3>
            <p className="text-gray-500">
              {searchQuery || facilityFilter || declinedByFilter
                ? 'Try adjusting your search criteria or filters.'
                : 'No tickets have been declined yet.'
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 text-gray-700 font-semibold">Ticket #</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Device</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Owner</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Facility</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Decline Reason</th>
                <th className="text-left p-4 text-gray-700 font-semibold">IT Officer</th>
                <th className="text-left p-4 text-gray-700 font-semibold">Declined At</th>
              </tr>
            </thead>
            <tbody>
              {declinedTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                  <td className="p-4">
                    <span className="text-gray-800 font-mono text-sm bg-red-100 px-3 py-1 rounded-full group-hover:bg-red-200 transition-colors">
                      {ticket.ticketNumber}
                    </span>
                  </td>
                  <td className="p-4 text-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      {ticket.deviceType}
                    </div>
                  </td>
                  <td className="p-4 text-gray-800 font-medium">{ticket.ownerName}</td>
                  <td className="p-4">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-700">
                      {ticket.facility?.toUpperCase?.() || ticket.facility}
                    </span>
                  </td>
                  <td className="p-4 text-gray-800">
                    <div>
                      <span className="text-red-600 font-medium">{ticket.declineReason}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-800">
                    {ticket.declinedBy ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {ticket.declinedBy.charAt(0).toUpperCase()}
                        </div>
                        {ticket.declinedBy}
                      </div>
                    ) : (
                      <span className="text-gray-500 italic">Unknown</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-600 text-sm">
                    <div title={formatDate(ticket.declinedAt)}>
                      {formatTimeAgo(ticket.declinedAt)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-gray-600 text-sm">
            Page <span className="font-semibold text-gray-800">{page}</span> of <span className="font-semibold text-gray-800">{totalPages}</span>
            <span className="ml-2 text-gray-500">
              ({declinedTickets.length} of {total} tickets)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-sm"
            >
              First
            </button>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    page === pageNum
                      ? 'bg-red-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              )
            })}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors text-sm"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(DeclinedTicketsTable)
