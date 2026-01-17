'use client'

import Link from 'next/link'
import Magnetic from '@/components/Magnetic'
import Logo from '@/components/Logo'
import CreatorEditorIllustrations from '@/components/CreatorEditorIllustrations'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo showWordmark size={26} />
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">Pricing</Link>
          <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">How it works</Link>
          <Link href="/trust" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">Trust & Safety</Link>
          <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">About</Link>
          <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-sm">Support</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
            Login
          </Link>
          <Magnetic strength={0.25}>
            <Link href="/register" className="glass-morphism px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-semibold whitespace-nowrap">
              Join
            </Link>
          </Magnetic>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 border border-white/10 text-sm text-gray-700">
            A professional video-editing marketplace that actually finishes projects
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
            Hire vetted editors.
            <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Review in-browser. Zero ghosting.
            </span>
          </h1>
          <p className="text-lg text-gray-600 max-w-xl">
            Cutflow uses refundable editor wallet balances, private file handling, and a clean review workflow so projects move fast and finish right.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-6 sm:gap-4 mt-4 w-full sm:w-auto">
            <Magnetic strength={0.35} className="w-full sm:w-auto">
              <Link href="/register?role=CREATOR" className="premium-button-no-shimmer neon-glow w-full sm:w-auto text-center justify-center flex items-center">
                Apply as Creator
              </Link>
            </Magnetic>
            <div className="flex flex-col w-full sm:w-auto">
              <Magnetic strength={0.35} className="w-full sm:w-auto">
                <Link href="/register?role=EDITOR" className="glass-morphism px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white/15 transition-all w-full sm:w-auto text-center block border-transparent">
                  Apply as Editor
                </Link>
              </Magnetic>
              <div className="text-xs text-gray-400 mt-4 max-w-xs mx-auto sm:mx-0 text-center sm:text-left">
                For editors: Your wallet balance is never platform profit. It is refundable or adjusted in your first payout.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <CreatorEditorIllustrations />
        </div>
      </div>

      <div className="mt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">WHY CREATORS USE CUTFLOW</h2>
        <div className="premium-card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative space-y-4">
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">You focus on creating — editing runs in background.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Travel, shoot, post. Editing tension = zero.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">No file chaos. No lost drives. Everything in one place.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Faster turnaround because editors are financially committed.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Shoot today. Review from anywhere tomorrow.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Clear revisions. Clean finish. No drama.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">WHY EDITORS USE CUTFLOW</h2>
        <div className="premium-card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative space-y-4">
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">No chasing creators for money.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">No vague feedback. Every comment is timestamped.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">All files, versions, and chats in one place.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Work with serious creators only.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Your time is protected.</div>
            </div>
            <div className="flex items-start gap-3 group/item">
              <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
              <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">One dashboard. Zero chaos.</div>
            </div>
          </div>
        </div>
      </div>


      <div className="mt-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Trust & Safety</h2>
        <div className="premium-card group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="text-lg text-gray-900 mb-4 relative">Your money and files are always protected.</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="space-y-4">
              <div className="flex items-start gap-3 group/item">
                <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
                <div>
                  <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Editor wallet balances are refundable or adjusted in payouts</div>
                </div>
              </div>
              <div className="flex items-start gap-3 group/item">
                <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
                <div>
                  <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Creator payments are locked before work begins</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 group/item">
                <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
                <div>
                  <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Files are stored privately with access control</div>
                </div>
              </div>
              <div className="flex items-start gap-3 group/item">
                <div className="text-green-400 mt-1 group-hover/item:scale-125 transition-transform duration-300">•</div>
                <div>
                  <div className="text-gray-900 font-medium group-hover/item:text-green-300 transition-colors duration-300">Payments processed via trusted providers (Razorpay)</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-center text-gray-600">No hidden fees. No forced lock-ins.</div>
          </div>
        </div>
      </div>

      <div className="mt-20 glass-morphism p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-2xl font-bold text-gray-900">Ready to ship your next edit?</div>
          <div className="text-gray-600 mt-1">Apply as a creator on Cutflow or apply as an editor in under 2 minutes.</div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap gap-6 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <Magnetic strength={0.35} className="w-full sm:w-auto">
            <Link href="/register?role=CREATOR" className="premium-button-no-shimmer neon-glow w-full sm:w-auto text-center justify-center flex items-center">
              Apply as Creator
            </Link>
          </Magnetic>
          <div className="flex flex-col w-full sm:w-auto">
            <Magnetic strength={0.35} className="w-full sm:w-auto">
              <Link href="/register?role=EDITOR" className="glass-morphism px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white/15 transition-all w-full sm:w-auto text-center block border-transparent">
                Apply as Editor
              </Link>
            </Magnetic>
            <div className="text-xs text-gray-400 mt-4 max-w-xs mx-auto sm:mx-0 text-center sm:text-left">
              For editors: Your wallet balance is never platform profit. It is refundable or adjusted in your first payout.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 text-sm text-gray-400 flex flex-wrap gap-4 justify-center">
        <Link href="/legal/terms" className="hover:text-gray-700">Terms</Link>
        <Link href="/legal/privacy" className="hover:text-gray-700">Privacy</Link>
        <Link href="/legal/refund" className="hover:text-gray-700">Refund Policy</Link>
        <Link href="/legal/editor-deposit" className="hover:text-gray-700">Editor Deposit Policy</Link>
        <Link href="/trust" className="hover:text-gray-700">Payments & Wallet FAQ</Link>
      </div>
    </div>
  )
}

