'use client'

import { useState } from 'react'

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

interface TicketDetailModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: Ticket | null
}

export default function TicketDetailModal({ isOpen, onClose, ticket }: TicketDetailModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !ticket) return null

  const copyTicketNumber = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticket_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy ticket number:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      declined: 'bg-red-100 text-red-800 border-red-300',
      not_functioning: 'bg-orange-100 text-orange-800 border-orange-300'
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status as keyof typeof statusStyles] || statusStyles.pending}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    )
  }

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'N/A'
    try {
      return new Date(isoString).toLocaleString()
    } catch {
      return 'N/A'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Ticket Details</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Ticket Number */}
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Ticket Number</p>
                <p className="text-2xl font-bold text-emerald-400 font-mono">{ticket.ticket_number}</p>
              </div>
              <button
                onClick={copyTicketNumber}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
                title={copied ? "Copied!" : "Copy ticket number"}
              >
                {copied ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white/70 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-2">Status</p>
            {getStatusBadge(ticket.status)}
          </div>

          {/* Device Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Device Type</p>
              <p className="text-white font-medium">{ticket.device_type}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Serial Number</p>
              <p className="text-white font-medium">
                {ticket.serial_number ? (
                  <span className="font-mono text-sm bg-gray-100/20 px-2 py-1 rounded">
                    {ticket.serial_number}
                  </span>
                ) : (
                  <span className="text-white/50 italic">N/A</span>
                )}
              </p>
            </div>
          </div>

          {/* Issue Description */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-2">Issue Description</p>
            <p className="text-white leading-relaxed">{ticket.repair_reason}</p>
          </div>

          {/* Owner and Facility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Owner's Name</p>
              <p className="text-white font-medium">{ticket.owner_name}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Facility</p>
              <p className="text-white font-medium">{ticket.facility}</p>
            </div>
          </div>

          {/* Assignment */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-1">Assigned To</p>
            <p className="text-white font-medium">
              {ticket.assigned_to || (
                <span className="text-white/50 italic">Unassigned</span>
              )}
            </p>
          </div>

          {/* Remarks */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/80 text-sm mb-2">Action Taken / Remarks</p>
            <p className="text-white leading-relaxed">
              {ticket.remarks && ticket.remarks.trim() !== '' ? ticket.remarks : (
                <span className="text-white/50 italic">No remarks added yet</span>
              )}
            </p>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Created At</p>
              <p className="text-white text-sm">{formatDateTime(ticket.created_at)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Last Updated</p>
              <p className="text-white text-sm">{formatDateTime(ticket.updated_at)}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-sm mb-1">Completed At</p>
              <p className="text-white text-sm">{formatDateTime(ticket.completed_at)}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl hover:from-purple-400 hover:to-indigo-400 hover:scale-105"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
