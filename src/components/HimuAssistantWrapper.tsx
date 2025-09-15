'use client'

import dynamic from 'next/dynamic'

const HimuAssistant = dynamic(() => import('./HimuAssistant'), { 
  ssr: false,
  loading: () => <div className="text-center text-gray-400">Loading assistant...</div>
})

export default function HimuAssistantWrapper() {
  return <HimuAssistant />
}
