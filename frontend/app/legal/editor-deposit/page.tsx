'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export default function EditorDepositPolicyPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-extrabold text-gray-900">Editor Deposit Policy</h1>
        <p className="text-gray-600 mt-2 text-sm">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-8 premium-card space-y-4 text-gray-700">
          <p>
            Editors lock a refundable security deposit when applying to a job. This ensures serious participation and reduces ghosting.
          </p>
          <p>
            Deposit amount is fixed based on job tier:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Basic Jobs:</strong> ₹199</li>
            <li><strong>Professional Jobs:</strong> ₹499</li>
            <li><strong>Premium Jobs:</strong> ₹1499</li>
          </ul>
          <p>
            Deposit is released when:
            (a) the creator rejects your application,
            (b) you complete the job properly,
            (c) the order is cancelled without your fault.
          </p>
          <p>
            Deposit may be deducted if you ghost after being assigned or repeatedly violate agreed timelines.
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
