'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import HeroVisuals from '@/components/HeroVisuals'
import { HeroIllustration, HandshakeIllustration, ShieldIllustration, ChatIllustration, WorkflowIllustration, GlobeIllustration } from '@/components/FreehandIllustrations'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-mint overflow-hidden">
      {/* Background patterns for texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      {/* Subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-mint-light via-mint/50 to-transparent pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* ─── NAV ─── */}
        <header className="flex items-center justify-between py-2">
          <Link href="/" className="flex items-center">
            <Logo showWordmark size={32} />
          </Link>
          <nav className="hidden md:flex items-center gap-7">
            {['Pricing', 'How it works', 'Trust & Safety', 'About'].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="text-charcoal/60 hover:text-charcoal transition-colors text-caption tracking-tight"
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-charcoal/60 hover:text-charcoal font-medium text-caption">
              Log In
            </Link>
            <Link href="/register" className="btn-primary !py-2.5 !px-6 !text-sm !rounded-lg">
              Get Started
            </Link>
          </div>
        </header>

        {/* ─── HERO ─── */}
        <main className="pt-20 pb-28 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/40 backdrop-blur-sm rounded-full mb-6 border border-charcoal/10">
              <span className="w-1.5 h-1.5 bg-brand rounded-full animate-pulse" />
              <span className="text-micro text-charcoal/70 uppercase tracking-wider">Now live — India's first</span>
            </div>

            <h1 className="text-[3.2rem] sm:text-[3.8rem] lg:text-display font-bold text-charcoal leading-[1.08] tracking-tight">
              Get your video edited{' '}
              <span className="text-charcoal/70">without the stress.</span>
            </h1>

            <p className="mt-6 text-body-lg text-charcoal/60 leading-relaxed max-w-md">
              Hire vetted Indian editors. No ghosting, no storage mess, and{' '}
              <span className="text-charcoal font-semibold">100% money protection.</span>
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/register?role=CREATOR" className="btn-primary shadow-brand">
                Hire an Editor
              </Link>
              <Link href="/register?role=EDITOR" className="btn-base bg-charcoal text-white hover:bg-charcoal/90 active:scale-[0.98]">
                I'm an Editor
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  'bg-white/60 text-charcoal',
                  'bg-brand/20 text-charcoal',
                  'bg-white/40 text-charcoal',
                  'bg-charcoal/10 text-charcoal'
                ].map((cls, i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-mint ${cls} flex items-center justify-center text-xs font-bold`}>
                    {['S', 'R', 'A', 'P'][i]}
                  </div>
                ))}
              </div>
              <p className="text-caption text-charcoal/50">
                <span className="text-charcoal font-semibold">50+</span> editors joined this month
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <div className="absolute -inset-16 bg-gradient-to-br from-brand/[0.08] via-transparent to-mint-dark/[0.1] blur-3xl rounded-full" />
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <HeroIllustration className="w-full max-w-lg mx-auto drop-shadow-lg" />
            </motion.div>
          </motion.div>
        </main>

        {/* ─── BENEFITS ─── */}
        <section className="py-20 border-t border-charcoal/10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-heading text-charcoal tracking-tight">Why creators choose Cutflow</h2>
            <p className="text-body text-charcoal/50 mt-3 max-w-lg mx-auto">Built from scratch to solve the biggest problems in hiring video editors.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { illustration: <HandshakeIllustration className="w-24 h-24" />, title: "No Ghosting", desc: "Editors pay a security deposit. They don't disappear — reliability is built in." },
              { illustration: <ShieldIllustration className="w-24 h-24" />, title: "Locked Payments", desc: "Your money stays in Escrow. You pay only when you approve the final cut." },
              { illustration: <ChatIllustration className="w-24 h-24" />, title: "Timestamp Chat", desc: "Click on the video to leave notes. No more confusing emails or timestamp typing." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-7 rounded-2xl bg-white/40 backdrop-blur-sm border border-charcoal/8 hover:border-charcoal/15 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 hover:bg-white/60"
              >
                <div className="group-hover:scale-105 transition-transform duration-300">
                  {item.illustration}
                </div>
                <h3 className="text-heading-sm text-charcoal mt-4">{item.title}</h3>
                <p className="text-body text-charcoal/60 mt-2 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="py-20 bg-charcoal -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8 rounded-[32px] mb-20">
          <div className="max-w-5xl mx-auto text-center">
            <span className="text-micro text-brand uppercase tracking-widest">Simple steps</span>
            <h2 className="text-display-sm text-white mt-3 tracking-tight">How it works</h2>
            <div className="mt-8 flex justify-center">
              <WorkflowIllustration className="w-full max-w-md opacity-80" />
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-14 mt-14">
              {[
                { step: "01", title: "Post your project", desc: "Share your GDrive/Dropbox link and budget." },
                { step: "02", title: "Choose your editor", desc: "Vetted editors apply. Pick your perfect match." },
                { step: "03", title: "Get your video", desc: "Review, approve, and download the final cut." }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-center group"
                >
                  <div className="text-micro text-brand font-bold mb-4 tracking-widest">{item.step}</div>
                  <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                  <p className="text-body text-gray-400">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── GLOBAL REACH ─── */}
        <section className="py-20 mb-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-5 max-w-md"
            >
              <div className="inline-block px-3 py-1 bg-white/40 text-charcoal text-micro font-bold uppercase tracking-widest rounded-full border border-charcoal/10">
                Global Reach
              </div>
              <h2 className="text-display-sm text-charcoal tracking-tight">
                India's best for{' '}
                <span className="text-charcoal/60">the World.</span>
              </h2>
              <p className="text-body-lg text-charcoal/60 leading-relaxed">
                Empowering India's top editing talent to serve world-class creators. Simple workflows, total peace of mind.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-charcoal font-semibold text-caption hover:gap-3 transition-all">
                Learn more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex justify-center"
            >
              <GlobeIllustration className="w-64 h-64 drop-shadow-lg" />
            </motion.div>


          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="mb-24">
          <div className="bg-charcoal p-12 md:p-20 rounded-[32px] text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-mint/5" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-[2.8rem] font-bold text-white tracking-tight leading-tight">
                Start your first project today.
              </h2>
              <p className="text-body-lg text-gray-400 mt-4 mb-8 max-w-xl mx-auto">
                Join the premium community of creators shipping content daily with Cutflow.
              </p>
              <Link href="/register?role=CREATOR" className="btn-primary !text-base !px-8 !py-3.5 shadow-brand-lg">
                Get Started — It's Free
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="pb-16 border-t border-charcoal/10 pt-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-micro text-charcoal/40 uppercase tracking-widest">
              © {new Date().getFullYear()} Cutflow · Made in Bharat
            </div>
            <div className="flex gap-8 text-micro text-charcoal/40 uppercase tracking-wider">
              <Link href="/legal/terms" className="hover:text-charcoal transition-colors">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-charcoal transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-charcoal transition-colors">Support</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
