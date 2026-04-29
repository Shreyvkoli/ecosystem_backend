'use client'

import Link from 'next/link'
import Logo from '@/components/Logo'

export default function PublicNav() {
  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <Logo href="/" size={28} />
        <nav className="hidden md:flex items-center gap-7">
          {[
            { label: 'Pricing', href: '/pricing' },
            { label: 'How it works', href: '/how-it-works' },
            { label: 'Trust & Safety', href: '/trust' },
            { label: 'About', href: '/about' },
            { label: 'Support', href: '/contact' },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-charcoal/60 hover:text-charcoal transition-colors text-caption"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-charcoal/60 hover:text-charcoal font-medium text-caption">
            Login
          </Link>
          <Link href="/register" className="btn-primary !py-2 !px-5 !text-sm !rounded-lg">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
