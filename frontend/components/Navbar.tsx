'use client'

import { LogOut } from 'lucide-react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getUser, removeUser, removeAuthToken } from '@/lib/auth'
import { usersApi } from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] })
      alert('Profile photo updated!')
    }
  })

  const getAvatarUrl = () => {
    if (!user) return null
    if (!fullProfile) return null
    if (user.role === 'CREATOR') return fullProfile.creatorProfile?.avatarUrl
    if (user.role === 'EDITOR') return fullProfile.editorProfile?.avatarUrl
    return null
  }

  const handleAvatarClick = () => {
    if (!user || user.role !== 'CREATOR') return
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
    <nav className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 flex-nowrap">
          <div className="flex items-center">
            <Link href={user.role === 'EDITOR' ? '/editor/jobs' : '/dashboard'} className="flex items-center px-1 py-2 flex-shrink-0">
              <Logo showWordmark={true} size={28} />
            </Link>
            <div className="flex ml-3 sm:ml-5 space-x-1 sm:space-x-3">
              {user.role === 'CREATOR' ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden md:inline-flex items-center px-3 py-1.5 text-caption text-gray-500 hover:text-charcoal hover:bg-gray-50 rounded-lg transition-all"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/orders/new"
                    className="hidden md:inline-flex items-center px-3 py-1.5 text-caption text-gray-500 hover:text-charcoal hover:bg-gray-50 rounded-lg transition-all whitespace-nowrap"
                  >
                    New Order
                  </Link>
                </>
              ) : user.role === 'EDITOR' ? (
                <>
                  <Link
                    href="/editor/jobs"
                    className="hidden md:inline-flex items-center px-3 py-1.5 text-caption text-gray-500 hover:text-charcoal hover:bg-gray-50 rounded-lg transition-all"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/editor/wallet"
                    className="hidden md:inline-flex items-center px-3 py-1.5 text-caption text-gray-500 hover:text-charcoal hover:bg-gray-50 rounded-lg transition-all"
                  >
                    Wallet
                  </Link>
                </>
              ) : user.role === 'ADMIN' ? (
                <Link
                  href="/admin/dashboard"
                  className="hidden md:inline-flex items-center px-3 py-1.5 text-caption text-gray-500 hover:text-charcoal hover:bg-gray-50 rounded-lg transition-all"
                >
                  Admin Dashboard
                </Link>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NotificationBell user={user} />

            <div className="flex items-center gap-2.5">
              {/* Avatar */}
              <div
                onClick={handleAvatarClick}
                className={`w-8 h-8 rounded-full bg-brand-light flex items-center justify-center overflow-hidden border border-brand/10 ${user.role === 'CREATOR' ? 'cursor-pointer hover:border-brand/30' : ''} transition-all`}
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
                  <span className="text-brand font-bold text-micro">{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="hidden md:flex flex-col">
                <span className="font-semibold text-micro text-charcoal leading-tight">{user.name}</span>
                <span className="text-micro text-gray-400 leading-tight">
                  {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            <div className="border-l border-gray-100 h-5 mx-1 hidden sm:block"></div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
