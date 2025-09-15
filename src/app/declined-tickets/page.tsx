import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TopNavigationWrapper from '@/components/TopNavigationWrapper'
import DeclinedTicketsTable from '@/components/DeclinedTicketsTable'

export default async function DeclinedTicketsPage() {
  const supabase = await createClient()
  let user: any = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    try { await supabase.auth.signOut() } catch {}
    user = null
  }

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-300/8 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Top Navigation */}
      <TopNavigationWrapper user={user} />

      {/* Main Content */}
      <div className="relative z-10 pt-28">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-none">
          {/* Enhanced Page Header */}
          <div className="text-center mb-12">
            <div className="relative inline-block">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 blur-3xl rounded-full scale-150"></div>

              {/* Main title with enhanced visibility */}
              <h1 className="relative text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
                <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl">
                  Declined Tickets
                </span>
                {/* Text shadow effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent blur-sm opacity-50 -z-10">
                  Declined Tickets
                </span>
              </h1>
            </div>



            {/* Decorative elements */}
            <div className="flex justify-center items-center gap-4 mt-6">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent"></div>
            </div>
          </div>

          {/* Declined Tickets Table */}
          <DeclinedTicketsTable />
        </div>
      </div>
    </div>
  )
}
