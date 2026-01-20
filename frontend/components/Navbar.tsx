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
        <div className="flex justify-between h-16 flex-nowrap">
          <div className="flex items-center">
            <Link href={user.role === 'EDITOR' ? '/editor/jobs' : '/dashboard'} className="flex items-center px-1 py-2 floating-animation flex-shrink-0">
              <div className="md:hidden">
                <Logo showWordmark={true} size={32} />
              </div>
              <div className="hidden md:block">
                <Logo showWordmark={true} size={40} />
              </div>
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
                      className={`border-transparent ${lightTheme ? 'text-gray-700 hover:text-indigo-600' : 'text-gray-700 hover:text-indigo-600'} hover:border-indigo-400 hidden md:inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105 whitespace-nowrap`}
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
                      className={`border-transparent ${lightTheme ? 'text-gray-700 hover:text-indigo-600' : 'text-gray-700 hover:text-indigo-600'} hover:border-indigo-400 hidden md:inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-all duration-300 hover:scale-105`}
                    >
                      Wallet
                    </Link>
                  </Magnetic>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-4">
            <NotificationBell user={user} />

            <div className={`text-sm ${lightTheme ? 'text-gray-600' : 'text-gray-700'}`}>
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  onClick={handleAvatarClick}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border-2 border-indigo-200 cursor-pointer hover:border-indigo-400 transition-all shadow-sm ${user.role === 'CREATOR' ? 'hover:scale-105' : ''}`}
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
                      }}
                    />
                  ) : (
                    <span className="text-indigo-700 font-bold text-sm sm:text-lg">{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="hidden md:flex flex-col">
                  <span className={`font-medium text-sm leading-tight ${lightTheme ? 'text-gray-900' : 'text-gray-900'}`}>{user.name}</span>
                  <span className={`self-start px-1.5 py-0.5 ${lightTheme ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'} rounded text-[10px] uppercase tracking-wider font-bold`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-l border-gray-200 h-6 mx-2 hidden sm:block"></div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-110"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

