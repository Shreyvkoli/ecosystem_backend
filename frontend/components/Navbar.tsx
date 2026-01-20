'use client'

import { LogOut } from 'lucide-react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUser, removeUser, removeAuthToken } from '@/lib/auth'
import { usersApi } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Magnetic from './Magnetic'
import Logo from '@/components/Logo'
import NotificationBell from './NotificationBell'

interface NavbarProps {
  lightTheme?: boolean
}

export default function Navbar({ lightTheme = false }: NavbarProps) {
  const router = useRouter()
  const user = getUser()
  const queryClient = useQueryClient()

  // Fetch verified profile data (including avatar)
  const { data: fullProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      const res = await usersApi.loadProfile(user.id)
      return res.data
    },
    enabled: !!user?.id
  })

  // Update Avatar Mutation
  const updateAvatarMutation = useMutation({
    mutationFn: (url: string) => usersApi.updateCreatorProfile({ avatarUrl: url }),
    onSuccess: () => {
      // Invalidate specific query to force refetch
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })
      alert('Profile photo updated!')
    }
  })

  const getAvatarUrl = () => {
    if (!user) return null
    // If fullProfile is loading or not present, fallback to user.avatar (if we had it) or null
    if (!fullProfile) return null
    if (user.role === 'CREATOR') return fullProfile.creatorProfile?.avatarUrl
    if (user.role === 'EDITOR') return fullProfile.editorProfile?.avatarUrl
    return null
  }

  const handleAvatarClick = () => {
    if (!user || user.role !== 'CREATOR') return // Only creators for now based on request
    const url = window.prompt("Enter your Profile Photo URL (e.g. from LinkedIn/Google):")
    if (url && url.trim()) {
      updateAvatarMutation.mutate(url.trim())
    }
  }

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
            <Link href={user.role === 'EDITOR' ? '/editor/jobs' : '/dashboard'} className="flex items-center px-2 py-2 floating-animation flex-shrink-0">
              <Logo showWordmark size={48} />
            </Link>
            <div className="flex ml-2 sm:ml-4 space-x-2 sm:space-x-4">
              {user.role === 'CREATOR' ? (
                <>
                  <Magnetic strength={0.2}>
                    <Link
                      href="/dashboard"
                      className={`hidden md:inline-flex border-transparent ${lightTheme ? 'text-gray-700 hover:text-indigo-600' : 'text-gray-700 hover:text-indigo-600'} hover:border-indigo-400 items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
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
                      className={`hidden md:inline-flex border-transparent ${lightTheme ? 'text-gray-700 hover:text-indigo-600' : 'text-gray-700 hover:text-indigo-600'} hover:border-indigo-400 items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
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
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  onClick={handleAvatarClick}
                  className={`w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-indigo-200 cursor-pointer hover:border-indigo-400 transition-all ${user.role === 'CREATOR' ? 'hover:scale-105' : ''}`}
                  title={user.role === 'CREATOR' ? "Click to update profile photo" : ""}
                >
                  {getAvatarUrl() ? (
                    <img
                      key={getAvatarUrl()}
                      src={getAvatarUrl()}
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Avatar failed to load:", getAvatarUrl());
                        // e.currentTarget.style.display = 'none'; // Commented out to see if it's broken image or missing
                      }}
                    />
                  ) : (
                    <span className="text-indigo-700 font-bold text-lg">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden md:flex flex-col">
                  <span className={`font-medium ${lightTheme ? 'text-gray-900' : 'text-gray-900'}`}>{user.name}</span>
                  <span className={`self-start px-2 py-0.5 ${lightTheme ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-700'} rounded-full text-[10px] uppercase tracking-wider font-bold`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
            <Magnetic strength={0.3}>
              <button
                onClick={handleLogout}
                className="premium-button text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 hover-lift flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 md:hidden" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </Magnetic>
          </div>
        </div>
      </div>
    </nav>
  )
}

