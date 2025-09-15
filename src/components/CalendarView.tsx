'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'

interface CalendarViewProps {
  user: User
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'maintenance' | 'deadline' | 'meeting' | 'repair' | 'installation' | 'pending' | 'in_progress' | 'completed' | 'declined' | 'cancelled' | 'not_functioning'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  time?: string
}

const eventTypeColors = {
  maintenance: 'from-orange-500 to-red-500',
  deadline: 'from-red-500 to-pink-500',
  meeting: 'from-blue-500 to-indigo-500',
  repair: 'from-purple-500 to-indigo-500',
  installation: 'from-emerald-500 to-teal-500',
  // Ticket status gradients
  pending: 'from-yellow-500 to-amber-500',
  in_progress: 'from-blue-500 to-indigo-500',
  completed: 'from-green-500 to-emerald-500',
  declined: 'from-red-600 to-red-800',
  cancelled: 'from-red-600 to-red-800',
  not_functioning: 'from-orange-500 to-amber-500'
}

const eventTypeIcons = {
  maintenance: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  deadline: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  meeting: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 004 0z" />
    </svg>
  ),
  repair: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  installation: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Declined',
  not_functioning: 'Not functioning'
}

export default function CalendarView({ user }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [dayDetailsOpen, setDayDetailsOpen] = useState(false)

  // Load ticket-based events
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch('/api/tickets')
        const data = await res.json()
        if (!res.ok || !data?.tickets) return
        const mapped: CalendarEvent[] = data.tickets.map((t: any) => ({
          id: String(t.id),
          title: `Ticket ${t.ticket_number} • ${statusLabels[t.status] || t.status}`,
          date: new Date(t.created_at),
          type: (t.status as CalendarEvent['type'])
        }))
        setEvents(mapped)
      } catch (e) {
        // Silent fail; calendar will show empty
      }
    }
    fetchTickets()
  }, [])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getEventsForDate = (date: Date | null) => {
    if (!date) return []
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    )
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const days = getDaysInMonth(currentDate)
  const today = new Date()
  const upcomingEvents = events
    .filter(event => event.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Main Calendar */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Enhanced Calendar Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <p className="text-gray-600 text-sm">IT Support Calendar</p>
                </div>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-400 hover:to-green-400 transition-all duration-300 text-sm font-medium shadow-lg"
                >
                  Today
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-3 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-3 rounded-xl text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300 border border-gray-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Calendar Grid */}
          <div className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="p-3 text-center text-gray-600 font-semibold text-sm bg-gray-50 rounded-lg">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                const dayEvents = day ? getEventsForDate(day) : []
                const isToday = day && day.toDateString() === today.toDateString()
                const isSelected = day && selectedDate && day.toDateString() === selectedDate.toDateString()

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                      day
                        ? `border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md ${
                            isToday ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-emerald-300 shadow-lg' : 'bg-white'
                          } ${
                            isSelected ? 'bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-300 shadow-lg' : ''
                          }`
                        : 'border-transparent'
                    }`}
                    onClick={() => {
                      if (!day) return
                      setSelectedDate(day)
                      setDayDetailsOpen(true)
                    }}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-bold mb-2 ${
                          isToday ? 'text-emerald-700' : isSelected ? 'text-blue-700' : 'text-gray-800'
                        }`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs px-2 py-1 rounded-md bg-gradient-to-r ${eventTypeColors[event.type]} text-white truncate shadow-sm`}
                              title={event.title}
                            >
                              <div className="flex items-center gap-1">
                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                <span className="truncate">{event.title.split('•')[0].trim()}</span>
                              </div>
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-md">
                              +{dayEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Sidebar */}
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setShowEventModal(true)}
              className="w-full flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-400 hover:to-green-400 transition-all duration-300 shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="font-medium">Schedule Event</span>
            </button>
            <button className="w-full flex items-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400 transition-all duration-300 shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-medium">Set Reminder</span>
            </button>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Upcoming Events</h3>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">No upcoming events</p>
              </div>
            ) : (
              upcomingEvents.map(event => (
                <div key={event.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${eventTypeColors[event.type]} flex items-center justify-center text-white flex-shrink-0 shadow-lg`}>
                      {eventTypeIcons[event.type] || (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{event.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {event.date.toLocaleDateString()} {event.time && `• ${event.time}`}
                      </p>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">{event.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Event Legend */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Event Types</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(eventTypeColors).map(([type, colors]) => (
              <div key={type} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${colors} shadow-sm`}></div>
                <span className="text-sm text-gray-700 capitalize font-medium">
                  {type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Day Details Modal */}
      {dayDetailsOpen && selectedDate && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDayDetailsOpen(false)}></div>
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-3xl border border-gray-200 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedDate.toDateString()}</h3>
                  <p className="text-gray-600 text-sm">Events for this day</p>
                </div>
              </div>
              <button
                onClick={() => setDayDetailsOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {getEventsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No events for this day</p>
                </div>
              ) : (
                getEventsForDate(selectedDate).map(ev => (
                  <div key={ev.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${eventTypeColors[ev.type]} flex-shrink-0 mt-1`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800">{ev.title}</div>
                        <div className="text-xs text-gray-600 mt-1 capitalize">
                          {ev.type.replace('_', ' ')} Event
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Schedule Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEventModal(false)}></div>
          <div className="relative w-full max-w-md mx-4 bg-white rounded-3xl border border-gray-200 shadow-2xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Schedule Event</h3>
              <p className="text-gray-600 text-sm mb-6">Custom event scheduling functionality can be implemented here.</p>
              <button
                onClick={() => setShowEventModal(false)}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-400 hover:to-green-400 transition-all duration-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
