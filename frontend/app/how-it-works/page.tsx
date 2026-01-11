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
          <h1 className="text-5xl font-extrabold text-gray-900">
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">How Cutflow Works</span>
          </h1>
          <p className="text-gray-600 mt-4 text-lg">
            Simple, predictable workflow — split for creators and editors.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-sm text-indigo-300 font-bold">Creator</div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Post → review → approve → done</h2>
            <div className="mt-6 space-y-4">
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">1) Apply as Creator</div>
                <div className="text-gray-600 mt-1">Create an order with title, brief, and budget.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">2) Upload raw video</div>
                <div className="text-gray-600 mt-1">Raw files are stored privately. Only you (and admin) can access until an editor is assigned.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">3) Review applications</div>
                <div className="text-gray-600 mt-1">See editor profiles, wallet-backed applications, and choose the best fit.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">4) Approve editor</div>
                <div className="text-gray-600 mt-1">Once approved, the editor is assigned and can access raw download links.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">5) Review preview + request revisions</div>
                <div className="text-gray-600 mt-1">Preview submitted → request revision → final submission.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">6) Mark completed</div>
                <div className="text-gray-600 mt-1">Close the order once final deliverables are submitted.</div>
              </div>
            </div>
            <div className="mt-8">
              <Magnetic strength={0.35}>
                <Link href="/register?role=CREATOR" className="premium-button">Apply as Creator</Link>
              </Magnetic>
            </div>
          </div>

          <div className="premium-card group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative text-sm text-purple-300 font-bold">Editor</div>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Deposit → apply → deliver → get refunded</h2>
            <div className="mt-6 space-y-4">
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">1) Top up wallet</div>
                <div className="text-gray-600 mt-1">Maintain enough balance for the refundable security deposit.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">2) Apply to jobs (deposit locked)</div>
                <div className="text-gray-600 mt-1">Deposit locks at apply-time. If rejected, it’s released back to your wallet.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">3) Get assigned</div>
                <div className="text-gray-600 mt-1">Only assigned editors can download raw files.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">4) Start work + submit preview</div>
                <div className="text-gray-600 mt-1">Work in stages for clarity: preview → revision → final.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">5) Submit final + close</div>
                <div className="text-gray-600 mt-1">When job is completed properly, deposit is released/refunded.</div>
              </div>
            </div>
            <div className="mt-8 flex gap-3">
              <Magnetic strength={0.35}>
                <Link href="/register?role=EDITOR" className="premium-button">Apply as Editor</Link>
              </Magnetic>
              <Magnetic strength={0.35}>
                <Link href="/pricing" className="glass-morphism px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white/15 transition-all">
                  Pricing
                </Link>
              </Magnetic>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
