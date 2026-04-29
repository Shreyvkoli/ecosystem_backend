'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import HeroVisuals from '@/components/HeroVisuals'
import { HeroIllustration, HandshakeIllustration, ShieldIllustration, ChatIllustration, WorkflowIllustration, GlobeIllustration } from '@/components/FreehandIllustrations'

export default function Home() {
  return (
    <div className="relative min-h-screen bg-charcoal overflow-hidden font-sans">
      {/* Subtle ambient glows for dark aesthetic */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-6 relative z-10">
        {/* ─── NAV ─── */}
        <header className="flex items-center justify-between py-4 border-b border-white/5">
          <Link href="/" className="flex items-center">
            <Logo showWordmark size={32} wordmarkClassName="text-2xl font-bold text-white tracking-tight" iconClassName="text-brand" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {['Pricing', 'How it works', 'Trust & Safety', 'About'].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="text-white/60 hover:text-white transition-colors text-sm font-medium tracking-wide"
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-white/70 hover:text-white font-medium text-sm transition-colors">
              Log In
            </Link>
            <Link href="/register" className="bg-brand text-charcoal hover:bg-brand-dark transition-colors font-bold py-2.5 px-6 text-sm rounded-lg shadow-[0_0_15px_rgba(0,237,100,0.3)]">
              Get Started
            </Link>
          </div>
        </header>

        {/* ─── HERO ─── */}
        <main className="pt-24 pb-32 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
              <span className="w-2 h-2 bg-brand rounded-full animate-pulse shadow-[0_0_8px_#00ed64]" />
              <span className="text-xs text-white/80 uppercase tracking-widest font-semibold">Now live — The Future of Editing</span>
            </div>

            <h1 className="text-[3.5rem] sm:text-[4.2rem] lg:text-[4.5rem] font-bold text-white leading-[1.1] tracking-tighter">
              Create magic,{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand to-teal-400">without the mess.</span>
            </h1>

            <p className="mt-6 text-lg text-white/60 leading-relaxed max-w-md font-light">
              Connect with elite video editors instantly. No ghosting, zero storage chaos, and{' '}
              <span className="text-white font-medium">100% secure escrow payments.</span>
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register?role=CREATOR" className="bg-brand text-charcoal hover:bg-brand-dark transition-all font-bold py-3.5 px-8 rounded-xl shadow-[0_0_20px_rgba(0,237,100,0.25)] text-center">
                Hire an Editor
              </Link>
              <Link href="/register?role=EDITOR" className="bg-white/10 text-white hover:bg-white/20 transition-all font-semibold py-3.5 px-8 rounded-xl backdrop-blur-md border border-white/5 text-center">
                I'm an Editor
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-5">
              <div className="flex -space-x-3">
                {[
                  'bg-gray-800 text-white',
                  'bg-brand text-charcoal',
                  'bg-gray-700 text-white',
                  'bg-blue-600 text-white'
                ].map((cls, i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-charcoal ${cls} flex items-center justify-center text-xs font-bold shadow-lg`}>
                    {['S', 'R', 'A', 'P'][i]}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/50">
                Join <span className="text-white font-semibold">1,000+</span> creators & editors
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-brand/20 to-blue-500/20 blur-[80px] rounded-full mix-blend-screen" />
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative z-10"
            >
              {/* Replace illustration with a sleek dark card mockup */}
              <div className="w-full max-w-lg mx-auto bg-charcoal border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-blue-500" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="text-xs text-white/40 font-mono">LumaHive Workspace</div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center">
                    <svg className="w-12 h-12 text-brand/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-10 flex-1 bg-white/5 rounded-lg border border-white/5" />
                    <div className="h-10 w-24 bg-brand/20 rounded-lg border border-brand/30" />
                  </div>
                  <div className="space-y-2 pt-4">
                    <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                    <div className="h-2 w-1/2 bg-white/5 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </main>

        {/* ─── BENEFITS ─── */}
        <section className="py-24 border-t border-white/5">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Why creators choose LumaHive</h2>
            <p className="text-white/50 mt-4 max-w-xl mx-auto text-lg">Engineered for seamless collaboration, zero friction, and absolute trust.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: "🛡️", title: "No Ghosting", desc: "Editors pay a security deposit. They don't disappear — reliability is built directly into the protocol." },
              { icon: "🔒", title: "Escrow Payments", desc: "Your funds are securely locked in escrow. You only release payment when the final cut is approved." },
              { icon: "⚡", title: "Zero Storage Hassle", desc: "Share Google Drive or Dropbox links directly. We handle the workflow without eating your bandwidth." }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-brand/30 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05]"
              >
                <div className="text-4xl mb-6 bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center border border-white/10 group-hover:border-brand/40 group-hover:bg-brand/10 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/60 leading-relaxed">{item.desc}</p>
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
        <section className="py-24 mb-20 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-5 max-w-md"
            >
              <div className="inline-block px-3 py-1 bg-white/5 text-white/60 text-xs font-bold uppercase tracking-widest rounded-full border border-white/10 backdrop-blur-md">
                Global Reach
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                India's best for{' '}
                <span className="text-brand">the World.</span>
              </h2>
              <p className="text-lg text-white/50 leading-relaxed font-light">
                Empowering India's top editing talent to serve world-class creators. Seamless workflows, zero timezone friction, absolute peace of mind.
              </p>
              <Link href="/about" className="inline-flex items-center gap-2 text-brand font-semibold text-sm hover:gap-3 transition-all">
                Learn more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex justify-center relative"
            >
              <div className="absolute inset-0 bg-brand/10 blur-[80px] rounded-full" />
              <GlobeIllustration className="w-64 h-64 drop-shadow-[0_0_30px_rgba(0,237,100,0.2)] relative z-10 opacity-90" />
            </motion.div>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="mb-24">
          <div className="bg-gradient-to-br from-brand/10 to-transparent border border-brand/20 p-12 md:p-20 rounded-[32px] text-center relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-[3.5rem] font-bold text-white tracking-tight leading-tight">
                Start your first project today.
              </h2>
              <p className="text-xl text-white/60 mt-6 mb-10 max-w-xl mx-auto font-light">
                Join the premium community of creators shipping content daily with LumaHive.
              </p>
              <Link href="/register?role=CREATOR" className="inline-block bg-brand text-charcoal hover:bg-brand-dark transition-all font-bold py-4 px-10 rounded-xl shadow-[0_0_25px_rgba(0,237,100,0.3)] text-lg">
                Get Started — It's Free
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="pb-10 pt-12 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-xs text-white/40 uppercase tracking-widest font-semibold">
              © {new Date().getFullYear()} LumaHive · Engineered for Scale
            </div>
            <div className="flex gap-8 text-xs text-white/40 uppercase tracking-widest font-semibold">
              <Link href="/legal/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
