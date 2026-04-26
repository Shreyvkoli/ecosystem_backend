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

        <main className="mt-16 sm:mt-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <h1 className="text-5xl sm:text-7xl font-bold text-charcoal leading-tight tracking-tight">
              Get your <br />
              <span className="text-brand">video edited</span> <br />
              without the stress.
            </h1>

            <p className="text-xl text-gray-600 max-w-xl leading-relaxed font-medium">
              Hire vetted Indian editors. No ghosting, no file management mess, and <span className="text-charcoal font-bold">100% money protection.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-5 mt-8">
              <Link href="/register?role=CREATOR" className="btn-primary text-xl px-10 py-5">
                Hire an Editor
              </Link>
              <Link href="/register?role=EDITOR" className="btn-secondary text-xl px-10 py-5">
                Apply as Editor
              </Link>
            </div>
          </motion.div>

          {/* Right Visuals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <HeroVisuals />
          </motion.div>
        </main>

        {/* The "Why" - Simple & Bold */}
        <section className="mt-40">
          <div className="grid md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <div className="text-4xl">🤝</div>
              <h3 className="text-2xl font-bold text-charcoal">No Ghosting</h3>
              <p className="text-gray-500 font-medium">Editors pay a security deposit. They don't disappear, ever.</p>
            </div>
            <div className="space-y-4">
              <div className="text-4xl">🛡️</div>
              <h3 className="text-2xl font-bold text-charcoal">Locked Payments</h3>
              <p className="text-gray-500 font-medium">Your money stays in Escrow. You pay only when you approve.</p>
            </div>
            <div className="space-y-4">
              <div className="text-4xl">💬</div>
              <h3 className="text-2xl font-bold text-charcoal">Easy Feedback</h3>
              <p className="text-gray-500 font-medium">Click on any frame to leave a comment. No more confusing emails.</p>
            </div>
          </div>
        </section>

        {/* How it works - 3 Simple Steps */}
        <section className="mt-40 bg-gray-50 rounded-[40px] p-10 md:p-20 border border-gray-100">
          <h2 className="text-4xl md:text-5xl font-bold text-charcoal mb-16 text-center">How it works</h2>
          <div className="grid md:grid-cols-3 gap-16">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">1</div>
              <h4 className="text-xl font-bold">Post your Link</h4>
              <p className="text-gray-500">Share your GDrive/Dropbox link and your budget.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">2</div>
              <h4 className="text-xl font-bold">Pick an Editor</h4>
              <p className="text-gray-500">Vetted editors apply. Pick the one you like.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-brand text-white rounded-full flex items-center justify-center mx-auto font-bold text-xl">3</div>
              <h4 className="text-xl font-bold">Approve & Download</h4>
              <p className="text-gray-500">Review the cuts, give feedback, and download your final video.</p>
            </div>
          </div>
        </section>

        {/* Global Connection Section - Simplified */}
        <section className="mt-40 py-10 relative overflow-hidden">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-bold text-charcoal leading-tight">
                India's best talent for <span className="text-brand">Global Creators.</span>
              </h2>
              <p className="text-xl text-gray-500 font-medium leading-relaxed">
                We connect India's top video editors with creators worldwide. Professional, safe, and built for speed.
              </p>
            </div>
            <div className="relative py-12 px-10">
              <div className="relative z-10 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white transform -rotate-3 hover:rotate-0 transition-transform duration-500 max-w-[380px] ml-auto">
                <img src="/indian-editor.png" alt="Our Talent" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                  <p className="text-sm font-bold text-charcoal">Rohit V., Sr. Editor</p>
                </div>
              </div>
              <div className="absolute top-1/3 -left-16 z-20 rounded-[32px] overflow-hidden shadow-2xl border-8 border-white transform rotate-6 hover:rotate-0 transition-transform duration-500 max-w-[280px] hidden lg:block">
                <img src="/foreign-creator.png" alt="Our Client" className="w-full aspect-[4/5] object-cover" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                  <p className="text-sm font-bold text-charcoal">Clara M., YouTuber</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="mt-40 mb-20">
          <div className="bg-charcoal p-10 md:p-20 rounded-[40px] text-center shadow-2xl">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">Start your first project.</h2>
            <p className="text-xl text-gray-400 mb-12">Join 100+ creators and editors shipping daily.</p>
            <Link href="/register?role=CREATOR" className="btn-primary text-xl px-12 py-5 shadow-xl shadow-brand/20">
              Get Started
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="mt-20 border-t border-gray-100 py-10">
          <div className="flex flex-wrap justify-center gap-10 text-xs text-gray-400 font-bold uppercase tracking-widest">
            <Link href="/legal/terms" className="hover:text-brand transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-brand transition-colors">Privacy</Link>
            <Link href="/legal/refund" className="hover:text-brand transition-colors">Refunds</Link>
            <Link href="/contact" className="hover:text-brand transition-colors">Support</Link>
          </div>
          <div className="text-center text-[10px] text-gray-400 mt-8 font-medium">
            © {new Date().getFullYear()} CUTFLOW. MADE IN INDIA.
          </div>
        </footer>
      </div>
    </div>
  )
}


