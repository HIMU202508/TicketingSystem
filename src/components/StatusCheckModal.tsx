'use client'

import { useState } from 'react'

interface StatusCheckModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StatusCheckModal({ isOpen, onClose }: StatusCheckModalProps) {
  const [ticketNumber, setTicketNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ status: string; assigned_to: string | null; remarks: string | null } | null>(null)

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      in_progress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      completed: 'bg-green-500/20 text-green-300 border-green-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30',
      declined: 'bg-red-500/20 text-red-300 border-red-500/30',
      not_functioning: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    }

    const statusLabels = {
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Declined',
      declined: 'Declined',
      not_functioning: 'Not functioning'
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${statusStyles[status as keyof typeof statusStyles] || statusStyles.pending}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!ticketNumber.trim()) return
    try {
      setLoading(true)
      const res = await fetch(`/api/tickets?ticket_number=${encodeURIComponent(ticketNumber.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ticket not found')
      const t = data.ticket
      setResult({ status: t.status, assigned_to: t.assigned_to ?? null, remarks: t.remarks ?? null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const close = () => {
    setTicketNumber('')
    setError(null)
    setResult(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close}></div>
      <div className="relative w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Check Ticket Status</h2>
            <button onClick={close} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSearch} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Enter Ticket Number</label>
            <input
              type="text"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="e.g. LA20250812XXX"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 text-sm">{error}</div>
          )}
          {result && (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-4">
              <div className="text-center">
                <div className="text-white/70">Ticket Status</div>
                <div className="mt-1">{getStatusBadge(result.status)}</div>
              </div>
              <div className="text-center">
                <div className="text-white/70">
                  {(result.status === 'declined' || result.status === 'cancelled') ? 'Reason' : 'Assigned IT OFFICER'}
                </div>
                <div className="text-white font-semibold">
                  {(result.status === 'declined' || result.status === 'cancelled')
                    ? (result.remarks || 'No reason provided')
                    : (result.assigned_to || 'Unassigned')
                  }
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">Close</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white disabled:opacity-50 transition-colors">
              {loading ? 'Checking...' : 'Check Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 