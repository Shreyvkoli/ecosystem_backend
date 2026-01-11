import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { InfiniteGridBackground } from '@/components/ui/the-infinite-grid'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cutflow - Premium Video Editing Marketplace',
  description: 'Connect creators with professional video editors in a seamless, premium experience',
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
            {children}
          </InfiniteGridBackground>
        </Providers>
      </body>
    </html>
  )
}

