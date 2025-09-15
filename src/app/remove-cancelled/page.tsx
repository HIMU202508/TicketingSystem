'use client'

import { useState } from 'react'

export default function RemoveCancelledPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const removeCancelled = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/remove-cancelled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to call API',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Remove "Cancelled" Status</h1>
          
          <div className="mb-6">
            <p className="text-white/80 mb-4">
              This tool will help you remove the "cancelled" status and update any cancelled tickets to "declined" status.
            </p>
            
            <button
              onClick={removeCancelled}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-400 hover:to-pink-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Checking Cancelled Tickets...' : 'Check & Remove Cancelled Status'}
            </button>
          </div>

          {result && (
            <div className={`p-6 rounded-xl border ${
              result.success 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <h3 className="text-lg font-semibold mb-3">
                {result.success ? '✅ Analysis Complete' : '❌ Manual Update Required'}
              </h3>
              
              {result.success ? (
                <div>
                  <p className="mb-2">{result.message}</p>
                  <p className="mb-4">
                    <strong>Cancelled tickets found:</strong> {result.cancelledTicketsFound}
                  </p>
                  
                  {result.cancelledTickets && result.cancelledTickets.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Cancelled Tickets:</h4>
                      <div className="space-y-1">
                        {result.cancelledTickets.map((ticket: any) => (
                          <div key={ticket.id} className="text-sm bg-black/20 p-2 rounded">
                            ID: {ticket.id} | Ticket: {ticket.ticketNumber} | Status: {ticket.status}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-2"><strong>Error:</strong> {result.error}</p>
                  {result.details && (
                    <p className="mb-4 text-sm opacity-80"><strong>Details:</strong> {result.details}</p>
                  )}
                </div>
              )}
              
              {result.instructions && (
                <div className="mt-4 p-4 bg-black/20 rounded-lg">
                  <h4 className="font-semibold mb-2">{result.instructions.message}</h4>
                  
                  {result.instructions.steps && (
                    <div className="mb-3">
                      {result.instructions.steps.map((step: string, index: number) => (
                        <p key={index} className="text-sm mb-1">{step}</p>
                      ))}
                    </div>
                  )}
                  
                  {result.instructions.sql && (
                    <div className="space-y-2">
                      {result.instructions.sql.map((sql: string, index: number) => (
                        <div key={index} className="bg-black/30 p-2 rounded font-mono text-xs">
                          {sql}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h3 className="text-blue-400 font-semibold mb-2">What This Does</h3>
            <ul className="text-white/80 text-sm space-y-1 ml-4">
              <li>• Finds all tickets with "cancelled" status</li>
              <li>• Provides SQL commands to update them to "declined"</li>
              <li>• Updates database constraint to remove "cancelled" option</li>
              <li>• Ensures UI consistency with "declined" terminology</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
