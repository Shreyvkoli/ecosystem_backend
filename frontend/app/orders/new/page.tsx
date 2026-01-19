'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ordersApi, usersApi } from '@/lib/api'
import { getUser } from '@/lib/auth'
import Navbar from '@/components/Navbar'

import { Suspense } from 'react'

function NewOrderContent() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    brief: '',
    amount: '',
    editorId: '',
    rawFootageDuration: '',
    expectedDuration: '',
    editingLevel: 'BASIC',
    referenceLink: '',
    deadline: ''
  })

  const [recommendedBudget, setRecommendedBudget] = useState<number | null>(null)
  const [budgetError, setBudgetError] = useState<string | null>(null)

  const searchParams = useSearchParams()

  useEffect(() => {
    const currentUser = getUser()
    setUser(currentUser)
    setIsLoading(false)

    if (!currentUser || currentUser.role !== 'CREATOR') {
      router.push('/dashboard')
    }
  }, [router])

  // Pre-select editor if query param exists
  useEffect(() => {
    const editorIdParam = searchParams.get('editorId')
    if (editorIdParam) {
      setFormData(prev => ({ ...prev, editorId: editorIdParam }))
    }
  }, [searchParams])

  // Calculate Recommended Budget logic
  useEffect(() => {
    const finalMins = parseFloat(formData.expectedDuration) || 0
    const rawMins = parseFloat(formData.rawFootageDuration) || 0
    const rawHours = rawMins / 60 // Convert minutes to hours

    // Config based on User's Formula:
    // Basic: Base 500, Final 100/min, Raw 100/hr
    // Professional: Base 2000, Final 300/min, Raw 250/hr
    // Premium: Base 5000, Final 800/min, Raw 600/hr

    let config = {
      'BASIC': { base: 500, perMin: 100, rawHr: 100 },
      'PROFESSIONAL': { base: 2000, perMin: 300, rawHr: 250 },
      'PREMIUM': { base: 5000, perMin: 800, rawHr: 600 }
    }

    // Default to BASIC if undefined/invalid
    const levelKey = (formData.editingLevel || 'BASIC') as keyof typeof config
    const s = config[levelKey] || config['BASIC']

    // If inputs are empty/zero, show nothing or just Base rate?
    // Let's show nothing until at least Final Duration is entered.
    if (finalMins <= 0) {
      setRecommendedBudget(null)
      return
    }

    // Formula: Base + (FinalMins * Rate) + (RawHours * Fee)
    let total = s.base + (finalMins * s.perMin) + (rawHours * s.rawHr)

    // Rounding off to nearest 500 for a clean look
    total = Math.ceil(total / 500) * 500

    setRecommendedBudget(total)

    // Auto-set the amount to the recommended budget description
    setFormData(prev => ({ ...prev, amount: total.toString() }))
    setBudgetError(null)
  }, [formData.expectedDuration, formData.rawFootageDuration, formData.editingLevel])

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setFormData({ ...formData, amount: val })

    if (recommendedBudget && val) {
      const numVal = parseFloat(val)
      const min = recommendedBudget * 0.9
      const max = recommendedBudget * 1.1

      if (numVal < min || numVal > max) {
        setBudgetError(`Budget must be within 10% (₹${Math.round(min)} - ₹${Math.round(max)}) to ensure quality.`)
      } else {
        setBudgetError(null)
      }
    } else {
      setBudgetError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Block submit if error exists
    if (budgetError) return

    createMutation.mutate({
      title: formData.title,
      description: formData.description || undefined,
      brief: formData.brief || undefined,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      editorId: formData.editorId || undefined,
      rawFootageDuration: formData.rawFootageDuration ? parseFloat(formData.rawFootageDuration) : undefined,
      expectedDuration: formData.expectedDuration ? parseFloat(formData.expectedDuration) : undefined,
      editingLevel: formData.editingLevel,
      referenceLink: formData.referenceLink || undefined,
      deadline: formData.deadline ? new Date(formData.deadline).toISOString() : undefined,
    })
  }

  // Define interfaces here if needed to avoid typescript errors in mutationFn,
  // but better to rely on type inference or implicit any for now to be fast.
  const createMutation = useMutation({
    mutationFn: (data: any) =>
      ordersApi.create(data),
    onSuccess: (response) => {
      router.push(`/orders/${response.data.id}`)
    },
  })

  // Fetch Saved Editors
  const { data: savedEditors } = useQuery({
    queryKey: ['saved-editors'],
    queryFn: async () => {
      try {
        const response = await usersApi.listSavedEditors()
        return response.data
      } catch (e) {
        return []
      }
    },
    enabled: !!user && user.role === 'CREATOR',
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar lightTheme={true} />
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'CREATOR') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar lightTheme={true} />
      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Order</h1>

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
            {createMutation.error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">
                  {(createMutation.error as any)?.response?.data?.error || 'Failed to create order'}
                </p>
              </div>
            )}


            {/* Preferred Editor Selection */}
            {savedEditors && savedEditors.length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100">
                <label htmlFor="editorId" className="block text-sm font-medium text-indigo-900 mb-2">
                  Directly Hire a Saved Editor (Optional)
                </label>
                <select
                  id="editorId"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
                  value={formData.editorId}
                  onChange={(e) => setFormData({ ...formData, editorId: e.target.value })}
                >
                  <option value="">-- Open for all editors --</option>
                  {savedEditors.map((editor: any) => (
                    <option key={editor.id} value={editor.id}>
                      {editor.name} ({editor.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-indigo-700">
                  Selecting an editor will assign this order directly to them.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Order Title *
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* New Detailed Fields */}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rawFootageDuration" className="block text-sm font-medium text-gray-700">
                  Raw Footage Duration (Minutes)
                </label>
                <input
                  type="number"
                  id="rawFootageDuration"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
                  value={formData.rawFootageDuration}
                  onChange={(e) => setFormData({ ...formData, rawFootageDuration: e.target.value })}
                  placeholder="e.g. 60"
                />
              </div>
              <div>
                <label htmlFor="expectedDuration" className="block text-sm font-medium text-gray-700">
                  Expected Final Duration (Minutes)
                </label>
                <input
                  type="number"
                  id="expectedDuration"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
                  value={formData.expectedDuration}
                  onChange={(e) => setFormData({ ...formData, expectedDuration: e.target.value })}
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Editing Level</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'BASIC', label: 'Basic', desc: 'Standard cuts, basic titles, and background music.' },
                  { id: 'PROFESSIONAL', label: 'Professional', desc: 'Motion graphics, sound effects, B-roll, and dynamic subtitles.', popular: true },
                  { id: 'PREMIUM', label: 'Premium', desc: 'Advanced VFX, custom storytelling, high-end sound design, and cinematic grading.' }
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setFormData({ ...formData, editingLevel: option.id })}
                    className={`relative cursor-pointer rounded-xl border p-4 text-left transition-all hover:shadow-lg ${formData.editingLevel === option.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                      : 'border-gray-200 bg-white hover:border-indigo-300'
                      }`}
                  >
                    {option.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-0.5 rounded-full shadow-sm">
                        Most Popular
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className={`font-bold ${formData.editingLevel === option.id ? 'text-indigo-900' : 'text-gray-900'}`}>
                        {option.label}
                      </div>
                      {formData.editingLevel === option.id && (
                        <div className="h-4 w-4 rounded-full bg-indigo-600"></div>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-500 leading-relaxed">
                      {option.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="referenceLink" className="block text-sm font-medium text-gray-700">
                Reference Link (Style Inspiration)
              </label>
              <input
                type="url"
                id="referenceLink"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
                value={formData.referenceLink}
                onChange={(e) => setFormData({ ...formData, referenceLink: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Deadline (By when do you need this?)
              </label>
              <input
                type="date"
                id="deadline"
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="brief" className="block text-sm font-medium text-gray-700">
                Editing Brief *
              </label>
              <textarea
                id="brief"
                rows={6}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 text-gray-900"
                placeholder="Describe what editing you need... (transitions, color correction, music, etc.)"
                value={formData.brief}
                onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Budget (₹)
                </label>
                {recommendedBudget !== null && (
                  <div
                    onClick={() => setFormData({ ...formData, amount: recommendedBudget.toString() })}
                    className="cursor-pointer flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full hover:bg-green-200 transition-colors"
                  >
                    <span>✨ Recommended: ₹{recommendedBudget}</span>
                  </div>
                )}
              </div>
              <input
                type="number"
                id="amount"
                min="0"
                step="0.01"
                className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm px-3 py-2 text-gray-900 ${budgetError
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                value={formData.amount}
                onChange={handleAmountChange}
                placeholder={recommendedBudget ? `Suggested: ₹${recommendedBudget}` : 'Enter amount'}
              />
              {budgetError && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {budgetError}
                </p>
              )}
              {recommendedBudget !== null && !budgetError && (
                <p className="mt-1 text-xs text-gray-500">
                  Based on {formData.expectedDuration} min {formData.editingLevel.toLowerCase()} edit + raw footage processing.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Navbar lightTheme={true} />
        <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <NewOrderContent />
    </Suspense>
  )
}

