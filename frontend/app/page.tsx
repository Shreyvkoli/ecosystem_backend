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
            <Logo showWordmark size={32} />
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

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-gray-600 hover:text-charcoal font-bold text-sm">
              Log In
            </Link>
            <Link href="/register" className="btn-primary min-w-[120px] py-2 px-6 text-sm">
              Sign Up
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="pt-20 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <h1 className="text-5xl sm:text-7xl font-bold text-charcoal leading-[1.1] tracking-tight">
              Video editing <br />
              <span className="text-brand">without the stress.</span>
            </h1>
            <p className="mt-8 text-xl sm:text-2xl text-gray-600 leading-relaxed font-medium">
              Hire vetted Indian editors. No ghosting, no storage mess, and <span className="text-charcoal font-bold">100% money protection.</span>
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link href="/register?role=CREATOR" className="btn-primary text-lg px-12 py-5 shadow-2xl shadow-brand/20 transition-transform hover:-translate-y-1">
                Hire an Editor
              </Link>
              <Link href="/register?role=EDITOR" className="btn-secondary text-lg px-12 py-5 border-2 hover:bg-gray-50 transition-all">
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
        <section className="py-32 bg-[#F9FAFB] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 rounded-[60px] border border-gray-100 mb-40">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-20 text-center tracking-tight">How it works</h2>
            <div className="grid md:grid-cols-3 gap-20">
              {[
                { step: "1", title: "Post your Link", desc: "Share your GDrive link and budget." },
                { step: "2", title: "Pick Editor", desc: "Vetted editors apply. Pick your match." },
                { step: "3", title: "Download", desc: "Review, approve, and get your video." }
              ].map((item, i) => (
                <div key={i} className="text-center group">
                  <div className="w-14 h-14 bg-white border-2 border-gray-100 shadow-sm rounded-full flex items-center justify-center mx-auto mb-8 text-brand font-black text-xl group-hover:border-brand transition-colors">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                  <p className="text-gray-500 font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Global Connection - Premium Dual Portrait */}
        <section className="py-20 mb-40">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8 max-w-xl">
              <div className="inline-block px-4 py-1 bg-brand/10 text-brand text-xs font-black uppercase tracking-widest rounded-full">Global Reach</div>
              <h2 className="text-4xl md:text-6xl font-bold text-charcoal leading-tight">
                India's best editors for <br />
                <span className="text-brand">Global Creators.</span>
              </h2>
              <p className="text-xl text-gray-500 font-medium leading-relaxed">
                We empower India's top talent to serve the world's best creators. Professional workflows, guaranteed money, and total peace of mind.
              </p>
            </div>
            <div className="relative h-[500px]">
              <div className="absolute top-0 right-0 z-10 w-[350px] shadow-2xl rounded-[40px] overflow-hidden border-8 border-white transform hover:scale-105 transition-transform duration-500">
                <img src="/indian-editor.png" alt="Talent" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border border-white/20 shadow-sm">
                  <p className="text-xs font-bold text-charcoal uppercase tracking-tighter">Verified Editor</p>
                  <p className="text-base font-black text-gray-900">Rohit V.</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 z-20 w-[280px] shadow-2xl rounded-[40px] overflow-hidden border-8 border-white transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <img src="/foreign-creator.png" alt="Client" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl border border-white/20 shadow-sm">
                  <p className="text-xs font-bold text-brand uppercase tracking-tighter">Top Creator</p>
                  <p className="text-base font-black text-gray-900">Clara M.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-40">
          <div className="bg-charcoal p-12 md:p-32 rounded-[60px] text-center shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand/20 to-transparent opacity-20" />
            <h2 className="text-4xl md:text-7xl font-bold text-white mb-8 tracking-tighter relative z-10">Start your first project.</h2>
            <p className="text-xl text-gray-400 mb-16 font-medium relative z-10">Join 100+ creators shipping content daily with Cutflow.</p>
            <Link href="/register?role=CREATOR" className="btn-primary text-xl px-16 py-6 shadow-2xl shadow-brand/40 relative z-10">
              Get Started
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


