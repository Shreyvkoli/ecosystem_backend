'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mb-12">
          <span className="text-micro text-brand uppercase tracking-widest">Our story</span>
          <h1 className="text-display-sm text-charcoal mt-2 tracking-tight">
            About Cutflow
          </h1>
          <div className="space-y-4 mt-5">
            <p className="text-body-lg text-gray-500 leading-relaxed">
              We built Cutflow to solve a real problem: creators need reliable editors, and editors deserve serious clients.
            </p>
            <p className="text-body text-gray-400 leading-relaxed">
              Most marketplaces fail because of ghosting and unclear workflows. Cutflow fixes that with a refundable editor deposit, milestone-based delivery, and secure file permissions.
            </p>
            <p className="text-body text-gray-400 leading-relaxed">
              Starting in India, built for global creators — premium edits, predictable timelines, and trust-first execution.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { tag: 'Trust', title: 'Deposit-backed', desc: 'Deposits reduce ghosting by 90% compared to open markets.' },
            { tag: 'Clarity', title: 'Linear Workflow', desc: 'Preview → revision → final keeps deliveries aligned.' },
            { tag: 'Security', title: 'Private Access', desc: 'Strict controlled download access for all project files.' },
          ].map((item, i) => (
            <div key={i} className="pro-card">
              <div className="text-micro text-brand font-bold uppercase tracking-widest mb-3">{item.tag}</div>
              <div className="text-heading-sm text-charcoal">{item.title}</div>
              <div className="text-body text-gray-400 mt-2">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-charcoal rounded-3xl p-12">
          <h2 className="text-heading text-white">Join the next-gen editing marketplace</h2>
          <p className="text-body text-gray-400 mt-3 mb-8 max-w-lg mx-auto">
            Whether you are a creator looking for quality or an editor looking for serious work, Cutflow is for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register?role=CREATOR" className="btn-primary">Join as Creator</Link>
            <Link href="/register?role=EDITOR" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">Join as Editor</Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
