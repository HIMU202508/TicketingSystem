import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TopNavigationWrapper from '@/components/TopNavigationWrapper'
import TicketsTable from '@/components/TicketsTable'

export default async function TicketsPage() {
  const supabase = await createClient()
  let user = null as any
  try {
    const res = await supabase.auth.getUser()
    user = res.data.user
  } catch (err) {
    try { await supabase.auth.signOut() } catch {}
    user = null
  }
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-white">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Top Navigation */}
      <TopNavigationWrapper user={user} />

      {/* Main Content */}
      <div className="relative z-10 pt-28">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-none">
          {/* Header with Dashboard Colors */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 via-green-700 to-emerald-700 bg-clip-text text-transparent mb-6 leading-tight">
              IT Support Tickets
            </h1>
            <p className="text-xl bg-gradient-to-r from-gray-800 via-green-700 to-emerald-700 bg-clip-text text-transparent max-w-3xl mx-auto leading-relaxed font-medium">
              Manage and track all IT support tickets and equipment repairs
            </p>
          </div>

          {/* Tickets Table */}
          <TicketsTable user={user} />
        </div>
      </div>
    </div>
  )
}
