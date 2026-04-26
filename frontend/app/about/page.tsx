'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            About Cutflow
          </h1>
          <p className="text-gray-600 mt-6 text-lg font-medium">
            We built Cutflow to solve a real problem: creators need reliable editors, and editors deserve serious clients.
          </p>
          <p className="text-gray-600 mt-4 leading-relaxed font-medium">
            Most marketplaces fail because of ghosting and unclear workflows. Cutflow fixes that with a refundable editor deposit, milestone-based delivery, and secure file permissions.
          </p>
          <p className="text-gray-600 mt-4 leading-relaxed font-medium">
            Starting in India, built for global creators — premium edits, predictable timelines, and trust-first execution.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="pro-card relative overflow-hidden">
            <div className="text-brand font-black text-xs uppercase tracking-widest mb-3">Trust</div>
            <div className="relative text-gray-900 font-bold text-xl">Deposit-backed</div>
            <div className="text-gray-600 text-sm mt-3 font-medium">Applications reduce ghosting frequency by 90% compared to open markets.</div>
          </div>
          <div className="pro-card relative overflow-hidden">
            <div className="text-brand font-black text-xs uppercase tracking-widest mb-3">Clarity</div>
            <div className="relative text-gray-900 font-bold text-xl">Linear Workflow</div>
            <div className="text-gray-600 text-sm mt-3 font-medium">Preview → revision → final keeps deliveries aligned and expectations clear.</div>
          </div>
          <div className="pro-card relative overflow-hidden">
            <div className="text-brand font-black text-xs uppercase tracking-widest mb-3">Security</div>
            <div className="relative text-gray-900 font-bold text-xl">Private Access</div>
            <div className="text-gray-600 text-sm mt-3 font-medium">Private storage with strict controlled download access for all project files.</div>
          </div>
        </div>

        <div className="mt-20 text-center bg-gray-50 rounded-3xl p-12 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900">Join the next-gen editing marketplace</h2>
          <p className="text-gray-600 mt-4 mb-10 max-w-xl mx-auto font-medium">Whether you are a creator looking for quality or an editor looking for serious work, Cutflow is for you.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register?role=CREATOR" className="btn-primary w-full sm:w-auto">Join as Creator</Link>
            <Link href="/register?role=EDITOR" className="btn-secondary w-full sm:w-auto">Join as Editor</Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
