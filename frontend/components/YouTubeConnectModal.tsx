'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { youtubeApi } from '@/lib/api'

interface YouTubeConnectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function YouTubeConnectModal({ isOpen, onClose }: YouTubeConnectModalProps) {
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const { data: youtubeStatus } = useQuery({
    queryKey: ['youtube-status'],
    queryFn: () => youtubeApi.getStatus(),
    enabled: isOpen,
    refetchInterval: isOpen ? 5000 : false,
  })

  // Keep existing mutation for reference or if reverted later, but unused for now in UI
  const connectMutation = useMutation({
    mutationFn: () => youtubeApi.getAuthUrl(),
    onSuccess: (response) => {
      window.location.href = response.data.authUrl
    },
    onError: (err: any) => {
      console.error('Failed to get YouTube auth URL:', err)
      alert(err?.response?.data?.error || err.message || 'Failed to connect YouTube. Please try again.')
    },
  })

  // New handler for suggestion submit
  const handleSubmit = () => {
    // In a real app, send this to backend. For now just show success.
    console.log('User suggestion:', suggestion)
    setIsSubmitted(true)
  }

  const handleConnect = () => {
    connectMutation.mutate()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Connect YouTube Channel</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {youtubeStatus?.data.connected ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-800 font-medium">YouTube Connected</p>
                <p className="text-green-600 text-sm">
                  Channel: {youtubeStatus.data.account?.channelTitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {!isSubmitted ? (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Coming Soon!</h3>
                  <p className="text-gray-600 mb-6">
                    We are bringing this feature in the next update. We'd love to hear your suggestions for improvements!
                  </p>
                </div>

                <div>
                  <label htmlFor="suggestion" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Suggestions
                  </label>
                  <textarea
                    id="suggestion"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 resize-none"
                    placeholder="Tell us what features you'd like to see..."
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                  />
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    Send Feedback
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-gray-600 mb-6">
                  We appreciate your feedback. We'll let you know when this feature is ready.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  )
}
