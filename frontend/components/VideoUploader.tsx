'use client'

import { useEffect } from 'react'

// Legacy component shim: redirects to new Orders flow
export default function VideoUploader({ projectId, type, onUploadComplete }: any) {
  useEffect(() => {
    console.warn('VideoUploader is legacy. Use RawVideoUploader or EditorVideoUploader with Orders API instead.')
  }, [])
  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
      Legacy VideoUploader not supported. Please use Orders flow.
    </div>
  )
}

