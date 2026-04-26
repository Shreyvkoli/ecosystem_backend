'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mb-12">
          <span className="text-micro text-brand uppercase tracking-widest">Transparent pricing</span>
          <h1 className="text-display-sm text-charcoal mt-2 tracking-tight">
            Simple, honest pricing.
          </h1>
          <p className="text-body-lg text-gray-400 mt-3">
            Creators pay only when they approve. Editors place a refundable deposit to prevent ghosting.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Creator Card */}
          <div className="pro-card relative overflow-hidden">
            <div className="absolute top-5 right-5">
              <span className="text-micro font-bold bg-brand-light text-brand px-2.5 py-1 rounded-md uppercase tracking-wider border border-brand/10">For Creators</span>
            </div>
            <h2 className="text-heading-sm text-charcoal mt-1">Pay only when you approve</h2>
            <div className="mt-6 space-y-3">
              {[
                { label: 'Platform fee', value: '5–10% per completed order' },
                { label: 'Posting fee', value: '₹0 — post unlimited jobs' },
                { label: 'When you pay', value: 'Only when you approve an editor' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-xl hover:border-brand/20 transition-colors">
                  <div className="text-caption font-bold text-charcoal">{item.label}</div>
                  <div className="text-body text-gray-500 mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register?role=CREATOR" className="btn-primary flex-1">Apply as Creator</Link>
              <Link href="/how-it-works" className="btn-secondary flex-1">See Workflow</Link>
            </div>
          </div>

          {/* Editor Card */}
          <div className="pro-card relative overflow-hidden">
            <div className="absolute top-5 right-5">
              <span className="text-micro font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md uppercase tracking-wider border border-gray-200">For Editors</span>
            </div>
            <h2 className="text-heading-sm text-charcoal mt-1">Refundable security deposit</h2>
            <p className="text-body text-gray-400 mt-2">
              The deposit makes the marketplace reliable and prevents spam applications.
            </p>
            <div className="mt-6 space-y-3">
              {[
                { label: 'Deposit range', value: '₹500 – ₹2,000 (refundable)' },
                { label: 'When it gets locked', value: 'When you apply to a job' },
                { label: 'When it gets refunded', value: 'On rejection or job completion' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-xl hover:border-brand/20 transition-colors">
                  <div className="text-caption font-bold text-charcoal">{item.label}</div>
                  <div className="text-body text-gray-500 mt-0.5">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register?role=EDITOR" className="btn-primary flex-1">Apply as Editor</Link>
              <Link href="/legal/editor-deposit" className="btn-secondary flex-1">Full Policy</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pro-card !bg-gray-50 !border-gray-100">
          <div className="text-caption font-bold text-charcoal">Note</div>
          <p className="text-body text-gray-500 mt-1">
            The exact deposit and fees may vary by order size and risk. We'll always show the final amount clearly before you confirm.
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
