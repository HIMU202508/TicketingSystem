'use client'

import { useState } from 'react'

export default function FixConstraintPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fixConstraint = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/fix-constraint', {
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
          <h1 className="text-3xl font-bold text-white mb-6">Fix Database Constraint</h1>
          
          <div className="mb-6">
            <p className="text-white/80 mb-4">
              This tool will attempt to fix the database constraint to allow "declined" status for tickets.
            </p>
            
            <button
              onClick={fixConstraint}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Fixing Constraint...' : 'Fix Constraint'}
            </button>
          </div>

          {result && (
            <div className={`p-6 rounded-xl border ${
              result.success 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <h3 className="text-lg font-semibold mb-3">
                {result.success ? '✅ Success!' : '❌ Error'}
              </h3>
              
              {result.success ? (
                <div>
                  <p className="mb-2">{result.message}</p>
                  {result.testResult && (
                    <p className="text-sm opacity-80">{result.testResult}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="mb-2"><strong>Error:</strong> {result.error}</p>
                  {result.details && (
                    <p className="mb-4 text-sm opacity-80"><strong>Details:</strong> {result.details}</p>
                  )}
                  
                  {result.solution && (
                    <div className="mt-4 p-4 bg-black/20 rounded-lg">
                      <h4 className="font-semibold mb-2">{result.solution.message}</h4>
                      
                      {result.solution.instructions && (
                        <div className="mb-3">
                          {result.solution.instructions.map((instruction: string, index: number) => (
                            <p key={index} className="text-sm mb-1">{instruction}</p>
                          ))}
                        </div>
                      )}
                      
                      {result.solution.sql && (
                        <div className="space-y-2">
                          {result.solution.sql.map((sql: string, index: number) => (
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
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h3 className="text-blue-400 font-semibold mb-2">Manual Fix Instructions</h3>
            <p className="text-white/80 text-sm mb-3">
              If the automatic fix doesn't work, you can manually update the constraint in your Supabase dashboard:
            </p>
            <ol className="text-white/80 text-sm space-y-1 ml-4">
              <li>1. Go to your Supabase dashboard</li>
              <li>2. Navigate to SQL Editor</li>
              <li>3. Run these commands:</li>
            </ol>
            <div className="mt-3 space-y-2">
              <div className="bg-black/30 p-3 rounded font-mono text-xs text-white">
                ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;
              </div>
              <div className="bg-black/30 p-3 rounded font-mono text-xs text-white">
                ALTER TABLE tickets ADD CONSTRAINT tickets_status_check<br/>
                &nbsp;&nbsp;CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'not_functioning', 'declined'));
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
