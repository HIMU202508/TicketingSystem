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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-4 leading-tight">
              Declined Tickets
            </h1>
            <p className="text-white/70 text-lg">
              View all declined tickets with their reasons and details
            </p>
          </div>

          {/* Declined Tickets Table */}
          <DeclinedTicketsTable />
        </div>
      </div>
    </div>
  )
}
