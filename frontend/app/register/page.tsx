'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { setAuthToken, setUser } from '@/lib/auth'
import Link from 'next/link'
import Magnetic from '@/components/Magnetic'
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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-2 floating-animation">
            <Logo href="/" size={34} />
          </div>
          <h2 className="text-xl text-gray-600">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="glass-morphism border-red-500/30 text-red-300 p-4 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-2">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-600 mb-2">
                Join as:
              </label>
              <select
                id="role"
                name="role"
                className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'CREATOR' | 'EDITOR' })}
              >
                <option value="CREATOR" className="bg-gray-800">Creator (I need video editing)</option>
                <option value="EDITOR" className="bg-gray-800">Editor (I provide video editing)</option>
              </select>
            </div>

            <div>
              <label htmlFor="countryCode" className="block text-sm font-medium text-gray-600 mb-2">
                Country
              </label>
              <select
                id="countryCode"
                name="countryCode"
                className="w-full px-4 py-3 bg-white/10 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:bg-white/15"
                value={formData.countryCode}
                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
              >
                <option value="IN" className="bg-gray-800">India</option>
                <option value="US" className="bg-gray-800">United States</option>
                <option value="GB" className="bg-gray-800">United Kingdom</option>
                <option value="AE" className="bg-gray-800">United Arab Emirates</option>
                <option value="CA" className="bg-gray-800">Canada</option>
                <option value="AU" className="bg-gray-800">Australia</option>
                <option value="SG" className="bg-gray-800">Singapore</option>
                <option value="OTHER" className="bg-gray-800">Other</option>
              </select>
            </div>
          </div>

          <div>
            <Magnetic strength={0.4}>
              <button
                type="submit"
                disabled={loading}
                className="premium-button w-full text-lg neon-glow hover-lift"
              >
                {loading ? 'Creating account...' : 'Join Cutflow'}
              </button>
            </Magnetic>
          </div>

          <div className="text-center">
            <Link href="/login" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-300">
              Already have an account? <span className="font-semibold">Sign in to Cutflow</span>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

