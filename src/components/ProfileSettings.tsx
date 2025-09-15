'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function ProfileSettings() {
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [initialEmail, setInitialEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailMessage, setEmailMessage] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [initialUsername, setInitialUsername] = useState('')
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwMessage, setPwMessage] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.email) {
          setEmail(user.email)
          setInitialEmail(user.email)
        }
        const meta = (user?.user_metadata as any) || {}
        const uname = meta.username || ''
        setUsername(uname)
        setInitialUsername(uname)
      } catch {}
    }
    load()
  }, [supabase])

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMessage(null)
    setEmailError(null)
    if (!email || email === initialEmail) {
      setEmailError('Enter a new email address to update.')
      return
    }
    try {
      setEmailLoading(true)
      const { error } = await supabase.auth.updateUser({ email })
      if (error) throw error
      setEmailMessage('Email update requested. Check your inbox to confirm the change.')
      setInitialEmail(email)
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to update email')
    } finally {
      setEmailLoading(false)
    }
  }

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    setUsernameMessage(null)
    setUsernameError(null)
    if (username === initialUsername) {
      setUsernameError('No changes to save.')
      return
    }
    try {
      setUsernameLoading(true)
      const { error } = await supabase.auth.updateUser({ data: { username } })
      if (error) throw error
      setUsernameMessage('Username updated successfully.')
      setInitialUsername(username)
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : 'Failed to update username')
    } finally {
      setUsernameLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMessage(null)
    setPwError(null)

    if (!currentPassword) {
      setPwError('Please enter your current password.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.')
      return
    }

    try {
      setPwLoading(true)
      // Verify current password
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr) throw userErr
      const emailToUse = user?.email || initialEmail
      const { error: verifyErr } = await supabase.auth.signInWithPassword({ email: emailToUse, password: currentPassword })
      if (verifyErr) throw new Error('Current password is incorrect.')

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setPwMessage('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Username Section */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Username</h2>
            <p className="text-gray-600 text-sm">Update your display name</p>
          </div>
        </div>
        <form onSubmit={handleUpdateUsername} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="Enter your username"
            />
          </div>
          {usernameError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{usernameError}</div>}
          {usernameMessage && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4">{usernameMessage}</div>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={usernameLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-medium disabled:opacity-50 hover:from-emerald-400 hover:to-green-400 transition-all duration-300 shadow-lg"
            >
              {usernameLoading ? 'Saving...' : 'Save Username'}
            </button>
          </div>
        </form>
      </div>

      {/* Update Email Section */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Update Email</h2>
            <p className="text-gray-600 text-sm">Change your account email address</p>
          </div>
        </div>
        <form onSubmit={handleUpdateEmail} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>
          {emailError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{emailError}</div>}
          {emailMessage && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4">{emailMessage}</div>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={emailLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium disabled:opacity-50 hover:from-blue-400 hover:to-indigo-400 transition-all duration-300 shadow-lg"
            >
              {emailLoading ? 'Updating...' : 'Update Email'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password Section */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
            <p className="text-gray-600 text-sm">Update your account password for security</p>
          </div>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter current password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                placeholder="Re-enter new password"
                required
                minLength={6}
              />
            </div>
          </div>
          {pwError && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">{pwError}</div>}
          {pwMessage && <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4">{pwMessage}</div>}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium disabled:opacity-50 hover:from-purple-400 hover:to-pink-400 transition-all duration-300 shadow-lg"
            >
              {pwLoading ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 