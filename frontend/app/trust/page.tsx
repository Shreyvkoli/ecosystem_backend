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
          <h1 className="text-5xl font-extrabold text-gray-900">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Trust & Safety</span>
          </h1>
          <p className="text-gray-600 mt-4 text-lg">
            Cutflow is designed to prevent ghosting and protect files with clear rules.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="text-2xl font-bold text-gray-900">Why deposits exist</h2>
            </div>
            <p className="text-gray-600 mt-3">
              Editors lock a refundable deposit when they apply. This reduces spam and ensures editors take assignments seriously.
            </p>
          </div>
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="text-2xl font-bold text-gray-900">What happens if someone ghosts</h2>
            </div>
            <p className="text-gray-600 mt-3">
              If an editor is assigned and then ghosts, their deposit can be deducted as per policy. If a creator disappears after approval, the job can be cancelled and deposits are released.
            </p>
          </div>
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="text-2xl font-bold text-gray-900">Disputes & fairness</h2>
            </div>
            <p className="text-gray-600 mt-3">
              We use a milestone-based workflow (preview → revision → final). If there’s a dispute, we review chat + file timeline and apply the policy fairly.
            </p>
          </div>
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative">
              <h2 className="text-2xl font-bold text-gray-900">File security</h2>
            </div>
            <p className="text-gray-600 mt-3">
              Raw files are stored privately (S3). Only the creator (and admin) can access raw downloads until an editor is assigned. After assignment, only the assigned editor can download.
            </p>
          </div>
        </div>

        <div className="mt-12 glass-morphism p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">Want the full rules?</div>
            <div className="text-gray-600 mt-1">Read the exact legal policies for deposits and refunds.</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Magnetic strength={0.35}>
              <Link href="/legal/editor-deposit" className="premium-button">Editor Deposit Policy</Link>
            </Magnetic>
            <Magnetic strength={0.35}>
              <Link href="/legal/refund" className="glass-morphism px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white/15 transition-all">
                Refund Policy
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
