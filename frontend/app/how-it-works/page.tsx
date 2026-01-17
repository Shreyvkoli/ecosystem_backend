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
                <div className="text-gray-900 font-semibold">1) Post an Order</div>
                <div className="text-gray-600 mt-1">Provide details, budget, and raw files (via Google Drive/Dropbox links).</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">2) Hire an Editor</div>
                <div className="text-gray-600 mt-1">Review applications from detailed profiles or directly hire a saved editor from your favorites.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">3) Secure Payment</div>
                <div className="text-gray-600 mt-1">Pay the order amount upfront. It's held safely in Escrow until you are satisfied.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">4) Review & Feedback</div>
                <div className="text-gray-600 mt-1">Watch streaming previews and leave frame-accurate comments for revisions.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">5) Approve or Dispute</div>
                <div className="text-gray-600 mt-1">Happy? Approve for final regular file. Unhappy? Raise a dispute for admin intervention.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">6) Final Delivery</div>
                <div className="text-gray-600 mt-1">Get the watermark-free final video. Payment is released to the editor automatically.</div>
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
                <div className="text-gray-900 font-semibold">1) Apply or Get Hired</div>
                <div className="text-gray-600 mt-1">Apply to open orders (security deposit may be required) or get directly hired by creators.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">2) Secure Work Start</div>
                <div className="text-gray-600 mt-1">Start working only after the Creator has funded the Escrow. Your payment is guaranteed.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">3) Submit Previews</div>
                <div className="text-gray-600 mt-1">Upload low-res watermarked previews for review. Receive precise timestamped feedback.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">4) Final Submission</div>
                <div className="text-gray-600 mt-1">After approval, upload the high-quality final video without watermarks.</div>
              </div>
              <div className="glass-morphism p-5">
                <div className="text-gray-900 font-semibold">5) Get Paid</div>
                <div className="text-gray-600 mt-1">Payment (90% of order value) is instantly released to your wallet upon completion.</div>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
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
