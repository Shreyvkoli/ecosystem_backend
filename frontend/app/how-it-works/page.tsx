'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mb-12">
          <span className="text-micro text-brand uppercase tracking-widest">Workflow</span>
          <h1 className="text-display-sm text-charcoal mt-2 tracking-tight">
            How Cutflow Works
          </h1>
          <p className="text-body-lg text-gray-400 mt-3">
            Simple, predictable workflow — split for creators and editors.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Creator Flow */}
          <div className="pro-card relative overflow-hidden">
            <div className="absolute top-5 right-5">
              <span className="text-micro font-bold bg-brand-light text-brand px-2.5 py-1 rounded-md uppercase tracking-wider border border-brand/10">For Creators</span>
            </div>
            <h2 className="text-heading-sm text-charcoal mt-1">Post → Review → Approve</h2>
            <div className="mt-6 space-y-3">
              {[
                { step: '1', title: 'Post an Order', desc: 'Provide details, budget, and raw files (via Drive/Dropbox).' },
                { step: '2', title: 'Hire an Editor', desc: 'Review applications or directly hire saved favorites.' },
                { step: '3', title: 'Secure Escrow', desc: 'Funds are held safely until you approve the final cut.' },
                { step: '4', title: 'Iterate with Feedback', desc: 'Watch previews and leave frame-accurate comments.' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex gap-4 items-start">
                  <div className="w-7 h-7 bg-brand-light text-brand rounded-lg flex items-center justify-center text-micro font-bold flex-shrink-0 border border-brand/10">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-caption font-bold text-charcoal">{item.title}</div>
                    <div className="text-body text-gray-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link href="/register?role=CREATOR" className="btn-primary w-full">Apply as Creator</Link>
            </div>
          </div>

          {/* Editor Flow */}
          <div className="pro-card relative overflow-hidden">
            <div className="absolute top-5 right-5">
              <span className="text-micro font-bold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-md uppercase tracking-wider border border-gray-200">For Editors</span>
            </div>
            <h2 className="text-heading-sm text-charcoal mt-1">Apply → Execute → Get Paid</h2>
            <div className="mt-6 space-y-3">
              {[
                { step: '1', title: 'Apply & Get Shortlisted', desc: 'Browse projects and apply to global creators.' },
                { step: '2', title: 'Confirm with Deposit', desc: 'Pay a small commitment deposit to lock the project.' },
                { step: '3', title: 'Delivery & Payout', desc: 'Submit previews, get feedback, and get paid on approval.' },
              ].map((item, i) => (
                <div key={i} className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex gap-4 items-start">
                  <div className="w-7 h-7 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center text-micro font-bold flex-shrink-0 border border-gray-200">
                    {item.step}
                  </div>
                  <div>
                    <div className="text-caption font-bold text-charcoal">{item.title}</div>
                    <div className="text-body text-gray-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register?role=EDITOR" className="btn-primary flex-1">Apply as Editor</Link>
              <Link href="/pricing" className="btn-secondary flex-1">Pricing</Link>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
