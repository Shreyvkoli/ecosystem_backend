'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUser, removeUser, removeAuthToken } from '@/lib/auth'
import Magnetic from './Magnetic'
import Logo from '@/components/Logo'
import NotificationBell from './NotificationBell'

interface NavbarProps {
  lightTheme?: boolean
}

export default function Navbar({ lightTheme = false }: NavbarProps) {
  const router = useRouter()
  const user = getUser()

  const handleLogout = () => {
    removeAuthToken()
    removeUser()
    router.push('/login')
  }

  if (!user) return null

  return (
    <nav className={`${lightTheme ? 'bg-white border-gray-200' : 'glass-morphism border-white/10'} sticky top-0 z-50 border-b`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center px-2 py-2 floating-animation">
              <Logo showWordmark size={24} />
            </Link>
            <div className="flex ml-4 space-x-4">
              {user.role === 'CREATOR' ? (
                <>
                  <Magnetic strength={0.2}>
                    <Link
                      href="/dashboard"
                      className={`border-transparent ${lightTheme ? 'text-gray-700 hover:text-indigo-600' : 'text-gray-700 hover:text-indigo-600'} hover:border-indigo-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
                    >
                      Dashboard
                    </Link>
                  </Magnetic>
                  <Magnetic strength={0.2}>
                    <Link
                      href="/orders/new"
                      className={`border-transparent ${lightTheme ? 'text-gray-700 hover:text-indigo-600' : 'text-gray-700 hover:text-indigo-600'} hover:border-indigo-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105 whitespace-nowrap`}
                    >
                      New Order
                    </Link>
                  </Magnetic>
                </>
              ) : user.role === 'EDITOR' ? (
                <>
                  <Magnetic strength={0.2}>
                    <Link
                      href="/editor/jobs"
                      className={`border-transparent ${lightTheme ? 'text-gray-700 hover:text-indigo-600' : 'text-gray-700 hover:text-indigo-600'} hover:border-indigo-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
                    >
                      Dashboard
                    </Link>
                  </Magnetic>
                  <Magnetic strength={0.2}>
                    <Link
                      href="/editor/wallet"
                      className={`border-transparent ${lightTheme ? 'text-gray-700 hover:text-indigo-600' : 'text-gray-700 hover:text-indigo-600'} hover:border-indigo-400 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
                    >
                      Wallet
                    </Link>
                  </Magnetic>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <NotificationBell user={user} />
            <div className={`text-sm ${lightTheme ? 'text-gray-600' : 'text-gray-700'}`}>
              <span className={`font-medium hidden md:inline ${lightTheme ? 'text-gray-900' : 'text-gray-900'}`}>{user.name}</span>
              <span className={`ml-2 px-2 py-1 ${lightTheme ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-700'} rounded-full text-xs`}>
                {user.role}
              </span>
            </div>
            <Magnetic strength={0.3}>
              <button
                onClick={handleLogout}
                className="premium-button text-sm px-4 py-2 hover-lift"
              >
                Logout
              </button>
            </Magnetic>
          </div>
        </div>
      </div>
    </nav>
  )
}

