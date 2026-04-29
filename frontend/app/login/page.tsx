'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authApi } from '@/lib/api'
import { setAuthToken, setUser } from '@/lib/auth'
import Link from 'next/link'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authApi.login({ email, password })
      setAuthToken(response.data.token)
      setUser(response.data.user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
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
            Welcome back
          </h2>
          <p className="text-body text-gray-400 mt-1">
            Sign in to manage your video projects
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-xl text-charcoal placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-body"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full !py-3 shadow-brand disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>

            <div className="text-center pt-2">
              <p className="text-caption text-gray-400">
                New to Cutflow?{' '}
                <Link href="/register" className="text-brand hover:text-brand-dark font-semibold transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
