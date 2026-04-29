'use client'

import { useState } from 'react'
import PublicNav from '@/components/PublicNav'
import PublicFooter from '@/components/PublicFooter'
import { ContactIllustration } from '@/components/FreehandIllustrations'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-mint">
      <PublicNav />
      <div className="max-w-2xl mx-auto px-5 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center text-center mb-10">
          <ContactIllustration className="w-36 h-32 mb-4 drop-shadow-lg" />
          <span className="text-micro text-charcoal/60 uppercase tracking-widest">Get in touch</span>
          <h1 className="text-display-sm text-charcoal mt-2 tracking-tight">
            Contact & Support
          </h1>
          <p className="text-body-lg text-charcoal/50 mt-3">
            Email us at <span className="text-charcoal font-semibold">support@cutflow.in</span> or use the form below.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white/40 backdrop-blur-sm border border-charcoal/8 shadow-elevated">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-brand/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-heading-sm text-charcoal">Thanks — we received your message.</div>
              <div className="text-body text-charcoal/50 mt-2">We'll get back within 24–48 hours.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-micro text-charcoal/50 uppercase tracking-widest mb-2 ml-0.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-charcoal/10 rounded-xl text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-body"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-micro text-charcoal/50 uppercase tracking-widest mb-2 ml-0.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-charcoal/10 rounded-xl text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-body"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-micro text-charcoal/50 uppercase tracking-widest mb-2 ml-0.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-charcoal/10 rounded-xl text-charcoal placeholder-charcoal/30 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all text-body resize-none"
                  rows={5}
                  placeholder="Tell us what you need help with..."
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full shadow-brand">
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
      <PublicFooter />
    </div>
  )
}
