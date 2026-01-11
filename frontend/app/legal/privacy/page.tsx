'use client'

import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-4xl font-extrabold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-600 mt-2 text-sm">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="mt-8 premium-card space-y-4 text-gray-700">
          <p>
            We collect account information (name, email) and usage data required to operate Cutflow.
          </p>
          <p>
            Files are stored privately. Access is controlled based on your role and order assignment.
          </p>
          <p>
            We do not sell your personal data.
          </p>
          <p>
            You may request deletion of your account by contacting support.
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
