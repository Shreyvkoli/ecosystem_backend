'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'

export default function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-gray-100 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Logo href="/" size={22} />
            <p className="text-caption text-gray-400 mt-3 leading-relaxed">
              Premium video editing marketplace with deposit-backed reliability.
            </p>
          </div>

          <div>
            <div className="text-micro text-gray-400 uppercase tracking-widest mb-4">Product</div>
            <div className="space-y-2.5">
              <Link href="/pricing" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">Pricing</Link>
              <Link href="/how-it-works" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">How it works</Link>
              <Link href="/trust" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">Trust & Safety</Link>
            </div>
          </div>

          <div>
            <div className="text-micro text-gray-400 uppercase tracking-widest mb-4">Company</div>
            <div className="space-y-2.5">
              <Link href="/about" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">About</Link>
              <Link href="/contact" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">Contact</Link>
            </div>
          </div>

          <div>
            <div className="text-micro text-gray-400 uppercase tracking-widest mb-4">Legal</div>
            <div className="space-y-2.5">
              <Link href="/legal/terms" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">Terms of Service</Link>
              <Link href="/legal/privacy" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">Privacy Policy</Link>
              <Link href="/legal/refund" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">Refund Policy</Link>
              <Link href="/legal/editor-deposit" className="block text-caption text-gray-500 hover:text-charcoal transition-colors">Editor Deposit Policy</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-micro text-gray-400">© {new Date().getFullYear()} Cutflow. All rights reserved.</div>
          <div className="text-micro text-gray-400">Support: support@cutflow.in</div>
        </div>
      </div>
    </footer>
  )
}
