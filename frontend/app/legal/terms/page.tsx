'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export default function TermsPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-extrabold text-gray-900">Terms of Service</h1>
        <p className="text-gray-600 mt-2 text-sm">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-8 premium-card space-y-4 text-gray-700">
          <p>
            These Terms govern your use of Cutflow. By accessing or using the platform, you agree to these Terms.
          </p>
          <p>
            Cutflow connects creators with editors. We provide tooling for job posting, applications, file handling, and review workflows.
          </p>
          <p>
            You are responsible for your content, timelines, and lawful use of the platform.
          </p>
          <p>
            Payments, refunds, and deposits are governed by the Refund Policy and Editor Deposit Policy.
          </p>
          <p>
            We may suspend accounts that violate these rules or abuse the marketplace.
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
