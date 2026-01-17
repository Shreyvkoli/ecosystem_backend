'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import OrderVideoPlayer, { OrderVideoPlayerRef } from '@/components/OrderVideoPlayer'
import LinkSubmission from '@/components/LinkSubmission'
import EditorToDoList from '@/components/EditorToDoList'
import EditorDepositButton from '@/components/EditorDepositButton'
import ChatRoom from '@/components/ChatRoom'
import ReviewModal from '@/components/ReviewModal'
import Link from 'next/link'
import { Download, Calendar, Clock, ExternalLink, FileText, X } from 'lucide-react'

export default function EditorJobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const user = getUser()
  const queryClient = useQueryClient()
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const playerRef = useRef<OrderVideoPlayerRef>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'EDITOR') {
      router.push('/dashboard')
    }
  }, [user, router])

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await ordersApi.get(orderId)
      return response.data
    },
    enabled: !!orderId && !!user,
    refetchInterval: 5000, // Poll every 5 seconds
  })

  // Get raw video files
  const { data: rawFiles } = useQuery({
    queryKey: ['raw-files', orderId],
    queryFn: async () => {
      const response = await ordersApi.getRawFiles(orderId)
      return response.data
    },
    enabled: !!orderId && !!user && user.role === 'EDITOR' && !!order && order.editorId === user.id,
  })

  // Get download URL for raw video
  const downloadRawVideo = async (fileId: string) => {
    try {
      const downloadResponse = await ordersApi.getRawFileDownloadUrl(orderId, fileId)
      // Open download URL in new tab
      window.open(downloadResponse.data.downloadUrl, '_blank')
    } catch (error: any) {
      console.error('Failed to get download URL:', error)
      alert('Failed to download file: ' + (error.response?.data?.error || 'Unknown error'))
    }
  }

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => ordersApi.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  const handleStartWork = () => {
    updateStatusMutation.mutate('IN_PROGRESS')
  }

  const handleSubmitPreview = () => {
    updateStatusMutation.mutate('PREVIEW_SUBMITTED')
  }

  const handleSubmitFinal = () => {
    updateStatusMutation.mutate('FINAL_SUBMITTED')
  }

  const rawVideo = rawFiles?.[0]
  const previewVideos = order?.files?.filter((f) => f.type === 'PREVIEW_VIDEO' && f.uploadStatus === 'completed').sort((a, b) => b.version - a.version)
  const latestPreview = previewVideos?.[0]
  const finalVideo = order?.files?.find((f) => f.type === 'FINAL_VIDEO' && f.uploadStatus === 'completed')

  const displayFile = selectedFileId
    ? order?.files?.find((f) => f.id === selectedFileId)
    : latestPreview || finalVideo || rawVideo

  const canEdit = user && user.role === 'EDITOR' && order?.editorId === user.id
  const depositRequired = Boolean((order as any)?.editorDepositRequired)
  const depositPaid = (order as any)?.editorDepositStatus === 'PAID'

  if (!user || user.role !== 'EDITOR') return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading job...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Job not found</p>
            <Link href="/editor/jobs" className="mt-4 text-indigo-600 hover:text-indigo-700">
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Access denied</p>
            <Link href="/editor/jobs" className="mt-4 text-indigo-600 hover:text-indigo-700">
              Back to Jobs
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
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <Link href="/editor/jobs" className="text-indigo-600 hover:text-indigo-700 text-sm mb-2 inline-block">
              ← Back to Jobs
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
                <>
                  <OrderVideoPlayer
                    ref={playerRef}
                    fileId={displayFile.id}
                    orderId={orderId}
                    fileName={displayFile.fileName}
                    publicLink={displayFile.publicLink}
                  />

                  {/* Editor To-Do List */}
                  {user.role === 'EDITOR' && (
                    <EditorToDoList
                      orderId={orderId}
                      fileId={displayFile.id}
                      onSeek={(time: number) => playerRef.current?.seekTo(time)}
                    />
                  )}
                </>
              ) : (
                <div className="bg-black aspect-video flex items-center justify-center text-white rounded-lg">
                  <p>No video available</p>
                </div>
              )}

              {/* Video selection */}
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order info */}
              {/* Order info */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Job Details</h3>
                  <button
                    onClick={() => setShowDetailsModal(true)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                  >
                    View All <FileText className="w-3 h-3 ml-1" />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 block text-xs">Deadline</span>
                    <span className={`font-medium ${order.deadline ? 'text-red-600' : 'text-gray-700'}`}>
                      {order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No deadline'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-xs">Creator</span>
                    <span className="text-gray-900 font-medium">{order.creator?.name}</span>
                  </div>

                  {order.amount && (
                    <div>
                      <span className="text-gray-500 block text-xs">Budget</span>
                      <span className="font-bold text-gray-900">₹{order.amount.toLocaleString()}</span>
                    </div>
                  )}

                  {order.description && (
                    <div>
                      <span className="text-gray-500 block text-xs">Description</span>
                      <p className="text-gray-600 line-clamp-3">{order.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Room */}
              <ChatRoom
                orderId={orderId}
                currentUser={user}
                recipientName={order.creator?.name}
              />

              {/* Download raw video */}
              {(
                order.status === 'ASSIGNED' ||
                order.status === 'IN_PROGRESS' ||
                order.status === 'PREVIEW_SUBMITTED' ||
                order.status === 'REVISION_REQUESTED' ||
                order.status === 'FINAL_SUBMITTED'
              ) && rawVideo && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold mb-3">Raw Video</h3>
                    <p className="text-sm text-gray-600 mb-3">{rawVideo.fileName}</p>
                    <button
                      onClick={() => downloadRawVideo(rawVideo.id)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Download Raw Video
                    </button>
                  </div>
                )}

              {/* Start work button */}
              {order.status === 'ASSIGNED' && (
                <div className="bg-white rounded-lg shadow p-4">
                  {depositRequired && !depositPaid && (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Security deposit required before starting work.
                      </p>
                      <EditorDepositButton
                        orderId={orderId}
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                          queryClient.invalidateQueries({ queryKey: ['orders'] })
                        }}
                      />
                    </div>
                  )}
                  <button
                    onClick={handleStartWork}
                    disabled={updateStatusMutation.isPending || (depositRequired && !depositPaid)}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {updateStatusMutation.isPending ? 'Starting...' : 'Start Working'}
                  </button>
                </div>
              )}

              {/* Upload preview */}
              {order.status === 'IN_PROGRESS' && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Submit Preview Link</h3>
                  <p className="text-sm text-gray-600 mb-3">Upload your video to your Cloud Storage and paste the shareable link here.</p>
                  <LinkSubmission
                    orderId={orderId}
                    fileType="PREVIEW_VIDEO"
                    onSuccess={() => {
                      handleSubmitPreview()
                      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                    }}
                  />
                </div>
              )}

              {/* Upload revised preview */}
              {order.status === 'REVISION_REQUESTED' && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Submit Revised Preview Link</h3>
                  <p className="text-sm text-gray-600 mb-3">Creator requested changes. Paste the new link.</p>
                  <LinkSubmission
                    orderId={orderId}
                    fileType="PREVIEW_VIDEO"
                    onSuccess={() => {
                      handleSubmitPreview()
                      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                    }}
                  />
                </div>
              )}

              {/* Upload final video */}
              {order.status === 'IN_PROGRESS' && rawVideo && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Submit Final Video Link</h3>
                  <p className="text-sm text-gray-600 mb-3">Paste the final delivery link.</p>
                  <LinkSubmission
                    orderId={orderId}
                    fileType="FINAL_VIDEO"
                    onSuccess={() => {
                      handleSubmitFinal()
                      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
                    }}
                  />
                </div>
              )}

              {/* Status info */}
              {order.status === 'PREVIEW_SUBMITTED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Awaiting Review</h3>
                  <p className="text-sm text-blue-800">
                    Your preview has been submitted. Waiting for creator to review.
                  </p>
                </div>
              )}

              {order.status === 'FINAL_SUBMITTED' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Final Submitted</h3>
                  <p className="text-sm text-blue-800">
                    Final video has been submitted. Waiting for creator to mark the order complete.
                  </p>
                </div>
              )}

              {order.status === 'COMPLETED' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">Job Completed</h3>
                  <p className="text-sm text-green-800 mb-3">
                    Final video has been delivered. Great work!
                  </p>
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Rate Creator
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          orderId={orderId}
          revieweeName={order.creator?.name}
        />

        {/* Full Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-xl font-bold text-gray-900">Job Requirements</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Header Info */}
                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Deadline</span>
                    <div className="flex items-center text-red-600 font-bold mt-1">
                      <Calendar className="w-4 h-4 mr-2" />
                      {order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Flexible'}
                    </div>
                  </div>
                  <div className="w-px bg-gray-200 h-10 hidden sm:block"></div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Budget</span>
                    <div className="text-gray-900 font-bold mt-1">
                      ₹{order.amount?.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-px bg-gray-200 h-10 hidden sm:block"></div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Level</span>
                    <div className="text-indigo-600 font-bold mt-1">
                      {order.editingLevel || 'Basic'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Description</h3>
                  <div className="text-gray-700 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
                    {order.description || 'No description provided.'}
                  </div>
                </div>

                {/* Brief */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Editing Brief
                  </h3>
                  <div className="text-gray-700 bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                    {order.brief || 'No specific brief provided.'}
                  </div>
                </div>

                {/* Durations */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block mb-1">Raw Footage</span>
                    <div className="flex items-center text-gray-900 font-medium">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {order.rawFootageDuration ? `${order.rawFootageDuration} mins` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block mb-1">Expected Duration</span>
                    <div className="flex items-center text-gray-900 font-medium">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {order.expectedDuration ? `${order.expectedDuration} mins` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Reference Link */}
                {order.referenceLink && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Reference</h3>
                    <a
                      href={order.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      <span className="truncate">{order.referenceLink}</span>
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

