'use client'

import { useState } from 'react'
import Link from 'next/link'
import TicketModal from '@/components/TicketModal'

export default function DashboardQuickActions() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Ticket */}
        <button
          type="button"
          onClick={() => setIsTicketModalOpen(true)}
          className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer text-left shadow-lg hover:shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Create New Ticket</h3>
            <p className="text-gray-600 leading-relaxed">Submit a new IT support request for hardware or software issues.</p>
          </div>
        </button>

        {/* View All Tickets */}
        <Link href="/tickets" className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer block shadow-lg hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">View All Tickets</h3>
            <p className="text-gray-600 leading-relaxed">Browse and manage all your submitted support tickets.</p>
          </div>
        </Link>

        {/* Repair By (renamed from Equipment Status) */}
        <Link href="/repairs" className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer block shadow-lg hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Repair By</h3>
            <p className="text-gray-600 leading-relaxed">View tickets by assigned IT officer.</p>
          </div>
        </Link>
      </div>

      {/* Ticket Modal */}
      <TicketModal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} />
    </>
  )
} 