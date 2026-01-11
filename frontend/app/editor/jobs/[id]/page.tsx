'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import OrderVideoPlayer from '@/components/OrderVideoPlayer'
import EditorVideoUploader from '@/components/EditorVideoUploader'
import EditorDepositButton from '@/components/EditorDepositButton'
import Link from 'next/link'

export default function EditorJobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const user = getUser()
  const queryClient = useQueryClient()
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)

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

              {/* Video selection */}
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Order info */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3">Job Details</h3>
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
                  {order.amount && (
                    <p className="mt-2 font-medium">Budget: ₹{order.amount.toLocaleString()}</p>
                  )}
                </div>
              </div>

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
                  <h3 className="font-semibold mb-3">Upload Preview</h3>
                  <EditorVideoUploader
                    orderId={orderId}
                    fileType="PREVIEW_VIDEO"
                    onUploadComplete={() => {
                      handleSubmitPreview()
                    }}
                  />
                </div>
              )}

              {/* Upload revised preview */}
              {order.status === 'REVISION_REQUESTED' && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Upload Revised Preview</h3>
                  <p className="text-sm text-gray-600 mb-3">Creator requested changes. Upload the revised version.</p>
                  <EditorVideoUploader
                    orderId={orderId}
                    fileType="PREVIEW_VIDEO"
                    onUploadComplete={() => {
                      handleSubmitPreview()
                    }}
                  />
                </div>
              )}

              {/* Upload final video */}
              {order.status === 'IN_PROGRESS' && rawVideo && (
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold mb-3">Upload Final Video</h3>
                  <p className="text-sm text-gray-600 mb-3">Upload the final deliverable when ready.</p>
                  <EditorVideoUploader
                    orderId={orderId}
                    fileType="FINAL_VIDEO"
                    onUploadComplete={() => {
                      handleSubmitFinal()
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
                  <p className="text-sm text-green-800">
                    Final video has been delivered. Great work!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

