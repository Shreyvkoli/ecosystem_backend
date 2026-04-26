'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, youtubeApi, usersApi } from '@/lib/api'
import { getUser, getAuthToken, removeUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import YouTubeConnectModal from '@/components/YouTubeConnectModal'
import CreatorHandbookModal from '@/components/CreatorHandbookModal'
import EditorProfileModal from '@/components/EditorProfileModal'
import Link from 'next/link'
import { MessageCircle, Briefcase, Users, Plus, BookOpen, CheckCircle } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const user = getUser()
  const [showYouTubeConnectModal, setShowYouTubeConnectModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState<string | null>(null)
  const [showHandbookModal, setShowHandbookModal] = useState(false)
  const [activeTab, setActiveTab] = useState('active')
  const queryClient = useQueryClient()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = getAuthToken()

    if (!user || !token) {
      if (!token) removeUser()
      router.push('/login')
    } else if (user.role === 'EDITOR') {
      router.push('/editor/jobs')
    }
  }, [user, router])



  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await ordersApi.list()
      return response.data
    },
    enabled: !!user,
  })

  // Fetch Saved Editors
  const { data: savedEditors, isLoading: isLoadingEditors } = useQuery({
    queryKey: ['saved-editors'],
    queryFn: async () => {
      const response = await usersApi.listSavedEditors()
      return response.data
    },
    enabled: !!user && user.role === 'CREATOR' && activeTab === 'saved',
  })

  // Unsave Editor Mutation
  const unsaveMutation = useMutation({
    mutationFn: (editorId: string) => usersApi.saveEditor(editorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-editors'] })
    }
  })

  // Filter Orders for Tabs
  const filteredOrders = orders?.filter((order: any) => {
    const isCompleted = order.status === 'COMPLETED' || order.status === 'CANCELLED';
    return activeTab === 'history' ? isCompleted : !isCompleted;
  });

  const { data: youtubeStatus } = useQuery({
    queryKey: ['youtube-status'],
    queryFn: () => youtubeApi.getStatus(),
    enabled: !!user && user.role === 'CREATOR',
  })

  if (!mounted) return null

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-gray-50 text-gray-600 border border-gray-200',
      APPLIED: 'bg-amber-50 text-amber-700 border border-amber-200',
      ASSIGNED: 'bg-blue-50 text-blue-700 border border-blue-200',
      IN_PROGRESS: 'bg-brand-light text-brand-dark border border-brand/20',
      PREVIEW_SUBMITTED: 'bg-orange-50 text-orange-700 border border-orange-200',
      REVISION_REQUESTED: 'bg-red-50 text-red-700 border border-red-200',
      FINAL_SUBMITTED: 'bg-brand text-white border border-brand-dark',
      PUBLISHED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
      CANCELLED: 'bg-gray-50 text-gray-500 border border-gray-200',
    }
    return colors[status] || 'bg-gray-50 text-gray-600 border border-gray-200'
  }

  const getJobCardGradient = (level?: string) => {
    switch (level) {
      case 'PREMIUM':
        return 'bg-gradient-to-br from-orange-50/80 via-white to-white border-orange-100 hover:shadow-orange-100/50'
      case 'PROFESSIONAL':
        return 'bg-gradient-to-br from-blue-50/80 via-white to-white border-blue-100 hover:shadow-blue-100/50'
      default:
        return 'bg-gradient-to-br from-green-50/80 via-white to-white border-green-100 hover:shadow-green-100/50'
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-heading text-charcoal">
                Creator Dashboard
              </h1>
              <p className="text-body text-gray-400 mt-1">Manage your video editing orders</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.role === 'CREATOR' && (
                <>
                  {youtubeStatus?.data.connected ? (
                    <div className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 text-caption">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      <span className="hidden sm:inline">YouTube Connected</span>
                      <span className="sm:hidden">Connected</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowYouTubeConnectModal(true)}
                      className="flex items-center px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-caption font-semibold"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      <span className="hidden sm:inline">Connect YouTube</span>
                      <span className="sm:hidden">Connect</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowHandbookModal(true)}
                    className="flex items-center px-3 py-2 bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-caption font-semibold"
                  >
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Handbook</span>
                  </button>
                  <Link
                    href="/orders/new"
                    className="btn-primary !py-2 !px-4 !text-caption"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Order</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
            {[
              { key: 'active', label: 'Active Orders' },
              { key: 'history', label: 'History' },
              ...(user.role === 'CREATOR' ? [{ key: 'saved', label: 'Saved Editors' }] : [])
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-caption font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'saved' ? (
            isLoadingEditors ? (
              <div className="pro-card text-center py-12">
                <p className="text-body text-gray-400">Loading saved editors...</p>
              </div>
            ) : !savedEditors || savedEditors.length === 0 ? (
              <div className="pro-card text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <h3 className="text-heading-sm text-charcoal mb-1">No saved editors yet</h3>
                <p className="text-body text-gray-400">Save editors from your past orders to easily find them again.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {savedEditors.map((editor: any) => (
                  <div key={editor.id} className="premium-card group hover:shadow-card-hover">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-11 h-11 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0 border border-brand/10">
                        {editor.avatarUrl ? (
                          <img src={editor.avatarUrl} alt={editor.name} className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <span className="text-brand font-bold text-body">{editor.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-caption font-bold text-charcoal truncate">{editor.name}</h3>
                        <p className="text-micro text-gray-400 truncate">{editor.email}</p>
                      </div>
                    </div>

                    {editor.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {editor.skills.slice(0, 3).map((skill: string) => (
                          <span key={skill} className="px-2 py-0.5 bg-gray-50 text-gray-500 text-micro rounded-md border border-gray-100">
                            {skill}
                          </span>
                        ))}
                        {editor.skills.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-micro rounded-md">+{editor.skills.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 gap-2">
                      <Link
                        href={`/orders/new?editorId=${editor.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white hover:bg-brand-dark py-2 rounded-lg text-caption font-bold transition-colors"
                      >
                        <Briefcase size={14} />
                        Direct Hire
                      </Link>
                      <button
                        onClick={() => setShowProfileModal(editor.id)}
                        className="px-3 py-2 text-gray-500 hover:text-charcoal text-caption font-medium bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${editor.name} from saved list?`)) {
                            unsaveMutation.mutate(editor.id)
                          }
                        }}
                        disabled={unsaveMutation.isPending}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove Editor"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            isLoading ? (
              <div className="pro-card text-center py-12">
                <p className="text-body text-gray-400">Loading orders...</p>
              </div>
            ) : !filteredOrders || filteredOrders.length === 0 ? (
              <div className="pro-card text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'active' ? (
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ) : (
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <h3 className="text-heading-sm text-charcoal mb-1">No {activeTab} orders</h3>
                {activeTab === 'active' && <p className="text-body text-gray-400 mb-6">Start by creating your first video editing order</p>}
                {user.role === 'CREATOR' && activeTab === 'active' && (
                  <Link href="/orders/new" className="btn-primary">
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Order</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className={`premium-card group hover:shadow-card-hover ${getJobCardGradient(order.editingLevel)}`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="text-caption font-bold text-charcoal flex-1 group-hover:text-brand transition-colors line-clamp-1">
                        {order.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-micro font-bold rounded-md whitespace-nowrap flex-shrink-0 ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    {order.description && (
                      <p className="text-body text-gray-400 mb-3 line-clamp-2">{order.description}</p>
                    )}
                    <div className="flex flex-wrap justify-between items-center gap-2 text-caption">
                      <span className="text-gray-400 truncate max-w-[60%]">
                        {user.role === 'CREATOR' ? (
                          order.status === 'OPEN' ? (
                            <span className="flex items-center text-blue-600 font-medium">
                              <Users className="w-3 h-3 mr-1" />
                              {order._count?.applications || 0} Applicants
                            </span>
                          ) : (
                            order.editor?.name || 'Unassigned'
                          )
                        ) : order.creator?.name}
                      </span>
                      {order.amount && (
                        <span className="font-bold text-brand whitespace-nowrap">₹{order.amount.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-micro text-gray-400">
                      <span>{order._count?.files || 0} files</span>
                      <span>{order._count?.messages || 0} comments</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <YouTubeConnectModal
        isOpen={showYouTubeConnectModal}
        onClose={() => setShowYouTubeConnectModal(false)}
      />

      <EditorProfileModal
        editorId={showProfileModal}
        onClose={() => setShowProfileModal(null)}
      />

      <CreatorHandbookModal
        isOpen={showHandbookModal}
        onClose={() => setShowHandbookModal(false)}
      />
    </div>
  )
}
