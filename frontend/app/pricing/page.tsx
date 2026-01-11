'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import Magnetic from '@/components/Magnetic'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-extrabold text-gray-900">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Pricing</span>
          </h1>
          <p className="text-gray-600 mt-4 text-lg">
            Cutflow is designed to be transparent. Creators pay only when they approve an editor. Editors place a refundable security deposit to prevent ghosting.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-sm text-indigo-300 font-bold">For Creators</div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Pay only when you approve an editor</h2>
            <div className="mt-6 space-y-4">
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">Platform fee</div>
                <div className="text-gray-600 mt-1">5–10% per completed order</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">Posting fee</div>
                <div className="text-gray-600 mt-1">₹0 — post unlimited jobs</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">When you pay</div>
                <div className="text-gray-600 mt-1">Pay only when you approve an editor (order gets assigned)</div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Magnetic strength={0.35}>
                <Link href="/register?role=CREATOR" className="premium-button">Apply as Creator</Link>
              </Magnetic>
              <Magnetic strength={0.35}>
                <Link href="/how-it-works" className="glass-morphism px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white/15 transition-all">
                  See flow
                </Link>
              </Magnetic>
            </div>
          </div>

          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-sm text-purple-300 font-bold">For Editors</div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Refundable security deposit</h2>
            <p className="text-gray-600 mt-3">
              The deposit makes the marketplace reliable. It prevents editors from applying and disappearing.
            </p>

            <div className="mt-6 space-y-4">
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">Deposit range</div>
                <div className="text-gray-600 mt-1">₹500 – ₹2,000 (refundable)</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">When it gets locked</div>
                <div className="text-gray-600 mt-1">When you apply to a job (deposit is locked)</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">When it gets refunded</div>
                <div className="text-gray-600 mt-1">When creator rejects your application, or you complete the job properly</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">When it can be deducted</div>
                <div className="text-gray-600 mt-1">If you ghost after being assigned, or violate the delivery timeline repeatedly</div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Magnetic strength={0.35}>
                <Link href="/register?role=EDITOR" className="premium-button">Apply as Editor</Link>
              </Magnetic>
              <Magnetic strength={0.35}>
                <Link href="/legal/editor-deposit" className="glass-morphism px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white/15 transition-all">
                  Full policy
                </Link>
              </Magnetic>
            </div>
          </div>
        </div>

        <div className="mt-12 glass-morphism p-6">
          <div className="text-gray-900 font-semibold">Note</div>
          <p className="text-gray-600 mt-2">
            The exact deposit and fees may vary by order size and risk. We’ll always show the final amount clearly before you confirm.
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
