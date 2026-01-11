'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

// Legacy page shim: redirects to new Orders flow
export default function ProjectDetailPage() {
  const router = useRouter()
  const user = getUser()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    // Redirect to orders list since Projects are deprecated
    router.push(user.role === 'CREATOR' ? '/dashboard' : '/editor/jobs')
  }, [user, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Redirecting to Orders...</p>
          <Link href="/dashboard" className="mt-4 text-indigo-600 hover:text-indigo-700">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

