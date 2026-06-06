'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import HeroVisuals from '@/components/HeroVisuals'
import { HeroIllustration, HandshakeIllustration, ShieldIllustration, ChatIllustration, WorkflowIllustration, GlobeIllustration } from '@/components/FreehandIllustrations'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden">
      {/* Atmospheric Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none -z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none -z-0 animate-pulse duration-[4000ms]" />
      
      {/* Subtle top gradient accent */}
      <div className="absolute inset-x-0 top-0 h-[600px] bg-gradient-to-b from-indigo-50/80 via-transparent to-transparent pointer-events-none -z-0" />

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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 rounded-full mb-6 ring-1 ring-indigo-200/50 shadow-[0_0_20px_rgba(79,70,229,0.15)]">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              <span className="text-micro text-indigo-900 font-semibold uppercase tracking-wider">Now live — India's first</span>
            </div>

            <h1 className="text-[3.2rem] sm:text-[3.8rem] lg:text-display font-extrabold text-slate-900 leading-[1.08] tracking-tight">
              Get your video edited{' '}
              <span className="text-gradient-primary">without the stress.</span>
            </h1>

            <p className="mt-6 text-body-lg text-slate-500 leading-relaxed max-w-md font-medium">
              Hire vetted Indian editors. No ghosting, no storage mess, and{' '}
              <span className="text-slate-900 font-semibold">100% money protection.</span>
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/register?role=CREATOR" className="btn-primary group">
                Hire an Editor
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <Link href="/register?role=EDITOR" className="btn-secondary">
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
                className="group p-8 rounded-xl bg-white border border-slate-100 transition-all duration-300 shadow-soft hover:shadow-card-hover hover:-translate-y-2 hover:rotate-x-[2deg] hover:rotate-y-[-4deg] relative perspective-[1000px]"
              >
                <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-500">
                  {item.illustration}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="text-body text-slate-500 mt-3 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="py-24 bg-slate-900 -mx-5 sm:-mx-6 lg:-mx-8 px-5 sm:px-6 lg:px-8 rounded-[40px] mb-20 relative overflow-hidden">
          {/* Subtle glow for the dark section */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="absolute -top-24 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-micro text-indigo-400 uppercase tracking-widest font-semibold mb-4">Simple steps</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">How it works</h2>
            <div className="mt-12 flex justify-center">
              <WorkflowIllustration className="w-full max-w-md opacity-90 drop-shadow-[0_0_30px_rgba(79,70,229,0.3)]" />
            </div>

            <div className="grid md:grid-cols-3 gap-8 lg:gap-14 mt-16">
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
                  className="text-center group relative p-6 rounded-2xl hover:bg-white/5 transition-colors duration-300"
                >
                  <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-violet-600 mb-4 opacity-50 group-hover:opacity-100 transition-opacity">{item.step}</div>
                  <h4 className="text-xl font-bold text-white mb-3">{item.title}</h4>
                  <p className="text-body text-slate-400">{item.desc}</p>
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
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-12 md:p-24 rounded-[40px] text-center relative overflow-hidden border border-indigo-500/20 shadow-2xl">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')] opacity-20" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Ready to scale your content?
              </h2>
              <p className="text-lg md:text-xl text-indigo-100 mt-6 mb-10 max-w-2xl mx-auto font-medium">
                Join the premium community of creators shipping content daily with Cutflow.
              </p>
              <Link href="/register?role=CREATOR" className="btn-primary !text-lg !px-10 !py-4 shadow-[0_0_30px_rgba(79,70,229,0.4)] group">
                Get Started — It's Free
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
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
