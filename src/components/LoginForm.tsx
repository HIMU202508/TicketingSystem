'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

interface LoginFormProps {
  isModal?: boolean
  onClose?: () => void
}

export default function LoginForm({ isModal = false, onClose }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    if (onClose) {
      onClose()
    } else {
      router.push('/')
    }
  }





  const modalContent = (
    <>
      {/* Login Form */}
      <div className="group relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 border border-green-200/50 hover:border-green-300/70 transition-all duration-500 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Header inside modal */}
        <div className="text-center mb-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 via-green-700 to-emerald-700 bg-clip-text text-transparent mb-4 leading-tight">
            Welcome Back
          </h1>
          <p className="text-gray-600 mb-4 font-light">
            Sign in to access your IT support dashboard
          </p>
        </div>

        <form className="relative z-10 space-y-6" onSubmit={handleSubmit}>
          {isModal && onClose && (
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-4 text-lg font-bold text-white transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl hover:from-green-400 hover:to-emerald-400 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Sign In
                </>
              )}
            </span>
            {/* Animated background */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-400 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
          </button>
        </form>
      </div>
    </>
  )

  if (isModal && showModal) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop - removed onClick handler to prevent accidental closes */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative w-full max-w-md transform transition-all">
            {modalContent}
          </div>
        </div>
      </div>
    )
  }

  // Full page version (when not modal)
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-300/8 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {modalContent}
        </div>
      </div>
    </div>
  )
}
