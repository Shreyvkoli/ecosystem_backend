'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import Magnetic from '@/components/Magnetic'
import Link from 'next/link'

export default function TrustPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            <span className="text-brand">Trust</span> & <span className="text-charcoal opacity-80">Safety</span>
          </h1>
          <p className="text-gray-600 mt-4 text-lg font-medium">
            Cutflow is designed to prevent ghosting and protect files with clear rules.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="pro-card relative overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-900">Why deposits exist</h2>
            <p className="text-gray-600 mt-3 font-medium">
              Editors lock a refundable deposit when they apply. This reduces spam and ensures editors take assignments seriously.
            </p>
          </div>
          <div className="pro-card relative overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-900">Ghosting Policy</h2>
            <p className="text-gray-600 mt-3 font-medium">
              If an editor ghosts, their deposit is deducted. If a creator disappears, jobs are cancelled and deposits released safely.
            </p>
          </div>
          <div className="pro-card relative overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-900">Disputes & Fairness</h2>
            <p className="text-gray-600 mt-3 font-medium">
              We review chat + file timelines to apply policy fairly. Milestone-based workflows ensure everyone stays aligned.
            </p>
          </div>
          <div className="pro-card relative overflow-hidden">
            <h2 className="text-2xl font-bold text-gray-900">File Security</h2>
            <p className="text-gray-600 mt-3 font-medium">
              Raw files are stored privately. Only assigned editors can access downloads, protecting your IP at all times.
            </p>
          </div>
        </div>

        <div className="mt-16 bg-gray-50 border border-gray-100 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="text-3xl font-bold text-gray-900">Want the full rules?</div>
            <div className="text-gray-600 mt-2 font-medium">Read the exact legal policies for deposits and refunds.</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Link href="/legal/editor-deposit" className="btn-primary whitespace-nowrap">
              Editor Deposit Policy
            </Link>
            <Link href="/legal/refund" className="btn-secondary whitespace-nowrap">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
