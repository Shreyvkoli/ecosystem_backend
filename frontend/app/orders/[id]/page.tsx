'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, youtubeApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import OrderVideoPlayer from '@/components/OrderVideoPlayer'
import RawVideoUploader from '@/components/RawVideoUploader'
import PaymentButton from '@/components/PaymentButton'
import EditorProfileModal from '@/components/EditorProfileModal'
import Timeline from '@/components/Timeline'
import YouTubeConnectModal from '@/components/YouTubeConnectModal'
import YouTubeUploadModal from '@/components/YouTubeUploadModal'
import Link from 'next/link'

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const user = getUser()
  const queryClient = useQueryClient()
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [showProfileModal, setShowProfileModal] = useState<string | null>(null)
  const [showYouTubeConnectModal, setShowYouTubeConnectModal] = useState(false)
  const [showYouTubeUploadModal, setShowYouTubeUploadModal] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await ordersApi.get(orderId)
      return response.data
    },
    enabled: !!orderId && !!user,
    refetchInterval: 5000, // Poll every 5 seconds for updates
  })

  const approveMutation = useMutation({
    mutationFn: () => ordersApi.approve(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const revisionMutation = useMutation({
    mutationFn: () => ordersApi.requestRevision(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const completeMutation = useMutation({
    mutationFn: () => ordersApi.updateStatus(orderId, 'COMPLETED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const { data: applications } = useQuery({
    queryKey: ['applications', orderId],
    queryFn: async () => (await ordersApi.listApplications(orderId)).data,
    enabled: !!orderId && !!user && user.role === 'CREATOR',
    refetchInterval: 5000,
  })

  const approveEditorMutation = useMutation({
    mutationFn: (applicationId: string) => ordersApi.approveEditor(orderId, applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'available'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['applications', orderId] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to approve editor')
    },
  })

  // Get editor profile data
  const { data: editorProfiles } = useQuery({
    queryKey: ['editor-profiles'],
    queryFn: async () => {
      const response = await fetch('/api/users/editors/profiles')
      return response.json()
    },
    enabled: !!user && user.role === 'CREATOR',
  })

  // Get submissions (preview/final videos)
  const { data: submissions } = useQuery({
    queryKey: ['submissions', orderId],
    queryFn: async () => {
      const response = await ordersApi.getSubmissions(orderId)
      return response.data
    },
    enabled: !!orderId && !!user && user.role === 'CREATOR',
  })

  const { data: youtubeStatus } = useQuery({
    queryKey: ['youtube-status'],
    queryFn: () => youtubeApi.getStatus(),
    enabled: !!user && user.role === 'CREATOR',
  })

  const rawVideo = order?.files?.find((f) => f.type === 'RAW_VIDEO' && f.uploadStatus === 'completed')
  const previewVideos = submissions?.filter((f) => f.type === 'PREVIEW_VIDEO').sort((a, b) => b.version - a.version)
  const latestPreview = previewVideos?.[0]
  const finalVideo = submissions?.find((f) => f.type === 'FINAL_VIDEO')

  const displayFile = selectedFileId 
    ? order?.files?.find((f) => f.id === selectedFileId)
    : latestPreview || finalVideo

  const canEdit = user && (
    (user.role === 'CREATOR' && order?.creatorId === user.id) ||
    user.role === 'ADMIN'
  )

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar lightTheme={true} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading order...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar lightTheme={true} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Order not found</p>
            <Link href="/dashboard" className="mt-4 text-indigo-600 hover:text-indigo-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar lightTheme={true} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Access denied</p>
            <Link href="/dashboard" className="mt-4 text-indigo-600 hover:text-indigo-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-gray-100 text-gray-800',
      APPLIED: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      PREVIEW_SUBMITTED: 'bg-orange-100 text-orange-800',
      REVISION_REQUESTED: 'bg-red-100 text-red-800',
      FINAL_SUBMITTED: 'bg-indigo-100 text-indigo-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-emerald-100 text-emerald-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar lightTheme={true} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{order.title}</h1>
                <div className="mt-2 flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  {order.amount && (
                    <span className="text-sm text-gray-600">₹{order.amount.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main video area */}
            <div className="lg:col-span-2 space-y-6">
              {displayFile ? (
                <OrderVideoPlayer
                  fileId={displayFile.id}
                  orderId={orderId}
                  fileName={displayFile.fileName}
                />
              ) : (
                <div className="bg-black aspect-video flex items-center justify-center text-white rounded-lg">
                  <p>No video available</p>
                </div>
              )}

              {/* Video selection (if multiple previews) */}
              {previewVideos && previewVideos.length > 1 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-2">Preview Versions</h3>
                  <div className="space-y-2">
                    {previewVideos.map((video) => (
                      <button
                        key={video.id}
                        onClick={() => setSelectedFileId(video.id)}
                        className={`w-full text-left px-3 py-2 rounded border ${
                          selectedFileId === video.id || (!selectedFileId && video.id === latestPreview?.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Preview v{video.version} - {new Date(video.createdAt).toLocaleDateString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Editor Applications - Show only when no editor assigned */}
              {user.role === 'CREATOR' && (order.status === 'OPEN' || order.status === 'APPLIED') && !order.editorId && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Editor Applications</h3>
                  {!applications || applications.length === 0 ? (
                    <p className="text-sm text-gray-600">No applications yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div key={app.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* Editor Profile Photo */}
                              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                {app.editor?.editorProfile?.avatarUrl ? (
                                  <img
                                    src={app.editor.editorProfile.avatarUrl}
                                    alt={app.editor.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-indigo-600 font-bold text-lg">
                                    {app.editor?.name?.charAt(0).toUpperCase() || 'E'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{app.editor?.name || 'Editor'}</div>
                                <div className="text-xs text-gray-500">{app.editor?.email}</div>
                                <div className="text-xs text-gray-500">Deposit: ₹{Number(app.depositAmount || 0).toLocaleString()}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setShowProfileModal(app.editorId)}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                              >
                                View Profile
                              </button>
                              <span className="text-xs text-gray-600">{app.status}</span>
                              {(order.status === 'OPEN' || order.status === 'APPLIED') && app.status === 'APPLIED' && (
                                <button
                                  onClick={() => approveEditorMutation.mutate(app.id)}
                                  disabled={approveEditorMutation.isPending}
                                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-sm"
                                >
                                  {approveEditorMutation.isPending ? 'Approving...' : 'Approve'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Project Timeline - Show when editor is assigned */}
              {user.role === 'CREATOR' && order.editorId && (
                <Timeline order={order} />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order info */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3">Order Details</h3>
                {order.description && (
                  <p className="text-sm text-gray-600 mb-3">{order.description}</p>
                )}
                {order.brief && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Brief:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.brief}</p>
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <p>Creator: {order.creator?.name}</p>
                  {order.editor && <p>Editor: {order.editor.name}</p>}
                </div>
              </div>

              {/* Upload raw video */}
              {user.role === 'CREATOR' && !rawVideo && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Upload Raw Video</h3>
                  <RawVideoUploader
                    orderId={orderId}
                    onUploadComplete={() => {
                      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                    }}
                  />
                </div>
              )}

              {/* Review actions */}
              {user.role === 'CREATOR' && order.status === 'PREVIEW_SUBMITTED' && latestPreview && (
                <div className="bg-white rounded-lg shadow p-4 space-y-3">
                  <h3 className="font-semibold">Preview Review</h3>
                  <button
                    onClick={() => approveMutation.mutate()}
                    disabled={approveMutation.isPending}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {approveMutation.isPending ? 'Approving...' : 'Approve Preview'}
                  </button>
                  <button
                    onClick={() => revisionMutation.mutate()}
                    disabled={revisionMutation.isPending}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                  >
                    {revisionMutation.isPending ? 'Requesting...' : 'Request Revision'}
                  </button>
                </div>
              )}

              {user.role === 'CREATOR' && order.status === 'FINAL_SUBMITTED' && (
                <div className="bg-white rounded-lg shadow p-4 space-y-3">
                  <h3 className="font-semibold">Final Delivery</h3>
                  {finalVideo && (
                    <>
                      {youtubeStatus?.data.connected ? (
                        <button
                          onClick={() => setShowYouTubeUploadModal(true)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          Upload to YouTube
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowYouTubeConnectModal(true)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                          Connect YouTube & Upload
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    {completeMutation.isPending ? 'Completing...' : 'Mark Completed'}
                  </button>
                </div>
              )}

              {/* YouTube Video Info */}
              {order.youtubeVideoUrl && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">YouTube Video</h3>
                  <a
                    href={order.youtubeVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-red-600 hover:text-red-700 underline mb-2"
                  >
                    {order.youtubeVideoUrl}
                  </a>
                  {order.publishedAt && (
                    <p className="text-sm text-gray-600">
                      Published on {new Date(order.publishedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {/* Payment */}
              {user.role === 'CREATOR' && order.amount && order.amount > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Payment</h3>
                  <PaymentButton
                    orderId={orderId}
                    amount={order.amount}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Profile Modal */}
      <EditorProfileModal
        editorId={showProfileModal}
        onClose={() => setShowProfileModal(null)}
      />

      {/* YouTube Connect Modal */}
      <YouTubeConnectModal
        isOpen={showYouTubeConnectModal}
        onClose={() => setShowYouTubeConnectModal(false)}
      />

      {/* YouTube Upload Modal */}
      <YouTubeUploadModal
        isOpen={showYouTubeUploadModal}
        onClose={() => setShowYouTubeUploadModal(false)}
        orderId={orderId}
        orderTitle={order.title}
      />
    </div>
  )
}

