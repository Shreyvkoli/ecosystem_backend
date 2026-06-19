'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi, youtubeApi, usersApi } from '@/lib/api'
import { getUser, getAuthToken, removeUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'
import YouTubeConnectModal from '@/components/YouTubeConnectModal'
import CreatorHandbookModal from '@/components/CreatorHandbookModal'
import EditorProfileModal from '@/components/EditorProfileModal'
import Link from 'next/link'
import { 
  MessageCircle, 
  Briefcase, 
  Users, 
  Plus, 
  BookOpen, 
  CheckCircle, 
  Heart, 
  Search, 
  Zap, 
  Sparkles, 
  MapPin, 
  Star 
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const user = getUser()
  const [showYouTubeConnectModal, setShowYouTubeConnectModal] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState<string | null>(null)
  const [showHandbookModal, setShowHandbookModal] = useState(false)
  const [activeTab, setActiveTab] = useState('browse')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('All')
  const queryClient = useQueryClient()

  // Filters State Values
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = getAuthToken()

    if (!user || !token) {
      if (!token) removeUser()
      router.push('/login')
    } else if (user.role === 'EDITOR') {
      router.push('/editor/jobs')
    }
  }, [user, router])

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await ordersApi.list()
      return response.data
    },
    enabled: !!user && (activeTab === 'active' || activeTab === 'history'),
  })

  // Fetch Saved Editors
  const { data: savedEditors, isLoading: isLoadingSaved } = useQuery({
    queryKey: ['saved-editors'],
    queryFn: async () => {
      const response = await usersApi.listSavedEditors()
      return response.data
    },
    enabled: !!user && user.role === 'CREATOR' && (activeTab === 'saved' || activeTab === 'browse'),
  })

  // Fetch Editor Interests
  const { data: interests, isLoading: isLoadingInterests } = useQuery({
    queryKey: ['editor-interests'],
    queryFn: async () => {
      const response = await usersApi.listInterests()
      return response.data
    },
    enabled: !!user && user.role === 'CREATOR' && activeTab === 'interests',
  })

  // All editors list for browsing
  const { data: allEditorsData, isLoading: isLoadingAllEditors } = useQuery({
    queryKey: ['all-editors'],
    queryFn: async () => {
      const response = await usersApi.listEditors()
      return Array.isArray(response.data) ? response.data : response.data.editors
    },
    enabled: !!user && user.role === 'CREATOR' && activeTab === 'browse',
  })

  const allEditors = allEditorsData

  // Filtered Editors logic
  const filteredEditors = allEditors?.filter((editor: any) => {
    if (!editor) return false;

    // Search matches
    const searchLow = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      (editor.name && editor.name.toLowerCase().includes(searchLow)) ||
      (Array.isArray(editor.skills) && editor.skills.some((s: string) => s.toLowerCase().includes(searchLow))) ||
      (editor.bio && editor.bio.toLowerCase().includes(searchLow));

    // Skill matches case insensitively & safely
    const matchesSkill = selectedSkill === 'All' || 
      (Array.isArray(editor.skills) && editor.skills.some((s: string) => s.toLowerCase() === selectedSkill.toLowerCase())) ||
      (typeof editor.skills === 'string' && editor.skills.toLowerCase().includes(selectedSkill.toLowerCase()));

    return matchesSearch && matchesSkill;
  });

  const popularSkills = ['All', 'Gaming', 'Vlog', 'Short-form', 'Podcast', 'Documentary', 'Corporate'];

  // Save/Unsave Editor Mutation
  const toggleSaveMutation = useMutation({
    mutationFn: (editorId: string) => usersApi.saveEditor(editorId),
    onMutate: async (editorId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['saved-editors'] })
      const previousSaved = queryClient.getQueryData<any[]>(['saved-editors'])
      
      if (previousSaved) {
        const isCurrentlySaved = previousSaved.some(s => s.id === editorId);
        let newSaved;
        if (isCurrentlySaved) {
          newSaved = previousSaved.filter(s => s.id !== editorId);
        } else {
          // We don't have the full editor object here easily in onMutate, 
          // but we can just toggle the local check if we had it.
          // For now, let's just use invalidation on success, but we can fake the list.
          newSaved = [...previousSaved, { id: editorId }];
        }
        queryClient.setQueryData(['saved-editors'], newSaved);
      }
      
      return { previousSaved }
    },
    onError: (err, editorId, context) => {
      if (context?.previousSaved) {
        queryClient.setQueryData(['saved-editors'], context.previousSaved)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-editors'] })
    }
  })

  const updateInterestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: 'ACCEPTED' | 'REJECTED' }) => 
      usersApi.updateInterestStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-interests'] })
      alert('Status updated successfully!')
    }
  })

  // Filter Orders for Tabs
  const filteredOrders = orders?.filter((order: any) => {
    const isCompleted = order.status === 'COMPLETED' || order.status === 'CANCELLED';
    return activeTab === 'history' ? isCompleted : !isCompleted;
  });

  const { data: youtubeStatus } = useQuery({
    queryKey: ['youtube-status'],
    queryFn: () => youtubeApi.getStatus(),
    enabled: !!user && user.role === 'CREATOR',
  })

  if (!mounted) return null

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-gray-50 text-gray-600 border border-gray-200',
      APPLIED: 'bg-amber-50 text-amber-700 border border-amber-200',
      ASSIGNED: 'bg-blue-50 text-blue-700 border border-blue-200',
      IN_PROGRESS: 'bg-brand-light text-brand-dark border border-brand/20',
      PREVIEW_SUBMITTED: 'bg-orange-50 text-orange-700 border border-orange-200',
      REVISION_REQUESTED: 'bg-red-50 text-red-700 border border-red-200',
      FINAL_SUBMITTED: 'bg-brand text-white border border-brand-dark',
      PUBLISHED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
      CANCELLED: 'bg-gray-50 text-gray-500 border border-gray-200',
    }
    return colors[status] || 'bg-gray-50 text-gray-600 border border-gray-200'
  }

  const getJobCardGradient = (level?: string) => {
    switch (level) {
      case 'PREMIUM':
        return 'bg-gradient-to-br from-orange-50/80 via-white to-white border-orange-100 hover:shadow-orange-100/50'
      case 'PROFESSIONAL':
        return 'bg-gradient-to-br from-blue-50/80 via-white to-white border-blue-100 hover:shadow-blue-100/50'
      default:
        return 'bg-gradient-to-br from-green-50/80 via-white to-white border-green-100 hover:shadow-green-100/50'
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-heading text-charcoal">
                Creator Dashboard
              </h1>
              <p className="text-body text-charcoal/60 mt-1">Manage your video editing orders</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {user.role === 'CREATOR' && (
                <>
                  {youtubeStatus?.data.connected ? (
                    <div className="flex items-center px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 text-caption">
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      <span className="hidden sm:inline">YouTube Connected</span>
                      <span className="sm:hidden">Connected</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowYouTubeConnectModal(true)}
                      className="flex items-center px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors text-caption font-semibold"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      <span className="hidden sm:inline">Connect YouTube</span>
                      <span className="sm:hidden">Connect</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowHandbookModal(true)}
                    className="flex items-center px-3 py-2 bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-caption font-semibold"
                  >
                    <BookOpen className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">Handbook</span>
                  </button>
                  <Link
                    href="/orders/new"
                    className="btn-primary !py-2 !px-4 !text-caption"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Order</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          {activeTab === 'interests' && (
            <div className="space-y-6">
              {isLoadingInterests ? (
                <div className="glass-morphism p-12 text-center">
                  <p className="text-gray-600 font-medium">Loading interest requests...</p>
                </div>
              ) : !interests || interests.length === 0 ? (
                <div className="glass-morphism p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-charcoal mb-2">No interest requests yet</h3>
                  <p className="text-body text-gray-400 max-w-sm mx-auto">
                    When editors express interest in working with you, they'll appear here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {interests.map((item: any) => (
                    <div key={item.id} className="premium-card group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex-shrink-0">
                          {item.editor.editorProfile?.avatarUrl ? (
                            <img src={item.editor.editorProfile.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-brand-dark bg-brand/10">
                              {item.editor.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-charcoal leading-tight">{item.editor.name}</h3>
                          <p className="text-xs text-brand font-semibold">Video Editor</p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-6 line-clamp-2 italic">
                        {item.editor.editorProfile?.bio || "No bio provided."}
                      </p>

                      <div className="flex gap-2">
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => updateInterestMutation.mutate({ id: item.id, status: 'ACCEPTED' })}
                              disabled={updateInterestMutation.isPending}
                              className="flex-1 py-2 bg-charcoal text-white rounded-lg text-sm font-bold hover:bg-charcoal/90 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => updateInterestMutation.mutate({ id: item.id, status: 'REJECTED' })}
                              disabled={updateInterestMutation.isPending}
                              className="flex-1 py-2 bg-white text-gray-400 rounded-lg text-sm font-bold border border-gray-100 hover:bg-gray-50 hover:text-red-500 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                              Decline
                            </button>
                          </>
                        ) : (
                          <div className={`w-full py-2 text-center rounded-lg text-sm font-bold ${
                            item.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto no-scrollbar">
            {[
              ...(user.role === 'CREATOR' ? [
                { key: 'browse', label: 'Browse Editors' },
                { key: 'interests', label: 'Interests' },
                { key: 'active', label: 'Active Orders' },
                { key: 'history', label: 'History' },
                { key: 'saved', label: 'Saved' }
              ] : [
                { key: 'active', label: 'Active Orders' },
                { key: 'history', label: 'History' }
              ])
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 text-caption font-semibold rounded-lg transition-all duration-200 ${activeTab === tab.key
                    ? 'bg-white text-charcoal shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'browse' ? (
            <div className="mt-6 animate-fade-in">
              {/* Main content Area */}
              <div className="space-y-6">
                {/* Upwork style Search Bar */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search editors by name, skills, or bio..."
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm shadow-sm transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Popular skills pills */}
                <div className="flex flex-wrap gap-2 pb-1">
                  {popularSkills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => setSelectedSkill(skill)}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 whitespace-nowrap ${
                        selectedSkill === skill
                          ? 'bg-green-600 text-white border-green-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                {/* List of Editors (Upwork layout) */}
                {isLoadingAllEditors ? (
                  <div className="bg-white border border-gray-100 rounded-2xl text-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-400">Loading editors...</p>
                  </div>
                ) : !filteredEditors || filteredEditors.length === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl text-center py-16">
                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No matches found</h3>
                    <p className="text-sm text-gray-400 max-w-md mx-auto">
                      Try adjusting your search query or filters (like hourly rate or badge) to find editors.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredEditors.map((editor: any) => {
                      const isSaved = savedEditors?.some((s: any) => s.id === editor.id);
                      return (
                        <div key={editor.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                          {/* Video Thumbnail - Full width top */}
                          <div className="relative">
                            {editor.showcaseVideoUrl ? (
                              <div
                                className="aspect-[16/9] overflow-hidden cursor-pointer relative bg-black"
                                onMouseEnter={(e) => {
                                  const video = e.currentTarget.querySelector('video');
                                  if (video) video.play().catch(() => {});
                                }}
                                onMouseLeave={(e) => {
                                  const video = e.currentTarget.querySelector('video');
                                  if (video) video.pause();
                                }}
                                onClick={() => setShowProfileModal(editor.id)}
                              >
                                <video
                                  src={editor.showcaseVideoUrl}
                                  className="w-full h-full object-cover"
                                  muted
                                  playsInline
                                  preload="auto"
                                />
                                {editor.showcaseThumbnailUrl && (
                                  <img src={editor.showcaseThumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
                                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                                    <svg className="w-5 h-5 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M8 5v14l11-7z"/>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-[16/9] bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Card Body */}
                          <div className="p-4">
                            {/* User info row */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-shrink-0 relative">
                                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                                  {editor.avatarUrl ? (
                                    <img src={editor.avatarUrl} alt={editor.name} className="w-full h-full object-cover" loading="lazy" />
                                  ) : (
                                    <span className="text-xs font-bold text-green-700 bg-green-50 w-full h-full flex items-center justify-center">
                                      {editor.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 border-white rounded-full ${editor.available ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3
                                  className="text-sm font-bold text-gray-900 hover:text-green-600 cursor-pointer truncate"
                                  onClick={() => setShowProfileModal(editor.id)}
                                >
                                  {editor.name}
                                </h3>
                                <p className="text-xs text-gray-500 truncate">{editor.bio ? editor.bio.split('\n')[0] : 'Video Editor'}</p>
                              </div>
                              {user.role === 'CREATOR' && (
                                <button
                                  onClick={() => toggleSaveMutation.mutate(editor.id)}
                                  className={`p-1.5 rounded-full border transition-all flex-shrink-0 ${
                                    isSaved
                                      ? 'text-red-500 bg-red-50 border-red-200'
                                      : 'text-gray-300 bg-white border-gray-200 hover:text-red-400 hover:bg-red-50'
                                  }`}
                                >
                                  <Heart className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} />
                                </button>
                              )}
                            </div>

                            {/* Rating Row */}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2.5">
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                <span className="font-semibold text-gray-800">{editor.rating || 'New'}</span>
                                <span className="text-gray-400">({editor.reviews?.length || 0})</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${editor.activeCount >= (editor.maxSlots || 2) ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <span className={editor.activeCount >= (editor.maxSlots || 2) ? 'text-amber-600 font-medium' : 'text-emerald-600 font-medium'}>
                                  {editor.activeCount || 0}/{editor.maxSlots || 2}
                                </span>
                              </div>
                            </div>

                            {/* Skills */}
                            {editor.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {editor.skills.slice(0, 3).map((skill: string) => (
                                  <span key={skill} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[11px] font-medium rounded-md border border-gray-100">
                                    {skill}
                                  </span>
                                ))}
                                {editor.skills.length > 3 && (
                                  <span className="text-[11px] text-gray-400 font-medium px-1">+{editor.skills.length - 3}</span>
                                )}
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => setShowProfileModal(editor.id)}
                                className="flex-1 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
                              >
                                Profile
                              </button>
                              <Link
                                href={`/orders/new?editorId=${editor.id}`}
                                className="flex-1 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-all active:scale-[0.98] text-center"
                              >
                                Invite
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'saved' ? (
            <div className="max-w-4xl mx-auto space-y-6 mt-6 animate-fade-in">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Saved Editors</h2>
                {isLoadingSaved ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-sm text-gray-400">Loading saved editors...</p>
                  </div>
                ) : !savedEditors || savedEditors.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-6 h-6 text-gray-300" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">No saved editors yet</h3>
                    <p className="text-sm text-gray-400">
                      Save editors from the Browse tab to easily find them again.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedEditors.map((editor: any) => {
                      return (
                        <div key={editor.id} className="border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-all flex flex-col md:flex-row gap-4 items-start">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                            {editor.avatarUrl ? (
                              <img src={editor.avatarUrl} alt={editor.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-base font-bold text-green-700 bg-green-50 w-full h-full flex items-center justify-center">
                                {editor.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-bold text-gray-900 hover:text-green-600 cursor-pointer" onClick={() => setShowProfileModal(editor.id)}>
                                  {editor.name}
                                </h4>
                                <p className="text-xs font-semibold text-gray-700 mt-0.5">{editor.bio ? editor.bio.split('\n')[0] : 'Video Editor'}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => toggleSaveMutation.mutate(editor.id)}
                                  className="p-2 rounded-full text-red-500 bg-red-50 border border-red-100 hover:bg-red-100/50 transition-all"
                                >
                                  <Heart className="w-4 h-4" fill="currentColor" />
                                </button>
                                <Link
                                  href={`/orders/new?editorId=${editor.id}`}
                                  className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-bold text-xs shadow-sm transition-all"
                                >
                                  Invite
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            isLoading ? (
              <div className="pro-card text-center py-12">
                <p className="text-body text-gray-400">Loading orders...</p>
              </div>
            ) : !filteredOrders || filteredOrders.length === 0 ? (
              <div className="pro-card text-center py-12">
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'active' ? (
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ) : (
                    <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <h3 className="text-heading-sm text-charcoal mb-1">No {activeTab} orders</h3>
                {activeTab === 'active' && <p className="text-body text-gray-400 mb-6">Start by creating your first video editing order</p>}
                {user.role === 'CREATOR' && activeTab === 'active' && (
                  <Link href="/orders/new" className="btn-primary">
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Order</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className={`premium-card group hover:shadow-card-hover ${getJobCardGradient(order.editingLevel)}`}
                  >
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="text-caption font-bold text-charcoal flex-1 group-hover:text-brand transition-colors line-clamp-1">
                        {order.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-micro font-bold rounded-md whitespace-nowrap flex-shrink-0 ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    {order.description && (
                      <p className="text-body text-gray-400 mb-3 line-clamp-2">{order.description}</p>
                    )}
                    <div className="flex flex-wrap justify-between items-center gap-2 text-caption">
                      <span className="text-gray-400 truncate max-w-[60%]">
                        {user.role === 'CREATOR' ? (
                          order.status === 'OPEN' ? (
                            <span className="flex items-center text-blue-600 font-medium">
                              <Users className="w-3 h-3 mr-1" />
                              {order._count?.applications || 0} Applicants
                            </span>
                          ) : (
                            order.editor?.name || 'Unassigned'
                          )
                        ) : order.creator?.name}
                      </span>
                      {order.amount && (
                        <span className="font-bold text-brand whitespace-nowrap">₹{order.amount.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-micro text-gray-400">
                      <span>{order._count?.files || 0} files</span>
                      <span>{order._count?.messages || 0} comments</span>
                      <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      <YouTubeConnectModal
        isOpen={showYouTubeConnectModal}
        onClose={() => setShowYouTubeConnectModal(false)}
      />

      <EditorProfileModal
        editorId={showProfileModal}
        onClose={() => setShowProfileModal(null)}
      />

      <CreatorHandbookModal
        isOpen={showHandbookModal}
        onClose={() => setShowHandbookModal(false)}
      />
    </div>
  )
}
