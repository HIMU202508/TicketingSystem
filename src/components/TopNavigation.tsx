'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Image from 'next/image'
import CityLogo from '../../logos/parañaque.png'
import AlagangLogo from '../../logos/alagang parañaque.png'
import HimuLogo from '../../logos/himu-logo.png'

interface TopNavigationProps {
  user: User
}

type TicketNotification = {
  id: number
  ticket_number: string
  device_type: string
  owner_name: string
  created_at: string
  unread: boolean
}

export default function TopNavigation({ user }: TopNavigationProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [ticketNotifications, setTicketNotifications] = useState<TicketNotification[]>([])
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [acceptTicketId, setAcceptTicketId] = useState<number | null>(null)
  const [acceptTicketNumber, setAcceptTicketNumber] = useState<string>('')
  const [assignedToInput, setAssignedToInput] = useState<string>('')
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTicketId, setRejectTicketId] = useState<number | null>(null)
  const [rejectTicketNumber, setRejectTicketNumber] = useState<string>('')
  const [rejectReason, setRejectReason] = useState<string>('')
  const [rejectItOfficer, setRejectItOfficer] = useState<string>('')
  const [rejectLoading, setRejectLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const notificationRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const username = ((user.user_metadata as any)?.username as string) || (user.email?.split('@')[0] ?? '')

  // Notification sound (Web Audio API)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const hasGestureRef = useRef(false)
  const pendingSoundRef = useRef(false)
  const soundEnabled = true // Sound always enabled
  const unlockAudioEl = async () => {
    try {
      const el = audioElRef.current
      if (!el) return
      el.muted = true
      await el.play().catch(() => {})
      el.pause()
      el.currentTime = 0
      el.muted = false
    } catch {}
  }
  const ensureAudio = async () => {
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        try { await audioCtxRef.current.resume() } catch {}
      }
      return
    }
    try {
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!AC) return
      audioCtxRef.current = new AC()
    } catch {}

    // Prepare HTMLAudioElement for mp3 playback
    try {
      let el = audioElRef.current
      if (!el) {
        el = new Audio('/notify.mp3')
        el.preload = 'auto'
        ;(el as any).playsInline = true
        el.volume = 0.7
        audioElRef.current = el
      }
      // Attempt to unlock element
      await unlockAudioEl()
    } catch {}
  }
  const playNotificationSound = (soundType: 'new_ticket' | 'ticket_update' | 'success' | 'error' = 'new_ticket') => {
    if (!soundEnabled) return

    // Try HTMLAudioElement first for new ticket notifications
    if (soundType === 'new_ticket') {
      const el = audioElRef.current
      if (el) {
        try {
          // Prefer playing the preloaded element for reliability
          el.pause()
          el.currentTime = 0
          void el.play().catch(() => {
            // Fallback to a cloned element if direct play fails
            const clone = el.cloneNode(true) as HTMLAudioElement
            clone.volume = el.volume
            ;(clone as any).playsInline = true
            clone.currentTime = 0
            void clone.play().catch(() => {})
          })
          return
        } catch {}
      }
    }

    // Fallback to Web Audio with different sounds for different events
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      // Different sound patterns for different events
      switch (soundType) {
        case 'new_ticket':
          osc.type = 'sine'
          osc.frequency.setValueAtTime(880, now)
          osc.frequency.exponentialRampToValueAtTime(660, now + 0.12)
          gain.gain.setValueAtTime(0.0001, now)
          gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
          osc.start(now)
          osc.stop(now + 0.22)
          break
        case 'ticket_update':
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(600, now)
          gain.gain.setValueAtTime(0.0001, now)
          gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
          osc.start(now)
          osc.stop(now + 0.15)
          break
        case 'success':
          // Two-tone success sound
          osc.type = 'sine'
          osc.frequency.setValueAtTime(523, now) // C5
          osc.frequency.setValueAtTime(659, now + 0.1) // E5
          gain.gain.setValueAtTime(0.0001, now)
          gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01)
          gain.gain.exponentialRampToValueAtTime(0.04, now + 0.08)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)
          osc.start(now)
          osc.stop(now + 0.25)
          break
        case 'error':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(200, now)
          gain.gain.setValueAtTime(0.0001, now)
          gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02)
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
          osc.start(now)
          osc.stop(now + 0.2)
          break
      }

      osc.connect(gain)
      gain.connect(ctx.destination)
    } catch {}
  }

  // Browser Notifications
  const requestBrowserNotificationPermission = () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {})
        }
      }
    } catch {}
  }

  const showBrowserNotification = (n: TicketNotification) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const title = `New Ticket ${n.ticket_number}`
        const body = `${n.device_type} • ${n.owner_name}`
        const icon = '/icon.svg'
        // eslint-disable-next-line no-new
        new Notification(title, { body, icon })
      }
    } catch {}
  }

  const formatTimeAgo = (iso: string) => {
    const createdMs = new Date(iso).getTime()
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

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Mark mounted to avoid SSR/client time mismatches
  useEffect(() => {
    setMounted(true)
    // Prepare audio on first user interaction to satisfy autoplay policies
    const handler = () => {
      hasGestureRef.current = true
      ensureAudio()
      unlockAudioEl()
      requestBrowserNotificationPermission()
      if (pendingSoundRef.current && !document.hidden) {
        pendingSoundRef.current = false
        playNotificationSound()
      }
    }
    window.addEventListener('pointerdown', handler, { once: true })
    const visHandler = () => {
      if (!document.hidden && pendingSoundRef.current && hasGestureRef.current) {
        pendingSoundRef.current = false
        playNotificationSound()
      }
    }
    document.addEventListener('visibilitychange', visHandler)
    return () => window.removeEventListener('pointerdown', handler)
  }, [])

  // Subscribe to new ticket inserts and updates for notifications
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        const row = payload.new as any
        const notif: TicketNotification = {
          id: row.id,
          ticket_number: row.ticket_number,
          device_type: row.device_type,
          owner_name: row.owner_name,
          created_at: row.created_at,
          unread: true,
        }
        setTicketNotifications((prev) => {
          if (prev.some(n => n.id === notif.id)) return prev
          return [notif, ...prev]
        })
        // Ensure audio is ready; if blocked by no-gesture or tab hidden, queue playback
        if (!hasGestureRef.current || document.hidden) {
          pendingSoundRef.current = true
          ensureAudio()
        } else {
          ensureAudio().finally(() => playNotificationSound())
        }
        showBrowserNotification(notif)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        const row = payload.new as any
        // If ticket status changed from 'pending' to something else, remove from notifications
        if (payload.old && (payload.old as any).status === 'pending' && row.status !== 'pending') {
          setTicketNotifications((prev) => prev.filter(n => n.id !== row.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Preload pending tickets so new ticket numbers remain visible until accepted
  useEffect(() => {
    const preloadPending = async () => {
      try {
        const res = await fetch('/api/tickets?status=pending&limit=100&page=1')
        const data = await res.json()
        if (!res.ok || !data?.tickets) return
        const pendingNotifs: TicketNotification[] = (data.tickets as any[])
          .map(t => ({
            id: t.id,
            ticket_number: t.ticket_number,
            device_type: t.device_type,
            owner_name: t.owner_name,
            created_at: t.created_at,
            unread: true,
          }))
        setTicketNotifications((prev) => {
          const seen = new Set(prev.map(n => n.id))
          const merged = [...prev, ...pendingNotifs.filter(n => !seen.has(n.id))]
          return merged
        })
      } catch {}
    }
    preloadPending()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
        </svg>
      )
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: 'Ticket Status',
      href: '/tickets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      name: 'Repair By',
      href: '/repairs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      name: 'Declined Tickets',
      href: '/declined-tickets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18 21l-5.197-5.197m0 0L5.636 5.636M13.803 15.803L18 21" />
        </svg>
      )
    }
  ]

  const prefetchRoute = (href: string) => {
    try {
      router.prefetch(href)
    } catch {}
  }

  const unreadCount = ticketNotifications.filter(n => n.unread).length

  const openAcceptModal = (ticketId: number, ticketNumber: string) => {
    setAcceptTicketId(ticketId)
    setAcceptTicketNumber(ticketNumber)
    setAssignedToInput('')
    setIsNotificationOpen(false)
    setAcceptModalOpen(true)
  }

  const openRejectModal = (ticketId: number, ticketNumber: string) => {
    setRejectTicketId(ticketId)
    setRejectTicketNumber(ticketNumber)
    setRejectReason('')
    setRejectItOfficer('')
    setIsNotificationOpen(false)
    setRejectModalOpen(true)
  }

  const submitAccept = async () => {
    if (!acceptTicketId || !assignedToInput.trim()) return
    try {
      setAcceptLoading(true)
      const res = await fetch(`/api/tickets/${acceptTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress', assigned_to: assignedToInput.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept ticket')
      // Remove the accepted ticket from notifications completely
      setTicketNotifications((prev) => prev.filter(n => n.id !== acceptTicketId))
      setAcceptModalOpen(false)
      // Play success sound for accepting ticket
      ensureAudio().finally(() => playNotificationSound('success'))
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e instanceof Error ? e.message : 'Failed to accept ticket')
      // Play error sound for failed accept
      ensureAudio().finally(() => playNotificationSound('error'))
    } finally {
      setAcceptLoading(false)
    }
  }

  const submitReject = async () => {
    if (!rejectTicketId || !rejectReason.trim() || !rejectItOfficer.trim()) return
    try {
      setRejectLoading(true)
      const res = await fetch(`/api/tickets/${rejectTicketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'cancelled', // Temporarily use 'cancelled' until constraint allows 'declined'
          remarks: rejectReason.trim(),
          declined_by: rejectItOfficer.trim()
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to decline ticket')
      setTicketNotifications((prev) => prev.filter(n => n.id !== rejectTicketId))
      setRejectModalOpen(false)
      // Play ticket update sound for declining ticket
      ensureAudio().finally(() => playNotificationSound('ticket_update'))
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e instanceof Error ? e.message : 'Failed to decline ticket')
      // Play error sound for failed decline
      ensureAudio().finally(() => playNotificationSound('error'))
    } finally {
      setRejectLoading(false)
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-green-200/30 shadow-lg">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <div className="hidden sm:flex items-center gap-2 mr-3">
              <div className="w-9 h-9 rounded-lg bg-green-100/80 border border-green-200/50 flex items-center justify-center">
                <Image src={CityLogo} alt="Parañaque City" height={20} />
              </div>
              <div className="w-9 h-9 rounded-lg bg-green-100/80 border border-green-200/50 flex items-center justify-center">
                <Image src={AlagangLogo} alt="Alagang Parañaque" height={20} />
              </div>
              <div className="w-9 h-9 rounded-lg bg-green-100/80 border border-green-200/50 flex items-center justify-center">
                <Image src={HimuLogo} alt="HIMU" height={20} />
              </div>
            </div>
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="hidden sm:block">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-800 to-green-700 bg-clip-text text-transparent">
                  HIMU
                </span>
                <div className="text-xs text-gray-600 font-medium">Ticketing System</div>
              </div>
            </Link>
          </div>

          {/* Expanded Navigation Links */}
          <div className="hidden lg:flex items-center space-x-2 flex-1 justify-center max-w-4xl mx-8">
            {navigationItems.map((item) => (
              <div key={`nav-${item.name}`} className="contents">
                <Link
                  href={item.href}
                  prefetch
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  className="group relative flex flex-col items-center space-y-1 px-6 py-3 rounded-2xl text-gray-600 hover:text-gray-800 transition-all duration-300 hover:bg-green-100/50 hover:scale-105 min-w-[120px]"
                >
                  <div className="relative">
                    <span className="group-hover:scale-110 transition-transform duration-300 block">
                      {item.icon}
                    </span>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-500/30 to-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg scale-150"></div>
                  </div>
                  <span className="font-medium text-sm text-center">{item.name}</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {/* Active indicator */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>

                {/* Pending module removed */}
              </div>
            ))}
          </div>

          {/* Compact Navigation for Medium Screens */}
          <div className="hidden md:flex lg:hidden items-center space-x-1 flex-1 justify-center mx-4">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                prefetch
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                className="group relative flex items-center space-x-2 px-4 py-2 rounded-xl text-gray-600 hover:text-gray-800 transition-all duration-300 hover:bg-green-100/50"
              >
                <span className="group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.name}</span>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ))}
            {/* Pending module removed */}
          </div>

          {/* Mobile Navigation Icons Only */}
          <div className="flex md:hidden items-center space-x-1 flex-1 justify-center mx-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                prefetch
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                className="group relative flex flex-col items-center space-y-1 px-3 py-2 rounded-xl text-gray-600 hover:text-gray-800 transition-all duration-300 hover:bg-green-100/50"
                title={item.name}
              >
                <span className="group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </span>
                <span className="text-xs font-medium">{item.name.split(' ')[0]}</span>
              </Link>
            ))}
            {/* Pending module removed */}
          </div>

          {/* Expanded Date and Time Display - Desktop (reduced) */}
          <div className="hidden xl:flex items-center space-x-3 px-3 py-1 rounded-xl bg-green-100/50 backdrop-blur-sm border border-green-200/30">
            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-gray-800">
                  {/* eslint-disable react/no-unescaped-entities */}
                  <span suppressHydrationWarning>{mounted ? currentTime.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : ''}</span>
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-green-300/40"></div>

            <div className="flex flex-col items-center space-y-1">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium text-gray-800 font-mono" >
                  <span suppressHydrationWarning>{mounted ? currentTime.toLocaleTimeString('en-US', {
                    hour12: true,
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit'
                  }) : ''}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Compact Date and Time Display - Tablet (reduced) */}
          <div className="hidden lg:flex xl:hidden items-center space-x-2 px-3 py-1 rounded-lg bg-green-100/50 backdrop-blur-sm border border-green-200/30">
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-medium text-gray-800">
                <span suppressHydrationWarning>{mounted ? currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
              </span>
            </div>
            <div className="w-px h-4 bg-green-300/40"></div>
            <div className="flex items-center space-x-2">
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-gray-800 font-mono">
                <span suppressHydrationWarning>{mounted ? currentTime.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }) : ''}</span>
              </span>
            </div>
          </div>

          {/* Mobile Time Only (reduced) */}
          <div className="flex lg:hidden items-center px-2 py-1 rounded-lg bg-white/5">
            <span className="text-xs font-medium text-white font-mono">
              <span suppressHydrationWarning>{mounted ? currentTime.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit', second: '2-digit' }) : ''}</span>
            </span>
          </div>

          {/* Right Side - Expanded Notifications and Profile */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Expanded Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative flex flex-col items-center space-y-0.5 px-2 py-1 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-green-100/50 transition-all duration-300 min-w-[72px]"
                onMouseEnter={ensureAudio}
                onFocus={ensureAudio}
              >
                <div className="relative">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">Notifications</span>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-5 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              {/* Notifications Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl border border-green-200/50 shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-green-200/30 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">New Tickets</h3>
                      <p className="text-xs text-gray-600 mt-1">Click a ticket to accept and assign</p>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {ticketNotifications.length === 0 && (
                      <div className="p-6 text-center text-gray-600">No new tickets yet</div>
                    )}
                    {ticketNotifications.map((n) => (
                      <div key={n.id} className={`p-4 border-b border-green-100/50 hover:bg-green-50/50 transition-colors duration-200 ${n.unread ? 'bg-green-50/30' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${n.unread ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => openAcceptModal(n.id, n.ticket_number)}
                                className="text-sm md:text-base font-semibold text-gray-800 hover:underline truncate text-left"
                                title={`Accept Ticket ${n.ticket_number}`}
                              >
                                Ticket {n.ticket_number}
                              </button>
                              <span className="text-xs text-gray-600" title={new Date(n.created_at).toLocaleString()}>
                                {formatTimeAgo(n.created_at)}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-[10px] md:text-xs px-2 py-1 rounded-full bg-green-100/80 border border-green-200/50 text-gray-700">{n.device_type}</span>
                              <span className="text-[10px] md:text-xs px-2 py-1 rounded-full bg-green-100/80 border border-green-200/50 text-gray-700">{n.owner_name}</span>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => openAcceptModal(n.id, n.ticket_number)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs md:text-sm hover:bg-emerald-500"
                              >
                                Accept & Assign
                              </button>
                              <button
                                onClick={() => openRejectModal(n.id, n.ticket_number)}
                                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs md:text-sm hover:bg-red-500"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Expanded Profile Section */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 px-3 py-1 rounded-xl text-gray-800 hover:bg-green-100/50 transition-all duration-300 bg-green-100/30 border border-green-200/30"
                onMouseEnter={ensureAudio}
                onFocus={ensureAudio}
              >
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {username?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-bold text-gray-800 text-xs">
                    {username}
                  </span>
                </div>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-2xl border border-green-200/50 shadow-2xl overflow-hidden">
                  <div className="p-4 border-b border-green-200/30">
                    <p className="text-sm font-medium text-gray-800">{user.email}</p>
                    <p className="text-xs text-gray-600">IT Support User</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-green-100/50 transition-colors duration-200"
                    >
                      Profile Settings
                    </Link>
                  </div>
                  <div className="border-t border-green-200/30">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Accept & Assign Modal (Portal) */}
      {acceptModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setAcceptModalOpen(false)}></div>
          <div className="relative w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Accept Ticket {acceptTicketNumber}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/90 mb-1">Assigned IT OFFICER name</label>
                <select
                  value={assignedToInput}
                  onChange={(e) => setAssignedToInput(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-xl text-white"
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
                <p className="text-[11px] text-white/60 mt-2">Accepting will set status to In Progress.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setAcceptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white"
                  disabled={acceptLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitAccept}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white disabled:opacity-50"
                  disabled={acceptLoading || !assignedToInput.trim()}
                >
                  {acceptLoading ? 'Accepting...' : 'Accept'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Decline Modal */}
      {rejectModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRejectModalOpen(false)}></div>
          <div className="relative w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Decline Ticket {rejectTicketNumber}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/90 mb-1">Reason for declining</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Please provide a reason for declining this ticket..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 resize-none"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm text-white/90 mb-1">IT Officer</label>
                <select
                  value={rejectItOfficer}
                  onChange={(e) => setRejectItOfficer(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-xl text-white"
                >
                  <option value="" className="bg-gray-800 text-white">Select IT Officer...</option>
                  <option value="DANTE S. GUTIERREZ JR." className="bg-gray-800 text-white">DANTE S. GUTIERREZ JR.</option>
                  <option value="JAY T. CONCON" className="bg-gray-800 text-white">JAY T. CONCON</option>
                  <option value="ISAIAH JOHN B. SAN PEDRO" className="bg-gray-800 text-white">ISAIAH JOHN B. SAN PEDRO</option>
                  <option value="MICHELLE ANN M. CRUTO" className="bg-gray-800 text-white">MICHELLE ANN M. CRUTO</option>
                  <option value="GEORGE D. CALANGIAN" className="bg-gray-800 text-white">GEORGE D. CALANGIAN</option>
                  <option value="JUSTIN RY C. PUNLA" className="bg-gray-800 text-white">JUSTIN RY C. PUNLA</option>
                  <option value="KEN-NIÑO LLAGUNO" className="bg-gray-800 text-white">KEN-NIÑO LLAGUNO</option>
                </select>
                <p className="text-[11px] text-white/60 mt-2">Declining will remove the ticket from pending status.</p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white"
                  disabled={rejectLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={submitReject}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white disabled:opacity-50"
                  disabled={rejectLoading || !rejectReason.trim() || !rejectItOfficer.trim()}
                >
                  {rejectLoading ? 'Declining...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Hidden preloaded audio element */}
      <audio ref={audioElRef} src="/notify.mp3" preload="auto" className="hidden" />
    </nav>
  )
}
