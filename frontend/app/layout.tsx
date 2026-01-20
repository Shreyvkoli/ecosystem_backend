import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { InfiniteGridBackground } from '@/components/ui/the-infinite-grid'
import PWARegister from '@/components/PWARegister'
import InstallPWA from '@/components/InstallPWA'

const inter = Inter({ subsets: ['latin'] })

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
  themeColor: '#4f46e5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <InfiniteGridBackground>
            <PWARegister />
            <InstallPWA />
            {children}
          </InfiniteGridBackground>
        </Providers>
      </body>
    </html>
  )
}

