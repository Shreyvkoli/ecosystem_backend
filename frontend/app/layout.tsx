import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import PWARegister from '@/components/PWARegister'
import InstallPWA from '@/components/InstallPWA'

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cutflow - Premium Video Editing Marketplace',
  description: 'Connect creators with professional video editors in a seamless, premium experience',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#108a00',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.className} bg-soft-gray text-charcoal antialiased selection:bg-brand/20 selection:text-brand-dark`}>
        <Providers>
          <PWARegister />
          <InstallPWA />
          {children}
        </Providers>
      </body>
    </html>
  )
}

