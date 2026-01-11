'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

// Legacy page shim: redirects to new Orders flow
export default function NewProjectPage() {
  const router = useRouter()
  const user = getUser()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    // Redirect to create order since Projects are deprecated
    router.push('/orders/new')
  }, [user, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Redirecting to Create Order...</p>
          <Link href="/orders/new" className="mt-4 text-indigo-600 hover:text-indigo-700">
            Create New Order
          </Link>
        </div>
      </div>
    </div>
  )
}

