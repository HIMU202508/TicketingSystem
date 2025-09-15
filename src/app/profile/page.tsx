import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TopNavigationWrapper from '@/components/TopNavigationWrapper'
import ProfileSettings from '@/components/ProfileSettings'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-white relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-300/8 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <TopNavigationWrapper user={user} />

      <div className="relative z-10 pt-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Header with Better Visibility */}
          <div className="text-center mb-12 pt-8">
            <div className="relative inline-block bg-white/95 backdrop-blur-md rounded-3xl border border-gray-200 shadow-2xl px-12 py-8 mx-4">
              {/* Decorative background elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-3xl"></div>

              {/* Main title with maximum legibility */}
              <div className="relative">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-gray-800 via-green-700 to-emerald-700 bg-clip-text text-transparent mb-4 leading-tight">
                  Profile Settings
                </h1>
                <p className="text-gray-700 text-lg font-medium">Manage your account email and password</p>

                {/* Decorative elements */}
                <div className="flex justify-center items-center gap-4 mt-4">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>

          <ProfileSettings />
        </div>
      </div>
    </div>
  )
} 