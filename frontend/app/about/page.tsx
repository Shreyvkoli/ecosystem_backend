'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-extrabold text-gray-900">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">About Cutflow</span>
          </h1>
          <p className="text-gray-600 mt-6 text-lg">
            We built Cutflow to solve a real problem: creators need reliable editors, and editors deserve serious clients.
          </p>
          <p className="text-gray-600 mt-4">
            Most marketplaces fail because of ghosting and unclear workflows. Cutflow fixes that with a refundable editor deposit, milestone-based delivery, and secure file permissions.
          </p>
          <p className="text-gray-600 mt-4">
            Starting in India, built for global creators — premium edits, predictable timelines, and trust-first execution.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-gray-900 font-semibold">Trust-first</div>
            <div className="text-gray-600 text-sm mt-1">Deposit-backed applications reduce ghosting.</div>
          </div>
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-gray-900 font-semibold">Workflow clarity</div>
            <div className="text-gray-600 text-sm mt-1">Preview → revision → final keeps deliveries aligned.</div>
          </div>
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-gray-900 font-semibold">Secure files</div>
            <div className="text-gray-600 text-sm mt-1">Private storage with controlled download access.</div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
