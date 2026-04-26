'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import Magnetic from '@/components/Magnetic'
import Logo from '@/components/Logo'
import HeroVisuals from '@/components/HeroVisuals'

export default function Home() {
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#a855f7', '#ec4899']
    })
  }

  return (
    <div className="relative min-h-screen bg-white">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo showWordmark size={36} />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {['Pricing', 'How it works', 'Trust & Safety', 'About'].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="text-gray-600 hover:text-brand transition-colors font-semibold text-sm"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-8">
            <Link href="/login" className="text-gray-600 hover:text-charcoal font-bold text-base">
              Log In
            </Link>
            <Link href="/register" className="btn-primary min-w-[140px] py-3 px-8 text-base">
              Sign Up
            </Link>
          </div>
        </header>

        <main className="pt-16 pb-28 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-charcoal leading-[1.1] tracking-tight">
              Get your video edited <br />
              <span className="text-brand">without the stress.</span>
            </h1>
            <p className="mt-8 text-xl text-gray-600 leading-relaxed font-medium">
              Hire vetted Indian editors. No ghosting, no storage mess, and <span className="text-charcoal font-bold">100% money protection.</span>
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-5">
              <Link href="/register?role=CREATOR" className="btn-primary px-10 py-4 shadow-xl shadow-brand/20 transition-transform hover:-translate-y-1">
                Hire an Editor
              </Link>
              <Link href="/register?role=EDITOR" className="btn-secondary px-10 py-4 border-2 hover:bg-gray-50 transition-all">
                I'm an Editor
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="hidden lg:block relative"
          >
            <div className="absolute -inset-10 bg-brand/5 blur-3xl rounded-full" />
            <HeroVisuals />
          </motion.div>
        </main>

        {/* Benefits - Icons & Text */}
        <section className="py-24 border-t border-gray-100">
          <div className="grid md:grid-cols-3 gap-16">
            <div className="space-y-6 group">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center text-3xl group-hover:bg-brand group-hover:text-white transition-colors duration-500">🤝</div>
              <h3 className="text-2xl font-bold text-charcoal">No Ghosting</h3>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">Editors pay a security deposit. They don't disappear, ever. Reliablity is built-in.</p>
            </div>
            <div className="space-y-6 group">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center text-3xl group-hover:bg-brand group-hover:text-white transition-colors duration-500">🛡️</div>
              <h3 className="text-2xl font-bold text-charcoal">Locked Payments</h3>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">Your money stays in Escrow. You pay only when you approve the final cut.</p>
            </div>
            <div className="space-y-6 group">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center text-3xl group-hover:bg-brand group-hover:text-white transition-colors duration-500">💬</div>
              <h3 className="text-2xl font-bold text-charcoal">Timestamp Chat</h3>
              <p className="text-gray-500 text-lg font-medium leading-relaxed">Click on the video to leave notes. No more confusing emails or timestamp typing.</p>
            </div>
          </div>
        </section>

        {/* How it Works - Stepped UI */}
        <section className="py-24 bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-[40px] border border-gray-100 mb-32">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-16 text-center tracking-tight">How it works</h2>
            <div className="grid md:grid-cols-3 gap-12 lg:gap-20">
              {[
                { step: "1", title: "Post your Link", desc: "Share your GDrive/Dropbox link and budget." },
                { step: "2", title: "Choose Editor", desc: "Vetted editors apply. Pick your match." },
                { step: "3", title: "Get Video", desc: "Review, approve, and download final cut." }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-16 h-16 bg-white border-2 border-gray-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-8 text-brand font-black text-2xl group-hover:border-brand transition-colors">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                  <p className="text-gray-600 font-medium leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Connection - Premium Dual Portrait */}
        <section className="py-20 mb-32">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-6 max-w-lg">
              <div className="inline-block px-3 py-1 bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest rounded-full">Global Reach</div>
              <h2 className="text-4xl md:text-5xl font-bold text-charcoal leading-tight tracking-tight">
                India's best for <br />
                <span className="text-brand">the World.</span>
              </h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Empowering India's top talent to serve world-class creators. Simple workflows, total peace of mind.
              </p>
            </div>
            <div className="relative h-[450px]">
              <div className="absolute top-0 right-0 z-10 w-[300px] shadow-xl rounded-[32px] overflow-hidden border-4 border-white transform hover:scale-105 transition-all duration-700">
                <img src="/indian-editor.png" alt="Talent" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
                  <p className="text-xs font-black text-gray-900">Rohit V.</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 z-20 w-[240px] shadow-xl rounded-[32px] overflow-hidden border-4 border-white transform rotate-3 hover:rotate-0 transition-all duration-700">
                <img src="/foreign-creator.png" alt="Client" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-white/20 shadow-sm">
                  <p className="text-sm font-black text-gray-900">Clara M.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-32">
          <div className="bg-charcoal p-12 md:p-28 rounded-[40px] text-center shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand/20 to-transparent opacity-20" />
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter relative z-10">Start your first project today.</h2>
            <p className="text-xl text-gray-400 mb-12 font-medium relative z-10 max-w-2xl mx-auto">Join the premium community of creators shipping content daily with Cutflow.</p>
            <Link href="/register?role=CREATOR" className="btn-primary text-xl px-12 py-5 shadow-2xl shadow-brand/40 relative z-10">
              Get Started Now
            </Link>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="pb-20 border-t border-gray-100 pt-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-[11px] font-black tracking-[0.3em] text-gray-400 uppercase">© {new Date().getFullYear()} CUTFLOW • MADE IN BHARAT</div>
            <div className="flex gap-12 text-[11px] font-black tracking-[0.2em] text-gray-400 uppercase">
              <Link href="/legal/terms" className="hover:text-brand transition-colors">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-brand transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-brand transition-colors">Support</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}


