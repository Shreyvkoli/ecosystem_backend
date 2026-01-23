'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import dynamic from 'next/dynamic'
import { filesApi, messagesApi, Message } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

export interface OrderVideoPlayerRef {
  seekTo: (seconds: number) => void
}


interface OrderVideoPlayerProps {
  fileId: string
  orderId: string
  fileName: string
  publicLink?: string
  provider?: string
}

const OrderVideoPlayer = forwardRef<OrderVideoPlayerRef, OrderVideoPlayerProps>(
  ({ fileId, orderId, fileName, publicLink, provider }, ref) => {
    // Always use Backend Proxy for consistency and CORS handling (Zero Storage "Permanent Fix")
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Use Direct Link for YouTube OR standard Direct Links (MP4s) to avoid Proxy overhead/issues
    const shouldUseDirectLink =
      provider === 'YOUTUBE' ||
      provider === 'DirectLink' ||
      (publicLink && (publicLink.includes('youtube.com') || publicLink.includes('youtu.be') || publicLink.match(/\.(mp4|mov|mkv)$/i)));

    const viewUrl = shouldUseDirectLink && publicLink
      ? publicLink
      : (fileId ? `${apiUrl}/videos/${fileId}/stream` : '');

    const [playing, setPlaying] = useState(false)
    const [played, setPlayed] = useState(0)
    const [duration, setDuration] = useState(0)
    const [commentText, setCommentText] = useState('')
    const [commentTimestamp, setCommentTimestamp] = useState(0)
    const [showCommentForm, setShowCommentForm] = useState(false)

    // Internal ref for ReactPlayer
    const internalPlayerRef = useRef<any>(null)
    const user = getUser()
    const queryClient = useQueryClient()

    // Expose seekTo via ref
    useImperativeHandle(ref, () => ({
      seekTo: (seconds: number) => {
        if (internalPlayerRef.current) {
          internalPlayerRef.current.seekTo(seconds, 'seconds')
          setCommentTimestamp(seconds)
          setPlaying(true)
        }
      }
    }))

    // Get messages/comments
    const { data: messages } = useQuery({
      queryKey: ['messages', orderId, fileId],
      queryFn: async () => {
        const response = await messagesApi.listByFile(fileId)
        return response.data
      },
      enabled: !!fileId && !!orderId,
      refetchInterval: 5000, // Poll every 5 seconds
    })

    const createCommentMutation = useMutation({
      mutationFn: (data: {
        orderId: string
        fileId?: string
        content: string
        timestamp?: number
      }) => messagesApi.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['messages', orderId] })
        setCommentText('')
        setShowCommentForm(false)
      },
    })

    const handleProgress = (state: { played: number; playedSeconds: number }) => {
      setPlayed(state.played)
      setCommentTimestamp(state.playedSeconds)
    }

    const handleSeek = (seconds: number) => {
      if (internalPlayerRef.current && typeof internalPlayerRef.current.seekTo === 'function') {
        internalPlayerRef.current.seekTo(seconds, 'seconds')
        setCommentTimestamp(seconds)
        setPlaying(true) // Auto-play when seeking via button/timestamp
      } else {
        // Fallback or retry?
        console.warn('Player ref not ready yet');
      }
    }

    const handleAddComment = () => {
      if (!commentText.trim()) return

      createCommentMutation.mutate({
        orderId,
        fileId,
        content: commentText,
        timestamp: commentTimestamp,
      })
    }

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!viewUrl) {
      return (
        <div className="bg-black aspect-video flex items-center justify-center text-white rounded-lg">
          <p>Loading video...</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div
          className="bg-black rounded-lg overflow-hidden relative aspect-video group"
          onContextMenu={(e) => e.preventDefault()} // Disable right click
        >
          {/* Watermark Overlay for Previews */}
          {fileName?.toLowerCase().includes('preview') && (
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center overflow-hidden">
              <div className="transform -rotate-12 text-white opacity-20 text-4xl sm:text-6xl md:text-8xl font-black whitespace-nowrap select-none">
                PREVIEW ONLY • CUTFLOW • PREVIEW ONLY
              </div>
              <div className="absolute inset-0 bg-repeat opacity-10" style={{ backgroundImage: 'linear-gradient(45deg, transparent 25%, white 25%, white 50%, transparent 50%, transparent 75%, white 75%, white 100%)', backgroundSize: '20px 20px' }}></div>
            </div>
          )}

          <ReactPlayer
            ref={internalPlayerRef}
            url={viewUrl}
            playing={playing}
            controls
            width="100%"
            height="100%"
            onProgress={handleProgress}
            onDuration={setDuration}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload', // Hide download button in native player
                  disablePictureInPicture: true,
                },
              },
            }}
          />
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Comments</h3>
            <button
              onClick={() => setShowCommentForm(!showCommentForm)}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Add Comment at {formatTime(commentTimestamp)}
            </button>
          </div>

          {showCommentForm && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Enter your comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
              />
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowCommentForm(false)
                    setCommentText('')
                  }}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddComment}
                  disabled={createCommentMutation.isPending || !commentText.trim()}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages && messages.length > 0 ? (
              messages.map((message: Message) => (
                <div
                  key={message.id}
                  className="border-b border-gray-200 pb-3 last:border-0"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{message.user?.name}</span>
                        {message.timestamp !== null && message.timestamp !== undefined && (
                          <button
                            onClick={() => handleSeek(message.timestamp!)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                          >
                            {formatTime(message.timestamp)}
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{message.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {message.timestamp !== null && message.timestamp !== undefined ? (
                      <button
                        onClick={() => handleSeek(message.timestamp!)}
                        className={`px-2 py-1 text-xs rounded transition-all hover:scale-105 ${message.resolved
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer'
                          }`}
                        title={message.resolved ? 'Resolved' : `Jump to ${formatTime(message.timestamp)}`}
                      >
                        {message.resolved ? 'Resolved' : 'Open'}
                      </button>
                    ) : (
                      <span className={`px-2 py-1 text-xs rounded ${message.resolved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {message.resolved ? 'Resolved' : 'Open'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
            )}
          </div>
        </div>
      </div>
    )
  }
)

OrderVideoPlayer.displayName = 'OrderVideoPlayer'

export default OrderVideoPlayer
