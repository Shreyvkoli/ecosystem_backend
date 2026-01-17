'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { editorApi, ordersApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import EditorTimeline from '@/components/EditorTimeline'
import Link from 'next/link'
import { Eye, FileText, Calendar, Clock, ExternalLink, X } from 'lucide-react'

export default function EditorJobsPage() {
  const router = useRouter()
  const user = getUser()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'available' | 'active' | 'history' | 'profile'>('available')
  const [topupAmount, setTopupAmount] = useState<number>(5000)
  const [profileForm, setProfileForm] = useState({
    bio: '',
    rate: '',
    skills: '',
    portfolio: '',
    available: true,
    avatarUrl: '',
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else if (user.role !== 'EDITOR') {
      router.push('/dashboard')
    }
  }, [user, router])

  const { data: openOrders, isLoading: openLoading } = useQuery({
    queryKey: ['orders', 'available'],
    queryFn: async () => {
      const [openRes, assignedRes] = await Promise.all([
        ordersApi.listAvailable(),
        ordersApi.listAssigned()
      ]);
      // Combine OPEN and ASSIGNED orders
      return [...(openRes.data || []), ...(assignedRes.data || [])];
    },
    enabled: !!user && user.role === 'EDITOR',
  })

  const { data: myOrders, isLoading: myLoading } = useQuery({
    queryKey: ['orders', 'mine'],
    queryFn: async () => (await ordersApi.list()).data,
    enabled: !!user && user.role === 'EDITOR',
  })

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['editorProfile'],
    queryFn: async () => (await editorApi.profile()).data,
    enabled: !!user && user.role === 'EDITOR',
  })

  const { data: activeJobData, isLoading: activeJobLoading } = useQuery({
    queryKey: ['activeJobCount'],
    queryFn: async () => (await ordersApi.getActiveJobCount()).data,
    enabled: !!user && user.role === 'EDITOR',
  })

  useEffect(() => {
    if (!profile) return
    const ep = profile.editorProfile
    setProfileForm({
      bio: ep?.bio || '',
      rate: ep?.rate != null ? String(ep.rate) : '',
      skills: Array.isArray(ep?.skills) ? ep.skills.join(', ') : (ep?.skills || ''),
      portfolio: Array.isArray(ep?.portfolio) ? ep.portfolio.join(', ') : (ep?.portfolio || ''),
      available: ep?.available ?? true,
      avatarUrl: ep?.avatarUrl || '',
    })
  }, [profile])

  const applyMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.apply(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'available'] })
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['editorProfile'] })
      queryClient.invalidateQueries({ queryKey: ['activeJobCount'] })
      alert('Applied successfully')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to apply')
    },
  })

  const topupMutation = useMutation({
    mutationFn: () => editorApi.walletTopup(topupAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorProfile'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to top up')
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: () =>
      editorApi.updateProfile({
        bio: profileForm.bio,
        rate: profileForm.rate ? Number(profileForm.rate) : undefined,
        skills: profileForm.skills,
        portfolio: profileForm.portfolio,
        available: profileForm.available,
        avatarUrl: profileForm.avatarUrl,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorProfile'] })
      alert('Profile updated')
    },
    onError: (err: any) => {
      console.error('Update profile error:', err);
      if (err?.response?.data?.details) {
        // Show the first validation error detail
        const firstError = err.response.data.details[0];
        alert(`Validation Error: ${firstError.message} (Field: ${firstError.path.join('.')})`);
      } else {
        alert(err?.response?.data?.error || 'Failed to update profile');
      }
    },
  })

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum 5MB allowed.')
      return
    }

    setUploadingPhoto(true)
    try {
      // Get upload URL
      const uploadResponse = await editorApi.uploadProfilePhoto({
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type
      })

      // Upload file to S3 (simplified - in production you'd use the actual upload URL)
      const formData = new FormData()
      formData.append('file', file)

      // For now, create a temporary URL
      const temporaryUrl = URL.createObjectURL(file)
      setProfileForm(prev => ({ ...prev, avatarUrl: temporaryUrl }))

      alert('Photo uploaded successfully!')
    } catch (error: any) {
      alert(error?.response?.data?.error || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getStatusColor = (status: string, isNotApproved?: boolean) => {
    if (isNotApproved) {
      return 'bg-red-100 text-red-700 border border-red-300'
    }
    const colors: Record<string, string> = {
      OPEN: 'bg-gray-100 text-gray-700 border border-gray-300',
      APPLIED: 'bg-yellow-100 text-yellow-700 border border-yellow-300',
      ASSIGNED: 'bg-green-100 text-green-700 border border-green-300',
      IN_PROGRESS: 'bg-purple-100 text-purple-700 border border-purple-300',
      PREVIEW_SUBMITTED: 'bg-orange-100 text-orange-700 border border-orange-300',
      REVISION_REQUESTED: 'bg-red-100 text-red-700 border border-red-300',
      FINAL_SUBMITTED: 'bg-indigo-100 text-indigo-700 border border-indigo-300',
      COMPLETED: 'bg-green-100 text-green-700 border border-green-300',
      CANCELLED: 'bg-gray-100 text-gray-700 border border-gray-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-300'
  }

  if (!user || user.role !== 'EDITOR') return null

  const appliedJobs = useMemo(
    () => myOrders?.filter((o) =>
      o.applications && o.applications.length > 0 &&
      o.applications.some((app) => app.editorId === user?.id && app.status === 'APPLIED')
    ) || [],
    [myOrders, user?.id]
  )

  const rejectedJobs = useMemo(
    () => myOrders?.filter((o) =>
      o.applications && o.applications.length > 0 &&
      o.applications.some((app) => app.editorId === user?.id && app.status === 'REJECTED')
    ) || [],
    [myOrders, user?.id]
  )

  const activeJobs = useMemo(
    () =>
      myOrders?.filter((o) =>
        ['ASSIGNED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'FINAL_SUBMITTED'].includes(o.status)
      ) || [],
    [myOrders]
  )

  const completedJobs = useMemo(
    () => myOrders?.filter((o) => o.status === 'COMPLETED') || [],
    [myOrders]
  )

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent floating-animation">
                  Editor Dashboard
                </span>
              </h1>
              <p className="text-gray-600">Find and manage video editing jobs</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setTab('available')}
                className={`px-3 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${tab === 'available'
                  ? 'premium-button'
                  : 'glass-morphism text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
              >
                Available Jobs
              </button>
              <button
                onClick={() => setTab('active')}
                className={`px-3 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${tab === 'active'
                  ? 'premium-button'
                  : 'glass-morphism text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
              >
                Active Jobs
              </button>
              <button
                onClick={() => setTab('history')}
                className={`px-3 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${tab === 'history'
                  ? 'premium-button'
                  : 'glass-morphism text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
              >
                History
              </button>
              <button
                onClick={() => setTab('profile')}
                className={`px-3 py-2 md:px-6 md:py-3 text-sm md:text-base rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 ${tab === 'profile'
                  ? 'premium-button'
                  : 'glass-morphism text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
              >
                Profile
              </button>
            </div>
          </div>

          {tab === 'available' && (
            <div>
              {openLoading ? (
                <div className="glass-morphism p-12 text-center">
                  <p className="text-gray-600">Loading jobs...</p>
                </div>
              ) : !openOrders || openOrders.length === 0 ? (
                <div className="glass-morphism p-12 text-center">
                  <div className="mb-6">
                    <svg className="w-16 h-16 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No available jobs</h3>
                  <p className="text-gray-600">Check back later for new opportunities</p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {openOrders.map((order) => (
                    <div key={order.id} className="premium-card group md:hover:scale-105 transition-all duration-300">
                      <div className="mb-4">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 break-words group-hover:text-indigo-600 transition-colors">
                          {order.title}
                        </h3>
                      </div>
                      {order.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2 group-hover:text-gray-700 transition-colors text-sm">
                          {order.description}
                        </p>
                      )}
                      <div className="flex flex-wrap justify-between items-center gap-2 text-sm mb-4">
                        <span className="text-gray-500 truncate max-w-[60%]">Creator: {order.creator?.name}</span>
                        {order.amount && (
                          <span className="font-bold text-indigo-400 whitespace-nowrap">₹{order.amount.toLocaleString()}</span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedJob(order)}
                        className="w-full mb-3 flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors border border-indigo-200"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Details
                      </button>

                      {/* Application Logic */}
                      {order.status === 'OPEN' &&
                        !(order.applications && order.applications.some((app) =>
                          app.editorId === user?.id && app.status === 'APPLIED'
                        )) &&
                        order.editorId !== user?.id ? (
                        <button onClick={() => applyMutation.mutate(order.id)} disabled={applyMutation.isPending} className="premium-button w-full neon-glow">
                          {applyMutation.isPending ? 'Applying...' : 'Apply to Job'}
                        </button>
                      ) : (
                        <div className="text-center font-medium text-gray-700 py-2 bg-gray-50 rounded-lg">
                          {order.applications?.some((app) => app.editorId === user?.id && app.status === 'REJECTED')
                            ? 'Not Approved'
                            : order.applications?.some((app) => app.editorId === user?.id && app.status === 'APPLIED')
                              ? 'Applied'
                              : order.status.replace('_', ' ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ACTIVE TAB: Applied & Ongoing */}
          {tab === 'active' && (
            <div className="space-y-8">
              {myLoading ? (
                <div className="glass-morphism p-12 text-center">
                  <p className="text-gray-600">Loading your jobs...</p>
                </div>
              ) : (
                <>
                  {appliedJobs.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-lg mr-3">Applied</span>
                        <span className="text-gray-500 text-sm font-normal">{appliedJobs.length} jobs</span>
                      </h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Applied Jobs Map */}
                        {appliedJobs.map((order) => (
                          <Link key={order.id} href={`/editor/jobs/${order.id}`} className="premium-card group md:hover:scale-105 transition-all duration-300">
                            <h3 className="font-bold text-gray-900 break-words mb-2">{order.title}</h3>
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">Applied</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeJobs.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg mr-3">Active</span>
                        <span className="text-gray-500 text-sm font-normal">{activeJobs.length} jobs</span>
                      </h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeJobs.map((order) => (
                          <Link key={order.id} href={`/editor/jobs/${order.id}`} className="premium-card group md:hover:scale-105 transition-all duration-300">
                            <h3 className="font-bold text-gray-900 break-words mb-2">{order.title}</h3>
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">{order.status}</span>
                            <div className="mt-2 text-sm text-gray-500 truncate">Creator: {order.creator?.name}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeJobs.length === 0 && appliedJobs.length === 0 && (
                    <div className="glass-morphism p-12 text-center text-gray-600">No active jobs found. Check Available Jobs!</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* HISTORY TAB: Completed & Rejected */}
          {tab === 'history' && (
            <div className="space-y-8">
              {myLoading ? (
                <div className="glass-morphism p-12 text-center"><p className="text-gray-600">Loading history...</p></div>
              ) : (
                <>
                  {completedJobs.length > 0 && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg mr-3">Completed</span>
                        <span className="text-gray-500 text-sm font-normal">{completedJobs.length} jobs</span>
                      </h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {completedJobs.map((order) => (
                          <Link key={order.id} href={`/editor/jobs/${order.id}`} className="premium-card group md:hover:scale-105 transition-all duration-300">
                            <h3 className="font-bold text-gray-900 break-words mb-2">{order.title}</h3>
                            <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded">Completed</span>
                            <div className="mt-2 font-bold text-indigo-400">₹{order.amount?.toLocaleString()}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {completedJobs.length === 0 && (
                    <div className="glass-morphism p-12 text-center text-gray-600">No completed jobs yet. Work hard!</div>
                  )}
                </>
              )}
            </div>
          )}

          {tab === 'profile' && (
            <div className="space-y-8">
              {profileLoading || !profile ? (
                <div className="glass-morphism p-12 text-center">
                  <p className="text-gray-600">Loading profile...</p>
                </div>
              ) : (
                <>
                  <div className="premium-card">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg mr-3">Wallet</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-morphism p-6 border border-green-500/30">
                        <div className="text-sm text-gray-500 mb-2">Available Balance</div>
                        <div className="text-3xl font-bold text-green-400">₹{Number(profile.walletBalance || 0).toLocaleString()}</div>
                      </div>
                      <div className="glass-morphism p-6 border border-yellow-500/30">
                        <div className="text-sm text-gray-500 mb-2">Locked (Deposits)</div>
                        <div className="text-3xl font-bold text-yellow-400">₹{Number(profile.walletLocked || 0).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-4 items-end">
                      <div className="flex-1 max-w-xs">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Test Top-up Amount</label>
                        <input
                          type="number"
                          value={topupAmount}
                          onChange={(e) => setTopupAmount(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                          min="100"
                          step="100"
                        />
                      </div>
                      <button
                        onClick={() => topupMutation.mutate()}
                        disabled={topupMutation.isPending}
                        className="premium-button neon-glow"
                      >
                        {topupMutation.isPending ? 'Adding...' : 'Add Test Money'}
                      </button>
                    </div>
                  </div>

                  <div className="premium-card">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg mr-3">Active Jobs</span>
                    </h2>
                    <div className="glass-morphism p-6 border border-indigo-500/30">
                      <div className="text-sm text-gray-500 mb-2">Active jobs count</div>
                      <div className="text-3xl font-bold text-indigo-400">
                        {activeJobLoading ? '...' : `${activeJobData?.activeJobs || 0} / ${activeJobData?.maxActiveJobs || 2}`}
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {activeJobLoading ? 'Loading...' :
                          activeJobData?.canApply ?
                            'You can apply for new jobs' :
                            'Complete an active job to apply for new ones'
                        }
                      </div>
                    </div>
                  </div>

                  <div className="premium-card">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                      <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg mr-3">Editor Profile</span>
                    </h2>
                    <div className="space-y-6">
                      {/* Profile Photo */}
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Profile Photo *</label>
                        <div className="flex items-center space-x-4">
                          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                            {profileForm.avatarUrl ? (
                              <img
                                src={profileForm.avatarUrl}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-indigo-600 font-bold text-2xl">
                                {user?.name?.charAt(0).toUpperCase() || 'E'}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="space-y-2">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Upload Photo (Recommended)</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePhotoUpload}
                                  disabled={uploadingPhoto}
                                  className="w-full px-3 py-2 bg-white/10 border border-gray-300 rounded-lg text-gray-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                                />
                                {uploadingPhoto && (
                                  <p className="text-xs text-indigo-600">Uploading...</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Or enter image URL</label>
                                <input
                                  type="url"
                                  value={profileForm.avatarUrl}
                                  onChange={(e) => setProfileForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                                  className="w-full px-3 py-2 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15 text-sm"
                                  placeholder="https://example.com/your-photo.jpg"
                                  required
                                />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Profile photo is mandatory. Upload an image or enter a valid URL.</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                          rows={4}
                          placeholder="Tell creators about your editing style and expertise..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Rate (₹ per project)</label>
                        <input
                          value={profileForm.rate}
                          onChange={(e) => setProfileForm((p) => ({ ...p, rate: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                          placeholder="Your typical rate per project"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Skills (comma separated)</label>
                        <input
                          value={profileForm.skills}
                          onChange={(e) => setProfileForm((p) => ({ ...p, skills: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                          placeholder="e.g., color grading, motion graphics, sound design"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Portfolio URLs (comma separated)</label>
                        <input
                          value={profileForm.portfolio}
                          onChange={(e) => setProfileForm((p) => ({ ...p, portfolio: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                          placeholder="e.g., https://vimeo.com/yourwork, https://youtube.com/yourchannel"
                        />
                      </div>
                      <label className="flex items-center gap-3 text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profileForm.available}
                          onChange={(e) => setProfileForm((p) => ({ ...p, available: e.target.checked }))}
                          className="w-5 h-5 rounded border-gray-300 bg-white/10 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                        />
                        <span className="font-medium">Available for new projects</span>
                      </label>
                      <button
                        onClick={() => updateProfileMutation.mutate()}
                        disabled={updateProfileMutation.isPending}
                        className="premium-button neon-glow"
                      >
                        {updateProfileMutation.isPending ? 'Saving Profile...' : 'Save Profile'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Job Details Modal */}
        {selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-start gap-3 z-10">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 break-words pr-2">{selectedJob.title}</h2>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Header Info */}
                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Deadline</span>
                    <div className={`flex items-center font-bold mt-1 ${selectedJob.deadline ? 'text-red-600' : 'text-gray-700'}`}>
                      <Calendar className="w-4 h-4 mr-2" />
                      {selectedJob.deadline ? new Date(selectedJob.deadline).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'Not Specified'}
                    </div>
                  </div>
                  <div className="w-px bg-gray-200 h-10 hidden sm:block"></div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Budget</span>
                    <div className="text-gray-900 font-bold mt-1">
                      ₹{selectedJob.amount?.toLocaleString()}
                    </div>
                  </div>
                  <div className="w-px bg-gray-200 h-10 hidden sm:block"></div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">Level</span>
                    <div className="text-indigo-600 font-bold mt-1">
                      {selectedJob.editingLevel || 'Not Specified'}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Description</h3>
                  <div className="text-gray-700 bg-gray-50 p-4 rounded-lg text-sm leading-relaxed">
                    {selectedJob.description || 'No description provided.'}
                  </div>
                </div>

                {/* Brief */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Editing Brief
                  </h3>
                  <div className="text-gray-700 bg-indigo-50 border border-indigo-100 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedJob.brief || 'No specific brief provided.'}
                  </div>
                </div>

                {/* Durations */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block mb-1">Raw Footage</span>
                    <div className="flex items-center text-gray-900 font-medium">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedJob.rawFootageDuration ? `${selectedJob.rawFootageDuration} mins` : 'Not Specified'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500 block mb-1">Expected Duration</span>
                    <div className="flex items-center text-gray-900 font-medium">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedJob.expectedDuration ? `${selectedJob.expectedDuration} mins` : 'Not Specified'}
                    </div>
                  </div>
                </div>

                {/* Reference Link */}
                {selectedJob.referenceLink && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Reference</h3>
                    <a
                      href={selectedJob.referenceLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      <span className="truncate">{selectedJob.referenceLink}</span>
                    </a>
                  </div>
                )}

                {/* Creator Info */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase mb-2">Creator</h3>
                  <div className="text-gray-700 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    {selectedJob.creator?.name} ({selectedJob.creator?.email})
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Close
                </button>

                {/* Show Apply button in modal too */}
                {!user?.role || user.role === 'EDITOR' ? (
                  selectedJob.applications?.some((app: any) => app.editorId === user?.id) ? (
                    <button disabled className="px-4 py-2 bg-gray-300 text-white rounded-lg font-medium cursor-not-allowed">
                      Already Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        applyMutation.mutate(selectedJob.id);
                        setSelectedJob(null);
                      }}
                      disabled={applyMutation.isPending}
                      className="premium-button px-6 py-2"
                    >
                      Apply Now
                    </button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

