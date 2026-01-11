'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'

export default function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-gray-900">
              <Logo href="/" size={22} />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Premium video editing marketplace with deposit-backed reliability.
            </p>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Product</div>
            <div className="space-y-2 text-sm">
              <Link href="/pricing" className="block text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="/how-it-works" className="block text-gray-600 hover:text-gray-900">How it works</Link>
              <Link href="/trust" className="block text-gray-600 hover:text-gray-900">Trust & Safety</Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Company</div>
            <div className="space-y-2 text-sm">
              <Link href="/about" className="block text-gray-600 hover:text-gray-900">About</Link>
              <Link href="/contact" className="block text-gray-600 hover:text-gray-900">Contact</Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">Legal</div>
            <div className="space-y-2 text-sm">
              <Link href="/legal/terms" className="block text-gray-600 hover:text-gray-900">Terms of Service</Link>
              <Link href="/legal/privacy" className="block text-gray-600 hover:text-gray-900">Privacy Policy</Link>
              <Link href="/legal/refund" className="block text-gray-600 hover:text-gray-900">Refund Policy</Link>
              <Link href="/legal/editor-deposit" className="block text-gray-600 hover:text-gray-900">Editor Deposit Policy</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 text-xs text-gray-500 flex flex-col md:flex-row items-center justify-between gap-3">
          <div>© {new Date().getFullYear()} Cutflow. All rights reserved.</div>
          <div className="text-gray-600">Support: support@yourdomain.com</div>
        </div>
      </div>
    </footer>
  )
}
