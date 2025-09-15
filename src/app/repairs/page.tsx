import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import TopNavigationWrapper from '@/components/TopNavigationWrapper'
import RepairsTable from '@/components/RepairsTable'

export default async function RepairsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-100 to-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <TopNavigationWrapper user={user} />

      <div className="relative z-10 pt-28">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-none">
          <div className="text-center mb-8 pt-8">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-800 via-green-700 to-emerald-700 bg-clip-text text-transparent mb-6 leading-tight">
              Completed Repairs
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-light">
              View all tickets marked as completed
            </p>
          </div>

          <RepairsTable />
        </div>
      </div>
    </div>
  )
} 