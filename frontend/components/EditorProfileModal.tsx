'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface EditorProfile {
  id: string
  name: string
  email: string
  bio?: string
  avatarUrl?: string
  rate?: number
  skills: string[]
  portfolio: string[]
  available: boolean
}

interface EditorProfileModalProps {
  editorId: string | null
  onClose: () => void
}

export default function EditorProfileModal({ editorId, onClose }: EditorProfileModalProps) {
  const [profile, setProfile] = useState<EditorProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editorId) return

    const fetchProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await api.get(`/users/${editorId}/profile`)
        setProfile(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [editorId])

  if (!editorId) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Editor Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading profile...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {profile && (
            <div className="space-y-6">
              {/* Header with Profile Photo */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-indigo-600 font-bold text-2xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{profile.name}</h3>
                  <p className="text-gray-600">{profile.email}</p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${profile.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {profile.available ? 'Available' : 'Unavailable'}
                    </span>
                    {profile.rate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        ₹{profile.rate.toLocaleString()}/project
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">About</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio with Profile Integration */}
              {profile.portfolio && profile.portfolio.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                    Portfolio
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Verified Editor ✓
                    </span>
                  </h4>
                  <div className="space-y-2">
                    {profile.portfolio.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {profile.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt={profile.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-indigo-600 font-bold text-xs">
                              {profile.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <a
                          href={item}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 underline"
                        >
                          {item}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
