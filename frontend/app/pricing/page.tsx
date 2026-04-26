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
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            Pricing
          </h1>
          <p className="text-gray-600 mt-4 text-lg font-medium">
            Cutflow is designed to be transparent. Creators pay only when they approve an editor. Editors place a refundable security deposit to prevent ghosting.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="pro-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-black bg-brand/10 text-brand px-2 py-1 rounded uppercase tracking-wider border border-brand/20">For Creators</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Pay only when you approve</h2>
            <div className="mt-8 space-y-4">
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl transition-all hover:border-brand/30">
                <div className="text-gray-900 font-bold">Platform fee</div>
                <div className="text-gray-600 mt-1">5–10% per completed order</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl transition-all hover:border-brand/30">
                <div className="text-gray-900 font-bold">Posting fee</div>
                <div className="text-gray-600 mt-1">₹0 — post unlimited jobs</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl transition-all hover:border-brand/30">
                <div className="text-gray-900 font-bold">When you pay</div>
                <div className="text-gray-600 mt-1">Pay only when you approve an editor (order gets assigned)</div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register?role=CREATOR" className="btn-primary flex-1">
                Apply as Creator
              </Link>
              <Link href="/how-it-works" className="btn-secondary flex-1">
                See Workflow
              </Link>
            </div>
          </div>

          <div className="pro-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-black bg-charcoal/5 text-charcoal/60 px-2 py-1 rounded uppercase tracking-wider border border-charcoal/10">For Editors</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Refundable security deposit</h2>
            <p className="text-gray-600 mt-3 font-medium">
              The deposit makes the marketplace reliable. It prevents editors from applying and disappearing.
            </p>

            <div className="mt-6 space-y-4">
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl transition-all hover:border-brand/30">
                <div className="text-gray-900 font-bold">Deposit range</div>
                <div className="text-gray-600 mt-1">₹500 – ₹2,000 (refundable)</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl transition-all hover:border-brand/30">
                <div className="text-gray-900 font-bold">When it gets locked</div>
                <div className="text-gray-600 mt-1">When you apply to a job (deposit is locked)</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl transition-all hover:border-brand/30">
                <div className="text-gray-900 font-bold">When it gets refunded</div>
                <div className="text-gray-600 mt-1">When creator rejects your application, or you complete the job properly</div>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register?role=EDITOR" className="btn-primary flex-1">
                Apply as Editor
              </Link>
              <Link href="/legal/editor-deposit" className="btn-secondary flex-1">
                Full Policy
              </Link>
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
