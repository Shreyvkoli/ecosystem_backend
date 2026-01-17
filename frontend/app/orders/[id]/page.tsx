'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, youtubeApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import OrderVideoPlayer from '@/components/OrderVideoPlayer'
// import RawVideoUploader from '@/components/RawVideoUploader' // Replaced
import LinkSubmission from '@/components/LinkSubmission'
import PaymentButton from '@/components/PaymentButton'
import EditorDepositButton from '@/components/EditorDepositButton'
import EditorProfileModal from '@/components/EditorProfileModal'
import Timeline from '@/components/Timeline'
import YouTubeConnectModal from '@/components/YouTubeConnectModal'
import YouTubeUploadModal from '@/components/YouTubeUploadModal'
import ChatRoom from '@/components/ChatRoom'
import ReviewModal from '@/components/ReviewModal'
import DisputeModal from '@/components/DisputeModal'
import Link from 'next/link'
import confetti from 'canvas-confetti'
import SaveEditorButton from '@/components/SaveEditorButton'

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
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [isEditingRaw, setIsEditingRaw] = useState(false)

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
    refetchInterval: 5000,
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
      setShowReviewModal(true)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => ordersApi.delete(orderId),
    onSuccess: () => {
      router.push('/dashboard')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to delete order')
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

  // Removed unused editorProfiles query

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

  // Sort files to get LATEST raw video
  const rawVideo = order?.files
    ?.filter((f) => f.type === 'RAW_VIDEO' && f.uploadStatus === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  const previewVideos = submissions?.filter((f) => f.type === 'PREVIEW_VIDEO').sort((a, b) => b.version - a.version)
  const latestPreview = previewVideos?.[0]
  const finalVideo = submissions?.find((f) => f.type === 'FINAL_VIDEO')

  const displayFile = selectedFileId
    ? order?.files?.find((f) => f.id === selectedFileId)
    : latestPreview || finalVideo || rawVideo

  // Confetti Logic for Editor on Approval (Moved here to access 'order')
  useEffect(() => {
    if (user?.role === 'EDITOR' && order?.status === 'IN_PROGRESS') {
      const hasPreview = order.files?.some((f) => f.type === 'PREVIEW_VIDEO');
      if (hasPreview) {
        const key = `confetti-seen-${orderId}-v2`;
        if (!localStorage.getItem(key)) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
          localStorage.setItem(key, 'true');
        }
      }
    }
  }, [user, order?.status, order?.files, orderId])

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
      DISPUTED: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar lightTheme={true} />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            {user.role === 'CREATOR' && order.status === 'IN_PROGRESS' && order.files?.some((f) => f.type === 'PREVIEW_VIDEO') && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6 flex items-center shadow-sm">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <span className="font-semibold">Status Update:</span> Preview is approved. Waiting for the editor to send the final video link.
                </div>
              </div>
            )}
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
            <div id="main-video-player" className="lg:col-span-2 space-y-6">
              {displayFile ? (
                <OrderVideoPlayer
                  fileId={displayFile.id}
                  orderId={orderId}
                  fileName={displayFile.fileName}
                  publicLink={displayFile.publicLink}
                  provider={displayFile.provider}
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
                        className={`w-full text-left px-3 py-2 rounded border ${selectedFileId === video.id || (!selectedFileId && video.id === latestPreview?.id)
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
              {/* Chat Room */}
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

                {user.role === 'CREATOR' && (order.status === 'OPEN' || order.status === 'APPLIED') && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this order? This cannot be undone.')) {
                          deleteMutation.mutate()
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center transition-colors w-full justify-center sm:justify-start"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete Order'}
                    </button>
                  </div>
                )}
              </div>

              {/* Editor Workspace */}
              {user.role === 'EDITOR' && order.editorId === user.id && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-4">Editor Workspace</h3>

                  {order.editorDepositRequired && order.editorDepositStatus === 'PENDING' ? (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-3">
                        Security deposit required to start work.
                      </p>
                      <EditorDepositButton
                        orderId={orderId}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(order.status === 'ASSIGNED' || order.status === 'IN_PROGRESS' || order.status === 'REVISION_REQUESTED') && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Submit Preview (Watermarked)</h4>
                          <p className="text-xs text-gray-500 mb-2">Upload a **WATERMARKED** draft or low-res version for review. Do not upload the clean final version yet.</p>
                          <LinkSubmission
                            orderId={orderId}
                            fileType="PREVIEW_VIDEO"
                            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['order', orderId] })}
                          />
                        </div>
                      )}

                      {/* Only show Final Submission if In Progress AND a Preview exists (Approved) */}
                      {order.status === 'IN_PROGRESS' && latestPreview && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Submit Final Delivery (Clean)</h4>
                          <p className="text-xs text-gray-500 mb-2">Upload the final **CLEAN (Watermark-free)** video for delivery.</p>
                          <LinkSubmission
                            orderId={orderId}
                            fileType="FINAL_VIDEO"
                            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['order', orderId] })}
                          />
                        </div>
                      )}

                      {order.status === 'PREVIEW_SUBMITTED' && (
                        <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded">
                          Preview submitted. Waiting for feedback.
                        </div>
                      )}

                      {order.status === 'FINAL_SUBMITTED' && (
                        <div className="p-3 bg-green-50 text-green-800 text-sm rounded">
                          Final submitted. Waiting for completion.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chat Room */}
              <ChatRoom
                orderId={orderId}
                currentUser={user}
                recipientName={user.role === 'CREATOR' ? order.editor?.name : order.creator?.name}
              />

              {/* Upload raw video */}

              {/* Upload raw video */}
              {user.role === 'CREATOR' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">{rawVideo ? 'Raw Video Link' : 'Submit Raw Video Link'}</h3>
                    {rawVideo && !isEditingRaw && (
                      <button
                        onClick={() => setIsEditingRaw(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                      >
                        Change Link
                      </button>
                    )}
                  </div>

                  {(!rawVideo || isEditingRaw) ? (
                    <>
                      <p className="text-sm text-gray-600 mb-3">
                        {rawVideo ? 'Update the raw footage link.' : 'Paste the link to your raw footage (Google Drive/Dropbox/YouTube).'}
                        Ensure "Anyone with the link" access is ON.
                      </p>
                      <LinkSubmission
                        orderId={orderId}
                        fileType="RAW_VIDEO"
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                          setIsEditingRaw(false)
                        }}
                      />
                      {isEditingRaw && (
                        <button
                          onClick={() => setIsEditingRaw(false)}
                          className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 p-3 rounded text-sm break-all">
                      <a href={rawVideo.publicLink || '#'} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                        {rawVideo.publicLink || 'View Video'}
                      </a>
                      <p className="text-xs text-gray-500 mt-1">Uploaded {new Date(rawVideo.createdAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Review actions */}
              {user.role === 'CREATOR' && order.status === 'PREVIEW_SUBMITTED' && (
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
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm font-medium mt-2"
                  >
                    Raise Quality Dispute
                  </button>
                </div>
              )}

              {/* Creator: Dispute during revision request if unsatisfied */}
              {user.role === 'CREATOR' && order.status === 'REVISION_REQUESTED' && (
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Trouble with revisions?</h3>
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 text-sm font-medium"
                  >
                    Raise Quality Dispute
                  </button>
                </div>
              )}

              {/* Editor: Dispute for Ghosting if In Progress or Preview Submitted */}
              {user.role === 'EDITOR' && (order.status === 'IN_PROGRESS' || order.status === 'PREVIEW_SUBMITTED') && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setShowDisputeModal(true)}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Report Issue / Ghosting
                  </button>
                </div>
              )}

              {user.role === 'CREATOR' && (order.status === 'FINAL_SUBMITTED' || order.status === 'COMPLETED') && (
                <div className="bg-white rounded-lg shadow p-4 space-y-3">
                  <h3 className="font-semibold">{order.status === 'COMPLETED' ? 'Final Assets' : 'Final Delivery'}</h3>
                  {finalVideo && (
                    <>
                      {/* Download Button */}
                      <a
                        href={finalVideo.publicLink || '#'}
                        target="_blank"
                        download
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center justify-center font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Final Video
                      </a>

                      {youtubeStatus?.data.connected ? (
                        <button
                          onClick={() => setShowYouTubeUploadModal(true)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                          Upload to YouTube
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowYouTubeConnectModal(true)}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                          </svg>
                          Connect YouTube & Upload
                        </button>
                      )}
                    </>
                  )}
                  {order.status !== 'COMPLETED' && (
                    <button
                      onClick={() => completeMutation.mutate()}
                      disabled={completeMutation.isPending}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {completeMutation.isPending ? 'Completing...' : 'Mark Completed'}
                    </button>
                  )}
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

              {/* Editor Profile */}
              {order.editor && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Editor Profile</h3>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-lg">
                        {order.editor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{order.editor.name}</div>
                      <div className="text-sm text-gray-500">{order.editor.email}</div>
                    </div>
                  </div>

                  {user.role === 'CREATOR' && (
                    <SaveEditorButton editorId={order.editorId!} />
                  )}

                  <button
                    onClick={() => setShowProfileModal(order.editorId!)}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    View Full Profile
                  </button>
                </div>
              )}

              {/* Payment */}
              {order.status === 'COMPLETED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-900 mb-2">Job Completed</h3>
                  <p className="text-sm text-green-800 mb-3">
                    This order is complete.
                  </p>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm mb-2"
                  >
                    Rate Editor
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                        const token = document.cookie.match(/token=([^;]+)/)?.[1];
                        const res = await fetch(`${apiUrl}/invoices/order/${orderId}`, {
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (!res.ok) throw new Error('Failed to fetch invoice');
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Invoice-${orderId.slice(0, 8)}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      } catch (err) {
                        alert('Failed to download invoice');
                      }
                    }}
                    className="w-full px-4 py-2 bg-white border border-green-600 text-green-600 rounded hover:bg-green-50 text-sm"
                  >
                    Download Invoice
                  </button>
                </div>
              )}

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

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        orderId={orderId}
        revieweeName={order.editor?.name}
      />

      {/* Dispute Modal */}
      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        orderId={orderId}
      />
    </div>
  )
}

