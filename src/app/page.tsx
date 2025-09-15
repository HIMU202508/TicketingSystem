'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import TicketModal from '@/components/TicketModal'
import StatusCheckModal from '@/components/StatusCheckModal'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user as any)
        // If user is already logged in, redirect to dashboard
        if (user) {
          router.push('/dashboard')
        }
      } catch (err) {
        // Swallow network/auth refresh errors so the home page still loads
        console.warn('Supabase auth check failed:', err)
        try { await supabase.auth.signOut() } catch {}
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase.auth, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-300/8 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Login Icon */}
      <div className="absolute top-8 right-8 z-20 hidden">
        <Link
          href="/login"
          className="group relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-green-600/20 to-emerald-800/20 backdrop-blur-xl border border-green-400/30 hover:border-green-300/50 transition-all duration-500 hover:scale-110 hover:rotate-3"
          title="Sign In"
        >
          {/* Main icon container */}
          <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-700 group-hover:from-green-400 group-hover:to-emerald-600 transition-all duration-300 group-hover:scale-110">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H11V21H5V3H13V9H21ZM14 15.5L22.5 7L21 5.5L14 12.5L10.5 9L9 10.5L14 15.5Z"/>
            </svg>
          </div>

          {/* Animated border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/0 via-green-500/20 to-emerald-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Outer glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-700/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl scale-150"></div>

          {/* Subtle inner highlight */}
          <div className="absolute top-1 left-1 right-1 h-1/2 rounded-t-xl bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center items-center min-h-screen py-12">
          {/* Header */}
          <div className="text-center mb-16">
            {/* Logos Section - Centralized */}
            <div className="flex justify-center items-center gap-4 md:gap-6 mb-8 px-4 max-w-md mx-auto">
              {/* Parañaque Logo */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <img
                    src="/logos/parañaque.png"
                    alt="Parañaque City Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.log('Failed to load Parañaque logo');
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                    onLoad={() => console.log('Parañaque logo loaded successfully')}
                  />
                  <div className="hidden w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg items-center justify-center">
                    <span className="text-white text-xs font-bold">Parañaque</span>
                  </div>
                </div>
              </div>

              {/* HIMU Logo */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <img
                    src="/logos/himu-logo.png"
                    alt="HIMU Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.log('Failed to load HIMU logo');
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                    onLoad={() => console.log('HIMU logo loaded successfully')}
                  />
                  <div className="hidden w-full h-full bg-gradient-to-br from-green-500 to-green-700 rounded-lg items-center justify-center">
                    <span className="text-white text-xs font-bold">HIMU</span>
                  </div>
                </div>
              </div>

              {/* Alagang Parañaque Logo */}
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 bg-white/10 backdrop-blur-sm rounded-2xl p-2 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <img
                    src="/logos/alagang parañaque.png"
                    alt="Alagang Parañaque Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.log('Failed to load Alagang Parañaque logo');
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'flex';
                    }}
                    onLoad={() => console.log('Alagang Parañaque logo loaded successfully')}
                  />
                  <div className="hidden w-full h-full bg-gradient-to-br from-red-500 to-red-700 rounded-lg items-center justify-center">
                    <span className="text-white text-xs font-bold">Alagang</span>
                  </div>
                </div>
              </div>
            </div>

            {/* City Health Office & HIMU Title */}
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3 tracking-wide">
                City Health Office
              </h1>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 bg-clip-text text-transparent mb-2 tracking-wider">
                HIMU
              </h2>
              <p className="text-lg md:text-xl text-gray-600 font-medium">
                Health Information Management Unit
              </p>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 via-green-700 to-emerald-700 bg-clip-text text-transparent mb-8 leading-tight">
              <span className="block bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Ticketing System
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light mb-12">
              Professional IT support and equipment repair management. Submit tickets for hardware issues, software problems, and technical assistance with real-time tracking.
            </p>

            {/* CTA Buttons - Reduced Size */}
            <div className="flex flex-col justify-center items-center gap-3 mb-4 px-4">
              <button
                onClick={() => setIsTicketModalOpen(true)}
                className="group relative inline-flex items-center justify-center w-full max-w-xs py-3 text-base font-semibold text-white transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:from-green-400 hover:to-emerald-400 hover:scale-105 hover:shadow-xl hover:shadow-green-500/25"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Ticket
                </span>
                {/* Animated background */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400 to-emerald-400 blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>

              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="group relative inline-flex items-center justify-center w-full max-w-xs py-3 text-base font-semibold text-white transition-all duration-300 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-500 hover:to-teal-500 hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/25"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Check Status
                </span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </button>
              
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl">
            <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Hardware Repair</h3>
                <p className="text-gray-600 leading-relaxed">Submit tickets for computer repairs, printer issues, and equipment maintenance.</p>
              </div>
            </div>

            <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Software Support</h3>
                <p className="text-gray-600 leading-relaxed">Get help with software installations, updates, and troubleshooting issues.</p>
              </div>
            </div>

            <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 shadow-lg hover:shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">24/7 Tracking</h3>
                <p className="text-gray-600 leading-relaxed">Monitor your IT support requests with real-time status updates and notifications.</p>
              </div>
            </div>
          </div>





        </div>
      </div>

      {/* Ticket Modal */}
      <TicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
      />

      {/* Status Check Modal */}
      <StatusCheckModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />
    </div>
  )
}
