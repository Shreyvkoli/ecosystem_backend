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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-sm font-bold text-brand uppercase tracking-wider"
            >
              India's #1 Video Editing Marketplace
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-charcoal leading-[1.05] tracking-tight">
              Hire vetted <br />
              <span className="text-brand">video editors.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-xl leading-relaxed">
              Cutflow replaces email chains with a professional dashboard. Zero storage uploads, refundable editor deposits, and <span className="font-semibold text-gray-800">100% Escrow Protection</span>.
            </p>

            <div className="flex flex-col sm:flex-row flex-wrap gap-5 mt-8 w-full sm:w-auto">
              {/* Hire Editor Button */}
              <Magnetic strength={0.35} className="w-full sm:w-auto">
                <Link
                  href="/register?role=CREATOR"
                  onClick={triggerConfetti}
                  className="btn-primary w-full sm:w-auto text-lg"
                >
                  Hire an Editor
                </Link>
              </Magnetic>

              {/* Apply as Editor Button */}
              <div className="flex flex-col w-full sm:w-auto">
                <Magnetic strength={0.35} className="w-full sm:w-auto">
                  <Link href="/register?role=EDITOR" className="btn-secondary w-full sm:w-auto text-lg hover:text-brand-dark">
                    Apply as Editor
                  </Link>
                </Magnetic>
                <div className="text-xs text-gray-400 mt-3 text-center sm:text-left font-medium max-w-[200px] mx-auto sm:mx-0">
                  <span className="text-green-500">Video Editors:</span> Build portfolio & get paid instantly.
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Visuals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            className="relative"
          >
            <HeroVisuals />
          </motion.div>
        </main>

        {/* Features Section */}
        <section className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Creators Choose Cutflow</h2>
            <p className="mt-4 text-gray-600">Built for high-volume content creators who need reliability.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Zero-Storage Tech", desc: "Keep your files on GDrive/Dropbox. We just sync the links. No re-uploading terabytes.", icon: "🚀" },
              { title: "Escrow Protection", desc: "Payments are locked in Cutflow's secure wallet. Editors get paid only when you approve.", icon: "🛡️" },
              { title: "Timestamp Feedback", desc: "Click anywhere on the video to leave a comment. Editors see exactly what to fix.", icon: "🎯" }
            ].map((feature, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                key={i}
                className="pro-card hover:bg-gray-50/50"
              >
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold text-charcoal mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-lg">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Global Marketplace Section */}
        <section className="mt-40 bg-soft-gray rounded-[40px] p-10 md:p-20 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center px-4 py-1 rounded-full bg-brand/10 text-brand text-xs font-black uppercase tracking-[0.2em]">
                The Global Connect
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-charcoal leading-tight">
                Bridging Indian Talent with <span className="text-brand">Global Creators.</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                We empower India's most skilled video editors to serve world-class content creators. Professional workflows, guaranteed payments, and seamless communication.
              </p>
              <div className="flex items-center gap-10 pt-4">
                <div>
                  <p className="text-3xl font-bold text-charcoal">500+</p>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Vetted Editors</p>
                </div>
                <div className="w-px h-12 bg-gray-200" />
                <div>
                  <p className="text-3xl font-bold text-charcoal">10K+</p>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Videos Delivered</p>
                </div>
              </div>
            </div>
            <div className="relative py-10">
              {/* Overlapping Images for a Premium Look */}
              <div className="relative z-10 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white transform -rotate-3 hover:rotate-0 transition-transform duration-500 max-w-[400px] ml-auto">
                <img src="/indian-editor.png" alt="Indian Video Editor" className="w-full aspect-square object-cover" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest">Our Talent</p>
                  <p className="text-sm font-bold text-charcoal">Rohit V., Sr. Editor</p>
                </div>
              </div>
              <div className="absolute top-1/4 -left-10 z-20 rounded-[32px] overflow-hidden shadow-2xl border-8 border-white transform rotate-6 hover:rotate-0 transition-transform duration-500 max-w-[300px] hidden lg:block">
                <img src="/foreign-creator.png" alt="Global Creator" className="w-full aspect-[4/5] object-cover" />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                  <p className="text-[10px] font-black text-brand uppercase tracking-widest">Our Client</p>
                  <p className="text-sm font-bold text-charcoal">Clara M., YouTuber</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="mt-32 mb-20">
          <div className="bg-charcoal p-10 md:p-20 rounded-[32px] relative overflow-hidden text-center shadow-2xl">
            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">Ready to streamline your video production?</h2>
              <p className="text-xl text-gray-300">Join 100+ creators and editors shipping content daily.</p>

              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                <Link
                  href="/register?role=CREATOR"
                  className="btn-primary text-xl px-12 py-5 shadow-xl shadow-brand/20"
                >
                  Start Hiring Now
                </Link>
              </div>
              <p className="text-sm text-gray-400 font-medium">No credit card required for signup</p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="mt-20 border-t border-gray-200 py-10">
          <div className="flex flex-wrap justify-center gap-10 text-sm text-gray-500 font-semibold">
            <Link href="/legal/terms" className="hover:text-brand transition-colors">Terms of Service</Link>
            <Link href="/legal/privacy" className="hover:text-brand transition-colors">Privacy Policy</Link>
            <Link href="/legal/refund" className="hover:text-brand transition-colors">Refund Policy</Link>
            <Link href="/contact" className="hover:text-brand transition-colors">Support</Link>
          </div>
          <div className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Cutflow. Built for the Indian Creator Economy.
          </div>
        </footer>
      </div>
    </div>
  )
}


