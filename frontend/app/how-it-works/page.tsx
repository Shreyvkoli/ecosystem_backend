'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import Magnetic from '@/components/Magnetic'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            How Cutflow Works
          </h1>
          <p className="text-gray-600 mt-4 text-lg font-medium">
            Simple, predictable workflow — split for creators and editors.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="pro-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-black bg-brand/10 text-brand px-2 py-1 rounded uppercase tracking-wider border border-brand/20">For Creators</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Post → Review → Approve</h2>
            <div className="mt-8 space-y-4">
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                <div className="text-gray-900 font-bold">1) Post an Order</div>
                <div className="text-gray-600 mt-1">Provide details, budget, and raw files (via Drive/Dropbox).</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                <div className="text-gray-900 font-bold">2) Hire an Editor</div>
                <div className="text-gray-600 mt-1">Review applications or directly hire saved favorites.</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                <div className="text-gray-900 font-bold">3) Secure Escrow</div>
                <div className="text-gray-600 mt-1">Funds are held safely until you approve the final cut.</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                <div className="text-gray-900 font-bold">4) Iterate with Feedback</div>
                <div className="text-gray-600 mt-1">Watch previews and leave frame-accurate comments.</div>
              </div>
            </div>
            <div className="mt-10">
              <Link href="/register?role=CREATOR" className="btn-primary w-full">
                Apply as Creator
              </Link>
            </div>
          </div>

          <div className="pro-card relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="text-[10px] font-black bg-charcoal/5 text-charcoal/60 px-2 py-1 rounded uppercase tracking-wider border border-charcoal/10">For Editors</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Apply → Execute → Get Paid</h2>
            <div className="mt-8 space-y-4">
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                <div className="text-gray-900 font-bold">1) Apply & Get Shortlisted</div>
                <div className="text-gray-600 mt-1">Browse projects and apply to global creators.</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                <div className="text-gray-900 font-bold">2) Confirm with Deposit</div>
                <div className="text-gray-600 mt-1">Pay a small commitment deposit to lock the project.</div>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
                <div className="text-gray-900 font-bold">3) Delivery & Payout</div>
                <div className="text-gray-600 mt-1">Submit previews, get feedback, and get paid instantly on approval.</div>
              </div>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register?role=EDITOR" className="btn-primary flex-1">
                Apply as Editor
              </Link>
              <Link href="/pricing" className="btn-secondary flex-1">
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
