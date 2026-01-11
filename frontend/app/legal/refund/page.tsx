'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-extrabold text-gray-900">Refund Policy</h1>
        <p className="text-gray-600 mt-2 text-sm">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-8 premium-card space-y-4 text-gray-700">
          <p>
            Refund rules depend on the order stage (open, assigned, in progress, preview submitted, final submitted).
          </p>
          <p>
            Creator payments are intended to be released based on successful completion of milestones.
          </p>
          <p>
            If an order is cancelled before assignment, deposits (if any) are released back to editors.
          </p>
          <p>
            If a dispute occurs, Cutflow may review timeline and evidence to apply fair resolution.
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
