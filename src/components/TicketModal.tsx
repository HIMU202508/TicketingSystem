'use client'

import { useState } from 'react'
// import { createClient } from '@/lib/supabase-browser'

interface TicketModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TicketModal({ isOpen, onClose }: TicketModalProps) {
  const [device, setDevice] = useState('')
  const [repairReason, setRepairReason] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [facility, setFacility] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketNumber, setTicketNumber] = useState('')
  // const supabase = createClient()

  const deviceOptions = [
    'Laptop',
    'Desktop',
    'Monitor',
    'Printer',
    'Scanner',
    'Projector',
    'Tablet',
    'Smartphone',
    'Router',
    'Switch',
    'Camera',
    'Headset',
    'Keyboard',
    'Mouse',
    'Speaker',
    'Microphone',
    'Software'
  ]

  const facilityOptions = [
    'ADMINISTRATIVE OFFICE',
    'BACLARAN HEALTH CENTER',
    'BF - SAMPALOC SATELLITE HEALTH CENTER',
    'BF MAIN HEALTH CENTER',
    'CITY DENTAL CLINIC',
    'CITY EMPLOYEES CLINIC',
    'CITY EPIDEMIOLOGY AND SURVEILLANCE UNIT',
    'DON BOSCO HEALTH CENTER',
    'DON GALO HEALTH CENTER',
    'ENVIRONMENTAL SANITATION AND OCCUPATIONAL HEALTH SERVICES',
    'FINANCE UNIT',
    'HEALTH EDUCATION AND PROMOTION OFFICE',
    'HEALTH EMERGENCY MANAGEMENT SERVICES',
    'HEALTH FACILITY AND EQUIPMENT PROGRAM',
    'HEALTH INFORMATION MANAGEMENT UNIT',
    'HEALTH SYSTEMS SUPPORT DIVISION',
    'HUMAN RESOURCES MANAGEMENT UNIT',
    'LA HUERTA HEALTH CENTER',
    'LABORATORY SERVICES',
    'MAIN CITY HEALTH OFFICE',
    'MARCELO GREEN HEALTH CENTER',
    'MERVILLE HEALTH CENTER',
    'MOONWALK HEALTH CENTER',
    'NUTRITION OFFICE',
    'PRIMARY HEALTH CARE SERVICES DELIVERY DIVISION',
    'PROPERTY AND SUPPLY/LOGISTIC MANAGEMENT UNIT',
    'PUBLIC HEALTH PROGRAM MANAGEMENT UNITI',
    'RECORDS INFORMATION MANAGEMENT UNIT',
    'SAN ANTONIO - SAV 8 SATELLITE HEALTH CENTER',
    'SAN ANTONIO MAIN HEALTH CENTER',
    'SAN DIONISIO HEALTH CENTER',
    'SAN ISIDRO HEALTH CENTER',
    'SAN MARTIN DE PORRES HEALTH CENTER',
    'SOCIAL HYGIENE CLINIC & WELLNESS CENTER',
    'STO. NINO HEALTH CENTER',
    'SUN VALLEY HEALTH CENTER',
    'TAMBO HEALTH CENTER',
    'TECHNICAL SERVICES DIVISION',
    'VITALEZ HEALTH CENTER'
  ]

  const generateTicketNumber = (deviceName: string) => {
    const devicePrefix = deviceName.substring(0, 2).toUpperCase()
    const today = new Date()
    const dateString = today.getFullYear().toString() +
                      (today.getMonth() + 1).toString().padStart(2, '0') +
                      today.getDate().toString().padStart(2, '0')
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${devicePrefix}${dateString}${randomSuffix}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const generatedTicketNumber = generateTicketNumber(device)
      setTicketNumber(generatedTicketNumber)

      // Call API to create ticket
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device,
          repairReason,
          ownerName,
          facility: facility.toUpperCase(),
          ticketNumber: generatedTicketNumber
        })
      })

      let result: any = null
      let rawText: string | null = null
      try {
        result = await response.json()
      } catch {
        try {
          rawText = await response.text()
        } catch {}
      }

      if (!response.ok) {
        const msg = (result && (result.error || result.message)) || (rawText ? rawText : 'Failed to create ticket')
        throw new Error(typeof msg === 'string' ? msg : 'Failed to create ticket')
      }

      console.log('Ticket created:', result)
      setSuccess(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred'
      console.error('Error creating ticket:', message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setDevice('')
    setRepairReason('')
    setOwnerName('')
    setFacility('')
    setSuccess(false)
    setError(null)
    setTicketNumber('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
        {!success ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Create IT Support Ticket</h2>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Device Selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  What device do you want to repair?
                </label>
                <select
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="" className="bg-gray-800 text-white">Select a device...</option>
                  {deviceOptions.map((option) => (
                    <option key={option} value={option} className="bg-gray-800 text-white">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Repair Reason */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Please describe the issue or reason for repair
                </label>
                <textarea
                  value={repairReason}
                  onChange={(e) => setRepairReason(e.target.value)}
                  required
                  rows={3}
                  placeholder={"Describe what\u2019s wrong with the device or why it needs repair..."}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">Owner&apos;s Name</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  required
                  placeholder={"Enter the owner\u2019s full name"}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Facility */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Facility
                </label>
                <select
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="" className="bg-gray-800 text-white">Select a facility...</option>
                  {facilityOptions.map((option) => (
                    <option key={option} value={option} className="bg-gray-800 text-white">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:from-emerald-400 hover:to-teal-400 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Ticket...
                  </span>
                ) : (
                  'Create Ticket'
                )}
              </button>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Ticket Created Successfully!</h3>
            <div className="bg-white/10 rounded-2xl p-6 mb-6">
              <p className="text-white/80 mb-2">Your ticket number is:</p>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{ticketNumber}</p>
            </div>
            <div className="space-y-2 text-left bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-white/80"><span className="font-medium">Device:</span> {device}</p>
              <p className="text-white/80"><span className="font-medium">Issue:</span> {repairReason}</p>
              <p className="text-white/80"><span className="font-medium">Owner:</span> {ownerName}</p>
              <p className="text-white/80"><span className="font-medium">Facility:</span> {facility.toUpperCase()}</p>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl hover:from-purple-400 hover:to-indigo-400 hover:scale-105"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
