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
    <div className="relative min-h-screen overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg"></div>

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
                className="text-gray-600 hover:text-indigo-600 transition-colors font-medium text-sm hover-lift"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm hover:underline">
              Login
            </Link>
            <Magnetic strength={0.25}>
              <Link href="/register" className="glass-morphism px-5 py-2.5 text-gray-900 hover:text-indigo-600 border-gray-200 hover:border-indigo-200 text-sm font-semibold whitespace-nowrap transition-all shadow-sm hover:shadow-md">
                Join Now
              </Link>
            </Magnetic>
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
              className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/40 border border-indigo-100 backdrop-blur-md text-sm font-medium text-indigo-900 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
              India's Most Reliable Video Editing Marketplace
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight">
              Hire vetted Indian editors.
              <span className="block text-gradient-primary mt-2">
                Review with Timestamp Feedback.
              </span>
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
                  <Link href="/register?role=EDITOR" className="btn-secondary w-full sm:w-auto text-lg hover:text-indigo-700">
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
                className="glass-card p-8 hover:bg-white/90"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <div className="mt-32 mb-20">
          <div className="glass-morphism p-10 md:p-16 rounded-3xl relative overflow-hidden text-center">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 z-0"></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900">Ready to streamline your video production?</h2>
              <p className="text-xl text-gray-600">Join 100+ creators and editors shipping content daily.</p>

              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
                <Link
                  href="/register?role=CREATOR"
                  className="premium-button-green text-lg px-8 py-4 shadow-xl shadow-green-500/20"
                >
                  Start Hiring Now
                </Link>
              </div>
              <p className="text-sm text-gray-400">No credit card required for signup</p>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="mt-20 border-t border-gray-200 py-10">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500 font-medium">
            <Link href="/legal/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link>
            <Link href="/legal/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link>
            <Link href="/legal/refund" className="hover:text-indigo-600 transition-colors">Refund Policy</Link>
            <Link href="/contact" className="hover:text-indigo-600 transition-colors">Support</Link>
          </div>
          <div className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Cutflow. Built for the Indian Creator Economy.
          </div>
        </footer>
      </div>
    </div>
  )
}


