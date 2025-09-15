'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'

interface TopNavigationWrapperProps {
  user: User
}

export default function TopNavigationWrapper({ user }: TopNavigationWrapperProps) {
  const [mounted, setMounted] = useState(false)
  const [TopNavigation, setTopNavigation] = useState<any>(null)

  useEffect(() => {
    // Dynamically import the component only on the client side
    import('./TopNavigation').then((module) => {
      setTopNavigation(() => module.default)
      setMounted(true)
    })
  }, [])

  if (!mounted || !TopNavigation) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-green-200/30 shadow-lg">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="text-gray-600 font-semibold">Loading...</div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return <TopNavigation user={user} />
}
