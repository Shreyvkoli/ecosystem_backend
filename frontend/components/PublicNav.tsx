'use client'

import Link from 'next/link'
import Magnetic from '@/components/Magnetic'
import Logo from '@/components/Logo'

export default function PublicNav() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <Logo href="/" size={24} />

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm dark:text-gray-300 dark:hover:text-white">
            Login
          </Link>
          <Magnetic strength={0.25}>
            <Link href="/register" className="glass-morphism px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-semibold whitespace-nowrap dark:text-gray-200 dark:hover:text-white">
              Join
            </Link>
          </Magnetic>
        </div>
      </div>
    </div>
  )
}
