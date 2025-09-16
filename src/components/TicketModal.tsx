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
  const [serialNumber, setSerialNumber] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [facility, setFacility] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ticketNumber, setTicketNumber] = useState('')
  const [copied, setCopied] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [priority, setPriority] = useState('medium')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('')
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('')
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
    'Software',
    'Server',
    'Other'
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

  const copyTicketNumber = async () => {
    try {
      await navigator.clipboard.writeText(ticketNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy ticket number:', err)
    }
  }

  // Filter functions for searchable dropdowns
  const filteredDeviceOptions = deviceOptions.filter(option =>
    option.toLowerCase().includes(deviceSearchQuery.toLowerCase())
  )

  const filteredFacilityOptions = facilityOptions.filter(option =>
    option.toLowerCase().includes(facilitySearchQuery.toLowerCase())
  )

  // Validation function
  const validateForm = () => {
    const errors: {[key: string]: string} = {}

    if (!device.trim()) errors.device = 'Device selection is required'
    if (!repairReason.trim()) errors.repairReason = 'Issue description is required'
    if (repairReason.trim().length < 10) errors.repairReason = 'Please provide more details (at least 10 characters)'
    if (!ownerName.trim()) errors.ownerName = 'Owner name is required'
    if (ownerName.trim().length < 2) errors.ownerName = 'Please enter a valid name'
    if (!facility.trim()) errors.facility = 'Facility selection is required'
    if (contactNumber && !/^[\d\s\-\+\(\)]+$/.test(contactNumber)) {
      errors.contactNumber = 'Please enter a valid contact number'
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Step navigation
  const nextStep = () => {
    if (currentStep === 1) {
      // Validate step 1 fields
      const step1Errors: {[key: string]: string} = {}
      if (!device.trim()) step1Errors.device = 'Device selection is required'
      if (!repairReason.trim()) step1Errors.repairReason = 'Issue description is required'
      if (repairReason.trim().length < 10) step1Errors.repairReason = 'Please provide more details (at least 10 characters)'

      setFieldErrors(step1Errors)
      if (Object.keys(step1Errors).length === 0) {
        setCurrentStep(2)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setFieldErrors({})
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

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
          ticketNumber: generatedTicketNumber,
          serialNumber: serialNumber || undefined,
          priority,
          urgency,
          contactNumber: contactNumber || undefined,
          email: email || undefined
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
    setSerialNumber('')
    setOwnerName('')
    setFacility('')
    setSuccess(false)
    setError(null)
    setTicketNumber('')
    setCopied(false)
    setCurrentStep(1)
    setPriority('medium')
    setContactNumber('')
    setEmail('')
    setUrgency('normal')
    setFieldErrors({})
    setDeviceSearchQuery('')
    setFacilitySearchQuery('')
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
      <div className="relative w-full max-w-2xl mx-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-h-[95vh] overflow-hidden">
        {!success ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Create IT Support Ticket</h2>
                  <p className="text-white/60 text-sm mt-1">Step {currentStep} of 2</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-200"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full ${currentStep >= 1 ? 'bg-emerald-500' : 'bg-white/20'} flex items-center justify-center`}>
                    {currentStep > 1 ? (
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold text-white">1</span>
                    )}
                  </div>
                  <div className={`flex-1 h-1 mx-2 rounded ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-white/20'}`}></div>
                  <div className={`w-4 h-4 rounded-full ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-white/20'} flex items-center justify-center`}>
                    <span className="text-xs font-bold text-white">2</span>
                  </div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-white/60">Device & Issue</span>
                  <span className="text-xs text-white/60">Contact & Details</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {currentStep === 1 && (
                  <>
                    {/* Step 1: Device & Issue Information */}
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Device & Issue Information</h3>
                        <p className="text-white/60 text-sm">Tell us about the device and the problem you're experiencing</p>
                      </div>

                      {/* Device Selection with Search */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          What device do you want to repair? <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={deviceSearchQuery}
                            onChange={(e) => {
                              setDeviceSearchQuery(e.target.value)
                              if (e.target.value === '') setDevice('')
                            }}
                            placeholder="Search for a device type..."
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          {deviceSearchQuery && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl max-h-40 overflow-y-auto">
                              {filteredDeviceOptions.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => {
                                    setDevice(option)
                                    setDeviceSearchQuery(option)
                                    setFieldErrors(prev => ({...prev, device: ''}))
                                  }}
                                  className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl"
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {!deviceSearchQuery && (
                          <select
                            value={device}
                            onChange={(e) => {
                              setDevice(e.target.value)
                              setDeviceSearchQuery(e.target.value)
                              setFieldErrors(prev => ({...prev, device: ''}))
                            }}
                            className="w-full px-4 py-3 mt-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="" className="bg-gray-800 text-white">Select a device...</option>
                            {deviceOptions.map((option) => (
                              <option key={option} value={option} className="bg-gray-800 text-white">
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                        {fieldErrors.device && (
                          <p className="text-red-400 text-sm mt-1">{fieldErrors.device}</p>
                        )}
                      </div>

                      {/* Repair Reason */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Please describe the issue or reason for repair <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          value={repairReason}
                          onChange={(e) => {
                            setRepairReason(e.target.value)
                            setFieldErrors(prev => ({...prev, repairReason: ''}))
                          }}
                          rows={4}
                          placeholder="Describe what's wrong with the device or why it needs repair... (minimum 10 characters)"
                          className={`w-full px-4 py-3 bg-white/10 border ${fieldErrors.repairReason ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
                        />
                        <div className="flex justify-between items-center mt-1">
                          {fieldErrors.repairReason && (
                            <p className="text-red-400 text-sm">{fieldErrors.repairReason}</p>
                          )}
                          <p className="text-white/40 text-xs ml-auto">{repairReason.length}/500</p>
                        </div>
                      </div>

                      {/* Priority & Urgency */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Priority Level</label>
                          <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="low" className="bg-gray-800 text-white">🟢 Low - Can wait</option>
                            <option value="medium" className="bg-gray-800 text-white">🟡 Medium - Normal</option>
                            <option value="high" className="bg-gray-800 text-white">🟠 High - Important</option>
                            <option value="critical" className="bg-gray-800 text-white">🔴 Critical - Urgent</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">Urgency</label>
                          <select
                            value={urgency}
                            onChange={(e) => setUrgency(e.target.value)}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="normal" className="bg-gray-800 text-white">Normal</option>
                            <option value="urgent" className="bg-gray-800 text-white">Urgent</option>
                            <option value="emergency" className="bg-gray-800 text-white">Emergency</option>
                          </select>
                        </div>
                      </div>

                      {/* Serial Number */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Serial Number <span className="text-white/50">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          placeholder="Enter device serial number (if available)"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-white/40 text-xs mt-1">💡 Tip: Serial numbers help us track device history and warranty status</p>
                      </div>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {/* Step 2: Contact & Facility Information */}
                    <div className="space-y-6">
                      <div className="text-center mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Contact & Facility Information</h3>
                        <p className="text-white/60 text-sm">Provide your contact details and facility location</p>
                      </div>

                      {/* Owner Name */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Owner's Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={ownerName}
                          onChange={(e) => {
                            setOwnerName(e.target.value)
                            setFieldErrors(prev => ({...prev, ownerName: ''}))
                          }}
                          placeholder="Enter the owner's full name"
                          className={`w-full px-4 py-3 bg-white/10 border ${fieldErrors.ownerName ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                        />
                        {fieldErrors.ownerName && (
                          <p className="text-red-400 text-sm mt-1">{fieldErrors.ownerName}</p>
                        )}
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Contact Number <span className="text-white/50">(Optional)</span>
                          </label>
                          <input
                            type="tel"
                            value={contactNumber}
                            onChange={(e) => {
                              setContactNumber(e.target.value)
                              setFieldErrors(prev => ({...prev, contactNumber: ''}))
                            }}
                            placeholder="e.g., +63 912 345 6789"
                            className={`w-full px-4 py-3 bg-white/10 border ${fieldErrors.contactNumber ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                          />
                          {fieldErrors.contactNumber && (
                            <p className="text-red-400 text-sm mt-1">{fieldErrors.contactNumber}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            Email Address <span className="text-white/50">(Optional)</span>
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value)
                              setFieldErrors(prev => ({...prev, email: ''}))
                            }}
                            placeholder="your.email@example.com"
                            className={`w-full px-4 py-3 bg-white/10 border ${fieldErrors.email ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                          />
                          {fieldErrors.email && (
                            <p className="text-red-400 text-sm mt-1">{fieldErrors.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Facility Selection with Search */}
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Facility <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={facilitySearchQuery}
                            onChange={(e) => {
                              setFacilitySearchQuery(e.target.value)
                              if (e.target.value === '') setFacility('')
                            }}
                            placeholder="Search for your facility..."
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                          {facilitySearchQuery && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-xl max-h-40 overflow-y-auto">
                              {filteredFacilityOptions.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => {
                                    setFacility(option)
                                    setFacilitySearchQuery(option)
                                    setFieldErrors(prev => ({...prev, facility: ''}))
                                  }}
                                  className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 first:rounded-t-xl last:rounded-b-xl text-sm"
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {!facilitySearchQuery && (
                          <select
                            value={facility}
                            onChange={(e) => {
                              setFacility(e.target.value)
                              setFacilitySearchQuery(e.target.value)
                              setFieldErrors(prev => ({...prev, facility: ''}))
                            }}
                            className="w-full px-4 py-3 mt-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            <option value="" className="bg-gray-800 text-white">Select a facility...</option>
                            {facilityOptions.map((option) => (
                              <option key={option} value={option} className="bg-gray-800 text-white">
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                        {fieldErrors.facility && (
                          <p className="text-red-400 text-sm mt-1">{fieldErrors.facility}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-4 pt-4">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-3 text-lg font-medium text-white transition-all duration-300 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/20"
                    >
                      ← Previous
                    </button>
                  )}

                  {currentStep < 2 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 py-3 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl hover:from-purple-400 hover:to-indigo-400 hover:scale-105"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:from-emerald-400 hover:to-teal-400 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                        '🎫 Create Ticket'
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
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
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-bold text-emerald-400 font-mono">{ticketNumber}</p>
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
            <div className="space-y-3 text-left bg-white/5 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-sm">Device</p>
                  <p className="text-white font-medium">{device}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Priority</p>
                  <p className="text-white font-medium capitalize">{priority}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-white/60 text-sm">Issue Description</p>
                  <p className="text-white font-medium">{repairReason}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Owner</p>
                  <p className="text-white font-medium">{ownerName}</p>
                </div>
                <div>
                  <p className="text-white/60 text-sm">Contact</p>
                  <p className="text-white font-medium">{contactNumber || email || 'Not provided'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-white/60 text-sm">Facility</p>
                  <p className="text-white font-medium">{facility.toUpperCase()}</p>
                </div>
                {serialNumber && (
                  <div className="md:col-span-2">
                    <p className="text-white/60 text-sm">Serial Number</p>
                    <p className="text-white font-medium font-mono text-sm bg-white/10 px-2 py-1 rounded">{serialNumber}</p>
                  </div>
                )}
              </div>
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
