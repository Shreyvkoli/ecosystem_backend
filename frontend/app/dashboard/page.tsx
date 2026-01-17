'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, youtubeApi, usersApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import YouTubeConnectModal from '@/components/YouTubeConnectModal'
import EditorProfileModal from '@/components/EditorProfileModal'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const user = getUser()
  const [showYouTubeConnectModal, setShowYouTubeConnectModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('active')
  const queryClient = useQueryClient()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user) {
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
      OPEN: 'bg-gray-100 text-gray-700 border border-gray-300',
      APPLIED: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      ASSIGNED: 'bg-blue-100 text-blue-700 border border-blue-300',
      IN_PROGRESS: 'bg-purple-100 text-purple-700 border border-purple-300',
      PREVIEW_SUBMITTED: 'bg-orange-100 text-orange-700 border border-orange-300',
      REVISION_REQUESTED: 'bg-red-100 text-red-700 border border-red-300',
      FINAL_SUBMITTED: 'bg-indigo-100 text-indigo-700 border border-indigo-300',
      PUBLISHED: 'bg-green-100 text-green-700 border border-green-300',
      COMPLETED: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
      CANCELLED: 'bg-gray-100 text-gray-700 border border-gray-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-300'
  }

  if (!user) return null

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent floating-animation">
                  Creator Dashboard
                </span>
              </h1>
              <p className="text-gray-700">Manage your video editing orders</p>
            </div>
            <div className="flex space-x-3">
              {user.role === 'CREATOR' && (
                <>
                  {youtubeStatus?.data.connected ? (
                    <div className="flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg border border-green-300">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      YouTube Connected
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowYouTubeConnectModal(true)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      Connect YouTube
                    </button>
                  )}
                  <Link
                    href="/orders/new"
                    className="premium-button flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Order</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'active'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Active Orders
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              History
            </button>
            {user.role === 'CREATOR' && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'saved'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Saved Editors
              </button>
            )}
          </div>

          {activeTab === 'saved' ? (
            isLoadingEditors ? (
              <div className="glass-morphism p-12 text-center">
                <p className="text-gray-700">Loading saved editors...</p>
              </div>
            ) : !savedEditors || savedEditors.length === 0 ? (
              <div className="glass-morphism p-12 text-center">
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved editors yet</h3>
                <p className="text-gray-700 mb-6">Save editors from your past orders to easily find them again.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {savedEditors.map((editor: any) => (
                  <div key={editor.id} className="premium-card group hover:scale-105 transition-all duration-300 relative">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {editor.avatarUrl ? (
                          <img src={editor.avatarUrl} alt={editor.name} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <span className="text-indigo-600 font-bold text-xl">{editor.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 truncate">{editor.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{editor.email}</p>
                      </div>
                    </div>

                    {editor.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {editor.skills.slice(0, 3).map((skill: string) => (
                          <span key={skill} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                        {editor.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-full">+{editor.skills.length - 3}</span>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setShowProfileModal(editor.id)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove ${editor.name} from saved list?`)) {
                            unsaveMutation.mutate(editor.id)
                          }
                        }}
                        disabled={unsaveMutation.isPending}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
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
              <div className="glass-morphism p-12 text-center">
                <p className="text-gray-700">Loading orders...</p>
              </div>
            ) : !filteredOrders || filteredOrders.length === 0 ? (
              <div className="glass-morphism p-12 text-center">
                <div className="mb-6">
                  {activeTab === 'active' ? (
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ) : (
                    <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No {activeTab} orders</h3>
                {activeTab === 'active' && <p className="text-gray-700 mb-6">Start by creating your first video editing order</p>}
                {user.role === 'CREATOR' && activeTab === 'active' && (
                  <Link
                    href="/orders/new"
                    className="premium-button inline-flex items-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Your First Order</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="premium-card group hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {order.title}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(order.status)} transition-all duration-300`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    {order.description && (
                      <p className="text-gray-700 mb-4 line-clamp-2 group-hover:text-gray-800 transition-colors">
                        {order.description}
                      </p>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {user.role === 'CREATOR' ? order.editor?.name || 'Unassigned' : order.creator?.name}
                      </span>
                      {order.amount && (
                        <span className="font-bold text-indigo-400">₹{order.amount.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-xs text-gray-600">
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
    </div>
  )
}
