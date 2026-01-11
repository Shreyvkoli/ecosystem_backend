'use client'

import { useEffect } from 'react'

// Legacy component shim: redirects to new Orders flow
export default function VideoPlayer({ videoId, projectId, onSeek }: any) {
  useEffect(() => {
    console.warn('VideoPlayer is legacy. Use OrderVideoPlayer with Orders API instead.')
  }, [])
  return (
    <div className="bg-black aspect-video flex items-center justify-center text-white rounded-lg">
      Legacy VideoPlayer not supported. Please use Orders flow.
    </div>
  )
}

