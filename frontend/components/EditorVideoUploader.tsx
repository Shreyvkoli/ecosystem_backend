'use client'

import { useState, useRef } from 'react'
import { filesApi } from '@/lib/api'
import { uploadFile } from '@/lib/upload'
import { getAuthToken } from '@/lib/auth'
import { useQueryClient } from '@tanstack/react-query'

interface EditorVideoUploaderProps {
  orderId: string
  fileType: 'PREVIEW_VIDEO' | 'FINAL_VIDEO'
  onUploadComplete?: () => void
}

export default function EditorVideoUploader({ orderId, fileType, onUploadComplete }: EditorVideoUploaderProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 80 * 1024 * 1024 * 1024) { // 80GB limit
        setError('File size must be less than 80GB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const result = await uploadFile({
        file,
        orderId,
        fileType,
        onProgress: (p) => setProgress(p.percentage),
        apiUrl: process.env.NEXT_PUBLIC_API_URL + '/files',
        token: getAuthToken() || undefined
      })

      if (result.success) {
        // Invalidate queries to refresh order data
        queryClient.invalidateQueries({ queryKey: ['order', orderId] })
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        setProgress(0)

        if (onUploadComplete) {
          onUploadComplete()
        }
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const displayName = fileType === 'PREVIEW_VIDEO' ? 'Preview' : 'Final'

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div className="text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={`${fileType}-upload`}
        />
        <label
          htmlFor={`${fileType}-upload`}
          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
        >
          {file ? file.name : `Select ${displayName} Video`}
        </label>

        {file && (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
            {!uploading && (
              <button
                onClick={handleUpload}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Upload {displayName} Video
              </button>
            )}
            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{progress}% uploaded</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

