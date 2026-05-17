'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import Link from 'next/link'
import { ShieldIllustration } from '@/components/FreehandIllustrations'

export default function TrustPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-10 items-center mb-12">
          <div className="max-w-2xl">
            <span className="text-micro text-charcoal/60 uppercase tracking-widest">Safety first</span>
            <h1 className="text-display-sm text-charcoal mt-2 tracking-tight">
              Trust & Safety
            </h1>
            <p className="text-body-lg text-charcoal/50 mt-3">
              Cutflow is designed to prevent ghosting and protect files with clear rules.
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <ShieldIllustration className="w-40 h-44 drop-shadow-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { title: 'Why deposits exist', desc: 'Editors lock a refundable deposit when they apply. This reduces spam and ensures editors take assignments seriously.' },
            { title: 'Ghosting Policy', desc: 'If an editor ghosts, their deposit is deducted. If a creator disappears, jobs are cancelled and deposits released safely.' },
            { title: 'Disputes & Fairness', desc: 'We review chat + file timelines to apply policy fairly. Milestone-based workflows ensure everyone stays aligned.' },
            { title: 'File Security', desc: 'Raw files are stored privately. Only assigned editors can access downloads, protecting your IP at all times.' },
          ].map((item, i) => (
            <div key={i} className="p-7 rounded-2xl bg-white/40 backdrop-blur-sm border border-charcoal/8 hover:border-charcoal/15 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 hover:bg-white/60">
              <h2 className="text-heading-sm text-charcoal">{item.title}</h2>
              <p className="text-body text-charcoal/50 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-charcoal rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-heading text-white">Want the full rules?</div>
            <div className="text-body text-gray-400 mt-1">Read the exact legal policies for deposits and refunds.</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
            <Link href="/legal/editor-deposit" className="btn-primary whitespace-nowrap">
              Editor Deposit Policy
            </Link>
            <Link href="/legal/refund" className="btn-base bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-[0.98] whitespace-nowrap">
              Refund Policy
            </Link>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
