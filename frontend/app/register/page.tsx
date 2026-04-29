'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { setAuthToken, setUser } from '@/lib/auth'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'CREATOR' as 'CREATOR' | 'EDITOR',
    countryCode: 'IN'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const role = new URLSearchParams(window.location.search).get('role')
    if (role === 'CREATOR' || role === 'EDITOR') {
      setFormData((p) => ({ ...p, role }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.register(formData)
      setAuthToken(response.data.token)
      setUser(response.data.user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-mint via-mint-light to-mint py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo href="/" size={36} />
          </div>
          <h2 className="text-heading text-charcoal">
            Create your account
          </h2>
          <p className="text-body text-gray-400 mt-1">
            Join the community of creators and editors
          </p>
        </div>

        <div className="pro-card !p-8 !shadow-elevated">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl text-caption">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-micro text-gray-400 uppercase tracking-widest mb-2 ml-0.5">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-charcoal placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-body"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-micro text-gray-400 uppercase tracking-widest mb-2 ml-0.5">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-charcoal placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-body"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-micro text-gray-400 uppercase tracking-widest mb-2 ml-0.5">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-charcoal placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-body"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              {/* Role Selector */}
              <div>
                <label className="block text-micro text-gray-400 uppercase tracking-widest mb-3 ml-0.5">
                  Join As
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'CREATOR', label: 'Creator', desc: 'I need editing' },
                    { id: 'EDITOR', label: 'Editor', desc: 'I edit videos' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: opt.id as 'CREATOR' | 'EDITOR' })}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        formData.role === opt.id
                          ? 'border-brand bg-brand-light/50'
                          : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                      }`}
                    >
                      <div className={`font-bold text-caption ${formData.role === opt.id ? 'text-brand-dark' : 'text-charcoal'}`}>
                        {opt.label}
                      </div>
                      <div className="text-micro text-gray-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="countryCode" className="block text-micro text-gray-400 uppercase tracking-widest mb-2 ml-0.5">
                  Country
                </label>
                <select
                  id="countryCode"
                  name="countryCode"
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-charcoal focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-body"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                >
                  <option value="IN">🇮🇳 India</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="AE">🇦🇪 United Arab Emirates</option>
                  <option value="CA">🇨🇦 Canada</option>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="SG">🇸🇬 Singapore</option>
                  <option value="OTHER">🌍 Other</option>
                </select>
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3 shadow-brand disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Join Cutflow'}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-caption text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-brand hover:text-brand-dark font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
