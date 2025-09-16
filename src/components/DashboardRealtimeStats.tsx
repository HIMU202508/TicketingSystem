'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function DashboardRealtimeStats() {
  const [pending, setPending] = useState(0)
  const [inProgress, setInProgress] = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const [declinedTotal, setDeclinedTotal] = useState(0)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const previousValues = useRef({ pending: 0, inProgress: 0, completedToday: 0, declinedTotal: 0, total: 0 })
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playDashboardUpdateSound = (type: 'increase' | 'decrease') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      if (type === 'increase') {
        // Subtle ascending tone for increases
        osc.type = 'sine'
        osc.frequency.setValueAtTime(400, now)
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.1)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.02, now + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
      } else {
        // Subtle descending tone for decreases
        osc.type = 'sine'
        osc.frequency.setValueAtTime(500, now)
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.1)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(0.015, now + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
        osc.start(now)
        osc.stop(now + 0.15)
      }

      osc.connect(gain)
      gain.connect(ctx.destination)
    } catch {}
  }

  const refreshCounts = async () => {
    try {
      setIsLoading(true)
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const endOfToday = new Date()
      endOfToday.setHours(23, 59, 59, 999)

      const [totalRes, pendingRes, inProgressRes, completedTodayRes, declinedTotalRes] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .gte('completed_at', startOfToday.toISOString())
          .lte('completed_at', endOfToday.toISOString()),
        supabase.from('declined_tickets').select('*', { count: 'exact', head: true }),
      ])

      const newValues = {
        total: totalRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        inProgress: inProgressRes.count ?? 0,
        completedToday: completedTodayRes.count ?? 0,
        declinedTotal: declinedTotalRes.count ?? 0
      }

      // Play sounds for changes (only after initial load)
      if (!isLoading) {
        const prev = previousValues.current

        // Play sound for new tickets (pending increase)
        if (newValues.pending > prev.pending) {
          playDashboardUpdateSound('increase')
        }

        // Play sound for completed tickets (completedToday increase)
        if (newValues.completedToday > prev.completedToday) {
          playDashboardUpdateSound('increase')
        }

        // Play sound for declined tickets (declinedTotal increase)
        if (newValues.declinedTotal > prev.declinedTotal) {
          playDashboardUpdateSound('decrease')
        }
      }

      // Update previous values for next comparison
      previousValues.current = newValues

      setTotal(newValues.total)
      setPending(newValues.pending)
      setInProgress(newValues.inProgress)
      setCompletedToday(newValues.completedToday)
      setDeclinedTotal(newValues.declinedTotal)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing dashboard counts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshCounts()

    // Create real-time subscription for tickets table
    const ticketsChannel = supabase
      .channel('dashboard-tickets-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        console.log('New ticket created:', payload)
        refreshCounts()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        console.log('Ticket updated:', payload)
        refreshCounts()
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'tickets'
      }, (payload) => {
        console.log('Ticket deleted:', payload)
        refreshCounts()
      })
      .subscribe()

    // Create real-time subscription for declined_tickets table
    const declinedChannel = supabase
      .channel('dashboard-declined-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'declined_tickets'
      }, (payload) => {
        console.log('Ticket declined:', payload)
        refreshCounts()
      })
      .subscribe()

    // Periodic refresh as fallback (every 60 seconds for better performance)
    const intervalId = setInterval(() => {
      refreshCounts()
    }, 60000)

    return () => {
      supabase.removeChannel(ticketsChannel)
      supabase.removeChannel(declinedChannel)
      clearInterval(intervalId)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Real-time Status Indicator with Black Text */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
          <span className="text-sm font-bold text-black">
            {isLoading ? 'Updating...' : 'Live Data'}
          </span>
          {lastUpdated && (
            <span className="text-xs font-medium text-black">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12 min-h-[180px]">
      {/* Pending Repairs */}
      <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 h-full shadow-lg hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className={`text-2xl font-bold text-gray-800 transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>{pending}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending Repairs</h3>
            <p className="text-gray-600 text-sm">Equipment awaiting repair</p>
          </div>
        </div>
      </div>

      {/* In Progress */}
      <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 h-full shadow-lg hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-2xl font-bold text-gray-800 transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>{inProgress}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">In Progress</h3>
            <p className="text-gray-600 text-sm">Tickets currently in progress</p>
          </div>
        </div>
      </div>

      {/* Completed Today */}
      <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 h-full shadow-lg hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-2xl font-bold text-gray-800 transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>{completedToday}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Completed Today</h3>
            <p className="text-gray-600 text-sm">Tickets resolved today</p>
          </div>
        </div>
      </div>

      {/* Declined Tickets */}
      <Link href="/declined-tickets" className="block h-full">
        <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer h-full shadow-lg hover:shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 21l-5.197-5.197m0 0L5.636 5.636M13.803 15.803L18 21" />
                </svg>
              </div>
              <span className={`text-2xl font-bold text-gray-800 transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>{declinedTotal}</span>
            </div>
            <div className="flex-1 flex flex-col justify-end">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Declined Tickets</h3>
              <p className="text-gray-600 text-sm">Total declined tickets</p>
            </div>
          </div>
        </div>
      </Link>

      {/* Active Tickets */}
      <div className="group relative bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 hover:transform hover:scale-105 h-full shadow-lg hover:shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative z-10 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className={`text-2xl font-bold text-gray-800 transition-all duration-300 ${isLoading ? 'animate-pulse' : ''}`}>{total}</span>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Active Tickets</h3>
            <p className="text-gray-600 text-sm">Total number of tickets</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}