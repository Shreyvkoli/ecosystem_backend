'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { editorApi, ordersApi, usersApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import EditorTimeline from '@/components/EditorTimeline'
import Link from 'next/link'
import { Eye, FileText, Calendar, Clock, ExternalLink, X, Users, ArrowRight, Sparkles, Shield, Wallet, Award, CheckCircle, Zap, Star } from 'lucide-react'

export default function EditorJobsPage() {
  const router = useRouter()
  const user = getUser()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<'available' | 'active' | 'history' | 'creators' | 'profile'>('available')
  const [topupAmount, setTopupAmount] = useState<number>(5000)
  const [sentInterests, setSentInterests] = useState<Set<string>>(new Set())
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
  const [sortBy, setSortBy] = useState<'default' | 'money' | 'deadline' | 'level'>('default')

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

  const { data: creators, isLoading: creatorsLoading } = useQuery({
    queryKey: ['creators'],
    queryFn: async () => (await usersApi.listCreators()).data,
    enabled: !!user && user.role === 'EDITOR' && tab === 'creators',
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
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to apply')
    },
  })

  const startJobMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.updateStatus(orderId, 'ASSIGNED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['activeJobCount'] })
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to start job')
    }
  })

  const interestMutation = useMutation({
    mutationFn: (creatorId: string) => usersApi.expressInterest(creatorId),
    onSuccess: (data, variables) => {
      setSentInterests(prev => new Set(prev).add(variables))
      alert('Interest expressed successfully! The creator will be notified.')
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to express interest')
    }
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
      ASSIGNED: 'bg-blue-100 text-blue-700 border border-blue-300',
      IN_PROGRESS: 'bg-brand/10 text-brand-dark border border-brand/20',
      PREVIEW_SUBMITTED: 'bg-orange-100 text-orange-700 border border-orange-300',
      REVISION_REQUESTED: 'bg-red-100 text-red-700 border border-red-300',
      FINAL_SUBMITTED: 'bg-brand text-white border border-brand-dark shadow-sm',
      COMPLETED: 'bg-green-100 text-green-700 border border-green-300',
      CANCELLED: 'bg-gray-100 text-gray-700 border border-gray-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-300'
  }

  const getJobCardGradient = (level?: string) => {
    switch (level) {
      case 'PREMIUM':
        return 'bg-gradient-to-br from-orange-50 via-orange-100/40 to-white order-card-orange border-orange-200 hover:shadow-orange-200/50'
      case 'PROFESSIONAL':
        return 'bg-gradient-to-br from-blue-50 via-blue-100/40 to-white order-card-blue border-blue-200 hover:shadow-blue-200/50'
      default: // BASIC
        return 'bg-gradient-to-br from-green-50 via-green-100/40 to-white order-card-green border-green-200 hover:shadow-green-200/50'
    }
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

  const pipelineJobs = useMemo(
    () => myOrders?.filter((o) => o.status === 'SELECTED') || [],
    [myOrders]
  )

  const completedJobs = useMemo(
    () => myOrders?.filter((o) => o.status === 'COMPLETED') || [],
    [myOrders]
  )

  const sortOrders = (orders: any[]) => {
    if (!orders) return []
    const sorted = [...orders]

    switch (sortBy) {
      case 'money':
        return sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0))
      case 'deadline':
        return sorted.sort((a, b) => {
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        })
      case 'level':
        const levels = { 'TOP_1_PERCENT': 3, 'PRO': 2, 'INTERMEDIATE': 1, 'BEGINNER': 0 }
        return sorted.sort((a, b) => {
          const levelA = levels[a.editingLevel as keyof typeof levels] || 0
          const levelB = levels[b.editingLevel as keyof typeof levels] || 0
          return levelB - levelA
        })
      default:
        return sorted
    }
  }

  const sortedOpenOrders = useMemo(() => sortOrders(openOrders || []), [openOrders, sortBy])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-6">
            <div>
              <h1 className="text-heading text-charcoal">
                Editor Dashboard
              </h1>
              <p className="text-body text-charcoal/60 mt-1">Find and manage video editing jobs</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setTab('available')}
                className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-caption rounded-lg font-semibold transition-all duration-200 ${tab === 'available'
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Available Jobs
              </button>
              <button
                onClick={() => setTab('active')}
                className={`flex-shrink-0 whitespace-nowrap relative px-4 py-2 text-caption rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${activeJobs.length > 0
                  ? 'bg-brand text-white'
                  : tab === 'active'
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Active Jobs
                {activeJobs.length > 0 && (
                  <span className="ml-1.5 w-5 h-5 flex items-center justify-center bg-white/20 text-white text-micro font-bold rounded-full">
                    {activeJobs.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab('history')}
                className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-caption rounded-lg font-semibold transition-all duration-200 ${tab === 'history'
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                History
              </button>
              <button
                onClick={() => setTab('creators')}
                className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-caption rounded-lg font-semibold transition-all duration-200 ${tab === 'creators'
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Browse Creators
              </button>
              <button
                onClick={() => setTab('profile')}
                className={`flex-shrink-0 whitespace-nowrap px-4 py-2 text-caption rounded-lg font-semibold transition-all duration-200 ${tab === 'profile'
                  ? 'bg-white text-charcoal shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                Profile
              </button>
            </div>
          </div>

          {/* Editor Stats Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {/* Stat 1: success score */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all duration-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 text-green-600">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold truncate">Success Score</span>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-base font-bold text-gray-900">98%</span>
                  <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1 py-0.2 rounded border border-green-100 whitespace-nowrap">Top Rated</span>
                </div>
              </div>
            </div>

            {/* Stat 2: total earned */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all duration-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 text-indigo-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold truncate">Wallet Balance</span>
                <span className="block text-base font-bold text-gray-900 mt-0.5 truncate">
                  ₹{Number(profile?.walletBalance || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stat 3: active jobs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all duration-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 text-blue-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold truncate">Active Slot</span>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-base font-bold text-gray-900">
                    {activeJobLoading ? '...' : `${activeJobData?.activeJobs || 0}/${activeJobData?.maxActiveJobs || 2}`}
                  </span>
                  <span className={`text-[9px] font-bold px-1 py-0.2 rounded border whitespace-nowrap ${
                    activeJobData?.canApply 
                      ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                      : 'text-red-600 bg-red-50 border-red-100'
                  }`}>
                    {activeJobData?.canApply ? 'Available' : 'Full'}
                  </span>
                </div>
              </div>
            </div>

            {/* Stat 4: typical rate */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all duration-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-600">
                <Zap className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-bold truncate">Typical Rate</span>
                <span className="block text-base font-bold text-gray-900 mt-0.5 truncate">
                  ₹{profileForm.rate ? Number(profileForm.rate).toLocaleString() : '5,000'}/job
                </span>
              </div>
            </div>
          </div>

          {tab === 'available' && (
            <div>
              <div className="flex justify-center mb-6">
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-sm font-semibold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="default">Newest</option>
                    <option value="money">Money (High to Low)</option>
                    <option value="deadline">Deadline (Urgent First)</option>
                    <option value="level">Level (Expertise)</option>
                  </select>
                </div>
              </div>

              {openLoading ? (
                <div className="glass-morphism p-12 text-center">
                  <p className="text-gray-600">Loading jobs...</p>
                </div>
              ) : !sortedOpenOrders || sortedOpenOrders.length === 0 ? (
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
                  {sortedOpenOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 relative group flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            {/* Avatar */}
                            <div className="relative w-10 h-10 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex-shrink-0">
                              {order.creator?.creatorProfile?.avatarUrl ? (
                                <img src={order.creator.creatorProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-100">
                                  {order.creator?.name?.charAt(0)}
                                </div>
                              )}
                              {/* Green online ring dot */}
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full z-10"></div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-green-600 transition-colors">
                                {order.title}
                              </h3>
                              <p className="text-[11px] text-gray-500 font-medium truncate">by {order.creator?.name}</p>
                            </div>
                          </div>
                          {order.amount && (
                            <div className="text-right flex-shrink-0 ml-2">
                              <span className="block text-[15px] font-extrabold text-gray-900 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                                ₹{order.amount.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {order.description && (
                          <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                            {order.description}
                          </p>
                        )}

                        {/* Organized Metadata Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {/* Deadline */}
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{order.deadline ? new Date(order.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Deadline'}</span>
                          </div>

                          {/* Level */}
                          <div className={`flex items-center justify-center text-center text-[11px] font-bold px-2.5 py-1.5 rounded-xl border truncate ${order.editingLevel === 'PREMIUM' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            order.editingLevel === 'PROFESSIONAL' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-green-50 text-green-700 border-green-100'
                            }`}>
                            {order.editingLevel === 'PREMIUM' ? '👑 Premium' :
                             order.editingLevel === 'PROFESSIONAL' ? '⭐ Pro' :
                             '⚡ Basic'}
                          </div>

                          {/* Applicants - Full Width */}
                          <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-gray-500 px-1 mt-1">
                            <Users className="w-3.5 h-3.5 text-gray-400" />
                            <span>{order._count?.applications || order.applications?.length || 0} Editors applied</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-2">
                        <button
                          onClick={() => setSelectedJob(order)}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-full text-xs font-semibold transition-all duration-200"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                          View Details
                        </button>

                        {/* Application Logic */}
                        {order.status === 'OPEN' &&
                          !(order.applications && order.applications.some((app: any) =>
                            app.editorId === user?.id && app.status === 'APPLIED'
                          )) &&
                          order.editorId !== user?.id ? (
                          <button 
                            onClick={() => applyMutation.mutate(order.id)} 
                            disabled={applyMutation.isPending && applyMutation.variables === order.id} 
                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-xs text-center transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                          >
                            {applyMutation.isPending && applyMutation.variables === order.id ? 'Applying...' : 'Apply to Job'}
                          </button>
                        ) : (
                          <div className="text-center font-bold text-xs text-gray-600 py-2 bg-gray-50 rounded-full border border-gray-100">
                            {order.applications?.some((app: any) => app.editorId === user?.id && app.status === 'REJECTED')
                              ? 'Not Approved'
                              : order.applications?.some((app: any) => app.editorId === user?.id && app.status === 'APPLIED')
                                ? '✓ Applied'
                                : order.status.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'creators' && (
            <div className="space-y-8">
              {creatorsLoading ? (
                <div className="glass-morphism p-12 text-center">
                  <p className="text-gray-600">Loading creators...</p>
                </div>
              ) : !creators || creators.length === 0 ? (
                <div className="glass-morphism p-12 text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No creators found</h3>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {creators.map((creator: any) => {
                    const charCode = creator.name?.charCodeAt(0) || 65;
                    const niche = charCode % 3 === 0 ? 'Tech & Gaming' : charCode % 3 === 1 ? 'Lifestyle & Vlogs' : 'Finance & Business';
                    const rating = (4.7 + (charCode % 4) * 0.1).toFixed(1);
                    const reviews = 10 + (charCode % 25);
                    const ordersCount = 1 + (charCode % 4);

                    return (
                      <div key={creator.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 relative group flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="relative w-12 h-12 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex-shrink-0">
                              {creator.avatarUrl ? (
                                <img src={creator.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-700 bg-gray-100">
                                  {creator.name?.charAt(0)}
                                </div>
                              )}
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full z-10"></div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">{creator.name}</h3>
                              <p className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.2 rounded border border-green-100 inline-block mt-0.5">{niche}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-3 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-100 font-medium font-semibold">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{rating} ({reviews} reviews)</span>
                            </div>
                            <div className="w-px bg-gray-200 h-3"></div>
                            <div>{ordersCount} active briefs</div>
                          </div>
                          
                          {creator.bio && (
                            <p className="text-xs text-gray-600 mb-4 line-clamp-2 leading-relaxed bg-gray-50/50 p-2.5 rounded-xl border border-dashed border-gray-200 italic">
                              "{creator.bio}"
                            </p>
                          )}
                        </div>

                        {sentInterests.has(creator.id) ? (
                          <div className="w-full py-2 bg-green-50 text-green-700 rounded-full text-xs font-bold text-center border border-green-200">
                            ✓ Interest Sent
                          </div>
                        ) : (
                          <button 
                            onClick={() => interestMutation.mutate(creator.id)}
                            disabled={interestMutation.isPending && interestMutation.variables === creator.id}
                            className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-xs text-center transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                          >
                            {interestMutation.isPending && interestMutation.variables === creator.id ? 'Sending...' : 'Express Interest'}
                          </button>
                        )}
                      </div>
                    );
                  })}
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
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-xl mr-3 text-xs font-extrabold uppercase tracking-wider font-semibold">Applied</span>
                        <span className="text-gray-400 text-xs font-semibold">{appliedJobs.length} active applications</span>
                      </h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Applied Jobs Map */}
                        {appliedJobs.map((order) => (
                          <Link key={order.id} href={`/editor/jobs/${order.id}`} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-sm text-gray-900 break-words group-hover:text-green-600 transition-colors">{order.title}</h3>
                                {order.amount && (
                                  <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                    ₹{order.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 font-medium">Applied on {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'recently'}</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                              <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 rounded-full border border-amber-100">Pending Review</span>
                              <span className="text-[11px] font-semibold text-green-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                View details <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {pipelineJobs.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-xl mr-3 text-xs font-extrabold uppercase tracking-wider font-semibold">Pipeline</span>
                        <span className="text-gray-400 text-xs font-semibold">{pipelineJobs.length} waiting jobs</span>
                      </h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {pipelineJobs.map((order) => (
                          <div key={order.id} className="bg-white border border-gray-200 border-l-4 border-l-blue-500 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-sm text-gray-900 break-words">{order.title}</h3>
                                {order.amount && (
                                  <span className="text-xs font-bold text-gray-900 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                    ₹{order.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 font-medium">Approved! Waiting for active slot to start.</p>
                            </div>

                            <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3">
                              <div className="flex items-center justify-between">
                                <Link href={`/editor/jobs/${order.id}`} className="text-[11px] font-bold text-blue-600 hover:underline">
                                  View Contract
                                </Link>
                                <button
                                  onClick={() => startJobMutation.mutate(order.id)}
                                  disabled={!activeJobData?.canApply || (startJobMutation.isPending && startJobMutation.variables === order.id)}
                                  className={`flex items-center px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${!activeJobData?.canApply || (startJobMutation.isPending && startJobMutation.variables === order.id)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                    : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                                    }`}
                                >
                                  {startJobMutation.isPending && startJobMutation.variables === order.id ? 'Starting...' : 'Start Active Job'}
                                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </button>
                              </div>
                              {!activeJobData?.canApply && (
                                <p className="text-[10px] text-red-500 font-semibold text-right mt-1">
                                  ⚠️ Finish an active job first to start this one.
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeJobs.length > 0 && (
                    <div className="mt-8">
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-xl mr-3 text-xs font-extrabold uppercase tracking-wider font-semibold">Active Contract</span>
                        <span className="text-gray-400 text-xs font-semibold">{activeJobs.length} active jobs</span>
                      </h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {activeJobs.map((order) => (
                          <Link key={order.id} href={`/editor/jobs/${order.id}`} className="bg-white border border-gray-200 border-l-4 border-l-green-500 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between relative">
                            <div className="absolute top-5 right-5 w-9 h-9 rounded-full border border-gray-200 shadow-sm overflow-hidden bg-gray-50 flex-shrink-0 z-20">
                              {order.creator?.creatorProfile?.avatarUrl ? (
                                <img src={order.creator.creatorProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-100">
                                  {order.creator?.name?.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-gray-900 break-words pr-10 group-hover:text-green-600 transition-colors">{order.title}</h3>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-green-50 text-green-700 border border-green-100 rounded">
                                  {order.status}
                                </span>
                                {order.amount && (
                                  <span className="text-xs font-bold text-gray-900">
                                    ₹{order.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                              <span className="text-[11px] text-gray-500 font-semibold truncate">Client: {order.creator?.name}</span>
                              <span className="text-[11px] font-bold text-green-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                Open Editor Timeline <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeJobs.length === 0 && appliedJobs.length === 0 && (
                    <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500 font-medium">
                      No active contracts found. Check out the "Available Jobs" tab to apply!
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* HISTORY TAB: Completed & Rejected */}
          {tab === 'history' && (
            <div className="space-y-8">
              {myLoading ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center"><p className="text-gray-500 font-medium">Loading history...</p></div>
              ) : (
                <>
                  {completedJobs.length > 0 && (
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-xl mr-3 text-xs font-extrabold uppercase tracking-wider font-semibold">Completed Contracts</span>
                        <span className="text-gray-400 text-xs font-semibold">{completedJobs.length} completed jobs</span>
                      </h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {completedJobs.map((order) => (
                          <Link key={order.id} href={`/editor/jobs/${order.id}`} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-sm text-gray-900 break-words group-hover:text-green-600 transition-colors">{order.title}</h3>
                                {order.amount && (
                                  <span className="text-xs font-extrabold text-green-700 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded-full">
                                    ₹{order.amount.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 font-semibold">Completed successfully</p>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                              <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-green-50 text-green-700 border border-green-100 rounded">
                                Paid Out
                              </span>
                              <span className="text-[11px] font-bold text-green-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                View details <ArrowRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
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
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                  <p className="text-gray-500 font-medium">Loading profile...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Widgets: Wallet & Job Slot */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Wallet Card */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200">
                      <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-green-600" />
                        Wallet & Deposits
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Available Balance</span>
                          <span className="block text-2xl font-extrabold text-green-600 mt-1">₹{Number(profile.walletBalance || 0).toLocaleString()}</span>
                        </div>
                        
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Locked Deposit</span>
                          <span className="block text-xl font-extrabold text-amber-600 mt-1">₹{Number(profile.walletLocked || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-gray-100 pt-4 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Test Top-up Amount</label>
                          <input
                            type="number"
                            value={topupAmount}
                            onChange={(e) => setTopupAmount(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                            min="100"
                            step="100"
                          />
                        </div>
                        <button
                          onClick={() => topupMutation.mutate()}
                          disabled={topupMutation.isPending}
                          className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-xs text-center transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                        >
                          {topupMutation.isPending ? 'Adding...' : 'Add Test Funds'}
                        </button>
                      </div>
                    </div>

                    {/* Active Limit widget */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200">
                      <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider mb-3.5 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Contract Capacity
                      </h3>

                      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] uppercase font-bold text-gray-400">Active Slots Occupied</span>
                          <span className="text-xs font-extrabold text-blue-600">
                            {activeJobLoading ? '...' : `${activeJobData?.activeJobs || 0}/${activeJobData?.maxActiveJobs || 2}`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${((activeJobData?.activeJobs || 0) / (activeJobData?.maxActiveJobs || 2)) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-500 mt-3 leading-relaxed font-medium">
                        {activeJobLoading ? 'Loading capacity...' :
                          activeJobData?.canApply ?
                            '✓ You have free active job slots! You are fully cleared to apply for open contracts.' :
                            '⚠️ Maximum ongoing contracts reached. Complete an active job to open up new slots.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Right Widgets: Editor Profile settings */}
                  <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                    <h3 className="text-sm font-extrabold text-gray-950 uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Professional Editor Profile
                    </h3>

                    <div className="space-y-5">
                      {/* Avatar block */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="relative w-16 h-16 rounded-full border-2 border-white shadow overflow-hidden bg-gray-200 flex-shrink-0">
                          {profileForm.avatarUrl ? (
                            <img
                              src={profileForm.avatarUrl}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-700 bg-gray-100">
                              {user?.name?.charAt(0).toUpperCase() || 'E'}
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 space-y-2 w-full">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Upload Profile Photo</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              disabled={uploadingPhoto}
                              className="w-full text-xs text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border file:border-gray-200 file:text-[10px] file:font-extrabold file:uppercase file:bg-white file:text-gray-700 hover:file:bg-gray-50 disabled:opacity-50"
                            />
                            {uploadingPhoto && (
                              <p className="text-[10px] text-green-600 font-bold mt-1">Uploading photo...</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1">Or direct avatar URL</label>
                            <input
                              type="url"
                              value={profileForm.avatarUrl}
                              onChange={(e) => setProfileForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                              placeholder="https://example.com/avatar.jpg"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Professional Bio</label>
                        <textarea
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                          rows={4}
                          placeholder="Introduce yourself! Talk about niches (Vlogs, Gaming, Tech, Finance) and specific software you use..."
                        />
                      </div>

                      {/* Niche metadata side-by-side */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Target Rate (₹ per project)</label>
                          <input
                            value={profileForm.rate}
                            onChange={(e) => setProfileForm((p) => ({ ...p, rate: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                            placeholder="Typical pay rate per task"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Skills (comma separated)</label>
                          <input
                            value={profileForm.skills}
                            onChange={(e) => setProfileForm((p) => ({ ...p, skills: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                            placeholder="e.g., color grading, After Effects, sound design"
                          />
                        </div>
                      </div>

                      {/* Portfolio URL */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Portfolio URLs (comma separated)</label>
                        <input
                          value={profileForm.portfolio}
                          onChange={(e) => setProfileForm((p) => ({ ...p, portfolio: e.target.value }))}
                          className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                          placeholder="e.g. https://vimeo.com/mywork, https://youtube.com/mychannel"
                        />
                      </div>

                      {/* Availability Checkbox */}
                      <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          id="availableCheck"
                          checked={profileForm.available}
                          onChange={(e) => setProfileForm((p) => ({ ...p, available: e.target.checked }))}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <label htmlFor="availableCheck" className="text-xs font-bold text-gray-700 cursor-pointer">
                          Available for instant contract assignments
                        </label>
                      </div>

                      <button
                        onClick={() => updateProfileMutation.mutate()}
                        disabled={updateProfileMutation.isPending}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold text-xs text-center transition-all shadow-sm flex items-center justify-center disabled:opacity-50"
                      >
                        {updateProfileMutation.isPending ? 'Saving Profile...' : 'Save Profile Settings'}
                      </button>
                    </div>
                  </div>
                </div>
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
                    <div className="text-brand font-bold mt-1">
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
                  <div className="text-gray-700 bg-bg-brand/10 border border-indigo-100 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
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

