
'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { kycApi } from '@/lib/api'
import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react'

interface KYCModalProps {
  isOpen: boolean
  onClose: () => void
  currentStatus?: string
}

export default function KYCModal({ isOpen, onClose, currentStatus }: KYCModalProps) {
  const [idUrl, setIdUrl] = useState('')
  const [selfieUrl, setSelfieUrl] = useState('')
  const queryClient = useQueryClient()

  const submitMutation = useMutation({
    mutationFn: () => kycApi.submit({ kycIdUrl: idUrl, kycSelfieUrl: selfieUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-profile'] })
      alert('KYC submitted for review!')
      onClose()
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to submit KYC')
    }
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-indigo-600 text-white">
          <h2 className="text-xl font-bold">Identity Verification (KYC)</h2>
          <button onClick={onClose} className="p-1 hover:bg-indigo-500 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {currentStatus === 'VERIFIED' ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">Verified!</h3>
              <p className="text-gray-600">Your identity is verified. You have full access to withdrawals.</p>
            </div>
          ) : currentStatus === 'PENDING' ? (
            <div className="text-center py-8">
                <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Review Pending</h3>
                <p className="text-gray-600">Admin is reviewing your documents. Please wait up to 24 hours.</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800">
                  To prevent ghosting and ensure reliability, we require 1-time identity verification. 
                  Upload your ID and a selfie to a personal Drive or Dropbox and share the link below.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">ID Proof Link (PAN/Aadhar/Passport)</label>
                  <input
                    type="url"
                    value={idUrl}
                    onChange={(e) => setIdUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Selfie with ID Link</label>
                  <input
                    type="url"
                    value={selfieUrl}
                    onChange={(e) => setSelfieUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  />
                </div>
              </div>

              <button
                onClick={() => submitMutation.mutate()}
                disabled={!idUrl || !selfieUrl || submitMutation.isPending}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center"
              >
                {submitMutation.isPending ? 'Submitting...' : 'Submit Documents'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Clock({ className, ...props }: any) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
