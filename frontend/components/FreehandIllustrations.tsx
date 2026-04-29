'use client'

/**
 * Freehand-style SVG illustrations for Cutflow pages.
 * Inspired by MongoDB's hand-drawn, organic illustration style.
 * Uses the mint green color palette with charcoal accents.
 */

// Hero illustration: Video editing workspace with freehand style
export function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 400" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Freehand video player shape - wobbly rectangle */}
      <path
        d="M80 80 C82 76, 220 74, 320 78 C340 79, 398 76, 400 82 C402 88, 404 220, 402 280 C400 290, 398 318, 392 320 C386 322, 220 324, 120 322 C100 321, 82 324, 78 318 C74 312, 76 120, 80 80Z"
        fill="#181818" stroke="#181818" strokeWidth="2.5"
      />
      {/* Screen glow */}
      <path
        d="M94 96 C96 93, 200 91, 300 94 C320 95, 384 92, 386 96 C388 100, 389 210, 388 270 C387 278, 386 304, 382 306 C378 308, 200 310, 120 308 C106 307, 96 310, 94 306 C92 302, 92 120, 94 96Z"
        fill="#a8e0cf" stroke="none"
      />
      {/* Play button - freehand triangle */}
      <path
        d="M220 170 C222 166, 280 196, 282 202 C284 208, 222 238, 218 236 C214 234, 218 174, 220 170Z"
        fill="#00ed64" stroke="#181818" strokeWidth="2"
      />
      {/* Timeline bar - wobbly */}
      <path
        d="M100 286 C102 284, 380 283, 382 286 C384 289, 382 294, 380 296 C378 298, 102 299, 100 296 C98 293, 98 288, 100 286Z"
        fill="#181818" stroke="none" opacity="0.3"
      />
      <path
        d="M100 286 C102 284, 240 283, 242 286 C244 289, 242 294, 240 296 C238 298, 102 299, 100 296 C98 293, 98 288, 100 286Z"
        fill="#00ed64" stroke="none"
      />
      {/* Floating comment bubble 1 */}
      <path
        d="M340 50 C342 44, 460 42, 464 48 C468 54, 470 90, 466 96 C462 102, 342 104, 338 98 C334 92, 336 56, 340 50Z"
        fill="white" stroke="#181818" strokeWidth="2"
      />
      <path d="M370 96 L362 120 L386 98" fill="white" stroke="#181818" strokeWidth="2" />
      <line x1="356" y1="64" x2="448" y2="64" stroke="#c4ede0" strokeWidth="3" strokeLinecap="round" />
      <line x1="356" y1="78" x2="420" y2="78" stroke="#c4ede0" strokeWidth="3" strokeLinecap="round" />
      {/* Floating comment bubble 2 */}
      <path
        d="M30 220 C32 214, 120 212, 124 218 C128 224, 130 250, 126 256 C122 262, 34 264, 30 258 C26 252, 28 226, 30 220Z"
        fill="white" stroke="#181818" strokeWidth="2"
      />
      <path d="M90 256 L98 278 L76 258" fill="white" stroke="#181818" strokeWidth="2" />
      <circle cx="46" cy="238" r="5" fill="#00ed64" />
      <line x1="58" y1="234" x2="110" y2="234" stroke="#a8e0cf" strokeWidth="3" strokeLinecap="round" />
      <line x1="58" y1="246" x2="90" y2="246" stroke="#a8e0cf" strokeWidth="3" strokeLinecap="round" />
      {/* Cursor arrow - freehand */}
      <path
        d="M300 150 L306 180 L314 170 L328 184 L334 178 L320 164 L330 160 Z"
        fill="#00ed64" stroke="#181818" strokeWidth="1.5"
      />
      {/* Stars/sparkles */}
      <path d="M440 150 L444 140 L448 150 L458 154 L448 158 L444 168 L440 158 L430 154 Z" fill="#00ed64" />
      <path d="M60 60 L63 52 L66 60 L74 63 L66 66 L63 74 L60 66 L52 63 Z" fill="#00ed64" opacity="0.6" />
      <path d="M420 280 L422 274 L424 280 L430 282 L424 284 L422 290 L420 284 L414 282 Z" fill="#181818" opacity="0.3" />
      {/* Freehand circles - decorative */}
      <circle cx="460" cy="340" r="18" fill="none" stroke="#00ed64" strokeWidth="2" strokeDasharray="4 4" />
      <circle cx="40" cy="160" r="12" fill="none" stroke="#181818" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.2" />
    </svg>
  )
}

// Escrow/Shield illustration for Trust & Pricing
export function ShieldIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 220" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Freehand shield shape */}
      <path
        d="M100 20 C104 18, 160 44, 168 52 C176 60, 178 120, 170 152 C162 184, 104 210, 100 212 C96 210, 38 184, 30 152 C22 120, 24 60, 32 52 C40 44, 96 18, 100 20Z"
        fill="#c4ede0" stroke="#181818" strokeWidth="2.5"
      />
      {/* Inner shield */}
      <path
        d="M100 48 C103 46, 146 66, 152 72 C158 78, 160 120, 154 144 C148 168, 103 188, 100 190 C97 188, 52 168, 46 144 C40 120, 42 78, 48 72 C54 66, 97 46, 100 48Z"
        fill="white" stroke="none" opacity="0.6"
      />
      {/* Checkmark - freehand */}
      <path
        d="M72 118 C74 116, 90 136, 94 140 C98 144, 128 96, 132 92"
        fill="none" stroke="#00ed64" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
      />
      {/* Sparkle */}
      <path d="M158 40 L161 32 L164 40 L172 43 L164 46 L161 54 L158 46 L150 43 Z" fill="#00ed64" />
      <circle cx="40" cy="80" r="6" fill="none" stroke="#00ed64" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  )
}

// Handshake/No Ghosting illustration
export function HandshakeIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Left hand - freehand */}
      <path
        d="M20 120 C22 100, 40 80, 60 78 C70 77, 80 82, 86 90 C92 98, 100 104, 106 100"
        fill="none" stroke="#181818" strokeWidth="3" strokeLinecap="round"
      />
      {/* Right hand - freehand */}
      <path
        d="M180 120 C178 100, 160 80, 140 78 C130 77, 120 82, 114 90 C108 98, 100 104, 106 100"
        fill="none" stroke="#181818" strokeWidth="3" strokeLinecap="round"
      />
      {/* Clasped hands area */}
      <path
        d="M86 90 C90 86, 100 84, 114 90 C120 94, 118 108, 110 114 C102 120, 90 118, 86 112 C82 106, 82 94, 86 90Z"
        fill="#c4ede0" stroke="#181818" strokeWidth="2.5"
      />
      {/* Trust spark */}
      <path d="M100 50 L103 40 L106 50 L116 53 L106 56 L103 66 L100 56 L90 53 Z" fill="#00ed64" />
      <path d="M60 50 L62 44 L64 50 L70 52 L64 54 L62 60 L60 54 L54 52 Z" fill="#00ed64" opacity="0.5" />
      <path d="M140 60 L142 54 L144 60 L150 62 L144 64 L142 70 L140 64 L134 62 Z" fill="#00ed64" opacity="0.5" />
      {/* Decorative arcs */}
      <path d="M70 140 C80 150, 120 150, 130 140" fill="none" stroke="#a8e0cf" strokeWidth="2" strokeLinecap="round" />
      <path d="M60 155 C75 168, 125 168, 140 155" fill="none" stroke="#a8e0cf" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

// Chat/Timestamp illustration
export function ChatIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Message bubble 1 - big */}
      <path
        d="M30 40 C32 34, 150 32, 154 38 C158 44, 160 90, 156 96 C152 102, 34 104, 30 98 C26 92, 28 46, 30 40Z"
        fill="#181818" stroke="none"
      />
      <path d="M50 96 L42 120 L70 98" fill="#181818" />
      <line x1="48" y1="58" x2="136" y2="58" stroke="#c4ede0" strokeWidth="3" strokeLinecap="round" />
      <line x1="48" y1="74" x2="110" y2="74" stroke="#a8e0cf" strokeWidth="3" strokeLinecap="round" />
      <circle cx="142" cy="74" r="4" fill="#00ed64" />
      {/* Message bubble 2 - reply */}
      <path
        d="M60 130 C62 124, 170 122, 174 128 C178 134, 180 166, 176 172 C172 178, 64 180, 60 174 C56 168, 58 136, 60 130Z"
        fill="#c4ede0" stroke="#181818" strokeWidth="2"
      />
      <path d="M150 172 L158 194 L134 174" fill="#c4ede0" stroke="#181818" strokeWidth="2" />
      <line x1="78" y1="146" x2="156" y2="146" stroke="#181818" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      <line x1="78" y1="160" x2="130" y2="160" stroke="#181818" strokeWidth="2.5" strokeLinecap="round" opacity="0.2" />
      {/* Timestamp icon */}
      <circle cx="170" cy="46" r="16" fill="#00ed64" stroke="#181818" strokeWidth="2" />
      <path d="M170 38 L170 46 L178 50" stroke="#181818" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// Workflow/Steps illustration
export function WorkflowIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Step 1 circle */}
      <circle cx="60" cy="60" r="32" fill="#00ed64" stroke="#181818" strokeWidth="2.5" />
      <text x="60" y="67" textAnchor="middle" fill="#181818" fontWeight="bold" fontSize="20">1</text>
      {/* Freehand connector 1 */}
      <path d="M94 60 C120 54, 140 66, 166 60" stroke="#181818" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" />
      {/* Step 2 circle */}
      <circle cx="200" cy="60" r="32" fill="#c4ede0" stroke="#181818" strokeWidth="2.5" />
      <text x="200" y="67" textAnchor="middle" fill="#181818" fontWeight="bold" fontSize="20">2</text>
      {/* Freehand connector 2 */}
      <path d="M234 60 C260 66, 280 54, 306 60" stroke="#181818" strokeWidth="2" strokeLinecap="round" strokeDasharray="6 4" />
      {/* Step 3 circle */}
      <circle cx="340" cy="60" r="32" fill="#00ed64" stroke="#181818" strokeWidth="2.5" />
      <text x="340" y="67" textAnchor="middle" fill="#181818" fontWeight="bold" fontSize="20">3</text>
      {/* Sparkles */}
      <path d="M120 25 L123 17 L126 25 L134 28 L126 31 L123 39 L120 31 L112 28 Z" fill="#00ed64" opacity="0.5" />
      <path d="M280 90 L282 84 L284 90 L290 92 L284 94 L282 100 L280 94 L274 92 Z" fill="#00ed64" opacity="0.5" />
    </svg>
  )
}

// Globe/Global Reach illustration
export function GlobeIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Globe circle - freehand */}
      <circle cx="100" cy="100" r="72" fill="#c4ede0" stroke="#181818" strokeWidth="2.5" />
      {/* Latitude lines - wobbly */}
      <path d="M30 100 C50 96, 150 96, 170 100" stroke="#a8e0cf" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 72 C60 68, 140 68, 162 72" stroke="#a8e0cf" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M38 128 C60 132, 140 132, 162 128" stroke="#a8e0cf" strokeWidth="1.5" strokeLinecap="round" />
      {/* Longitude curve */}
      <path d="M100 28 C80 60, 80 140, 100 172" stroke="#a8e0cf" strokeWidth="2" strokeLinecap="round" />
      <path d="M100 28 C120 60, 120 140, 100 172" stroke="#a8e0cf" strokeWidth="2" strokeLinecap="round" />
      {/* India dot */}
      <circle cx="118" cy="98" r="8" fill="#00ed64" stroke="#181818" strokeWidth="2" />
      {/* Connection lines going out */}
      <path d="M126 94 L160 60 L180 58" stroke="#00ed64" strokeWidth="2" strokeLinecap="round" />
      <path d="M124 104 L155 140 L178 148" stroke="#00ed64" strokeWidth="2" strokeLinecap="round" />
      <path d="M112 92 L80 60 L55 50" stroke="#00ed64" strokeWidth="2" strokeLinecap="round" />
      {/* End dots */}
      <circle cx="180" cy="58" r="4" fill="#00ed64" />
      <circle cx="178" cy="148" r="4" fill="#00ed64" />
      <circle cx="55" cy="50" r="4" fill="#00ed64" />
      {/* Sparkle */}
      <path d="M170 30 L173 22 L176 30 L184 33 L176 36 L173 44 L170 36 L162 33 Z" fill="#00ed64" />
    </svg>
  )
}

// Pricing/Money illustration
export function PricingIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Coin stack - freehand */}
      <ellipse cx="100" cy="150" rx="60" ry="18" fill="#a8e0cf" stroke="#181818" strokeWidth="2" />
      <path d="M40 150 L40 138 C40 126, 60 116, 100 116 C140 116, 160 126, 160 138 L160 150" fill="#c4ede0" stroke="#181818" strokeWidth="2" />
      <ellipse cx="100" cy="138" rx="60" ry="18" fill="#c4ede0" stroke="#181818" strokeWidth="2" />
      <path d="M40 138 L40 126 C40 114, 60 104, 100 104 C140 104, 160 114, 160 126 L160 138" fill="#d4f5e9" stroke="#181818" strokeWidth="2" />
      <ellipse cx="100" cy="126" rx="60" ry="18" fill="#d4f5e9" stroke="#181818" strokeWidth="2" />
      {/* ₹ symbol on top coin */}
      <text x="100" y="132" textAnchor="middle" fill="#181818" fontWeight="bold" fontSize="18">₹</text>
      {/* Lock icon above */}
      <path
        d="M86 68 C86 54, 92 44, 100 44 C108 44, 114 54, 114 68"
        fill="none" stroke="#181818" strokeWidth="2.5" strokeLinecap="round"
      />
      <path
        d="M78 68 C80 62, 120 62, 122 68 C124 74, 124 90, 122 96 C120 102, 80 102, 78 96 C76 90, 76 74, 78 68Z"
        fill="#00ed64" stroke="#181818" strokeWidth="2"
      />
      <circle cx="100" cy="82" r="4" fill="#181818" />
      <line x1="100" y1="86" x2="100" y2="94" stroke="#181818" strokeWidth="2" strokeLinecap="round" />
      {/* Sparkles */}
      <path d="M150 50 L153 42 L156 50 L164 53 L156 56 L153 64 L150 56 L142 53 Z" fill="#00ed64" />
      <path d="M44 44 L46 38 L48 44 L54 46 L48 48 L46 54 L44 48 L38 46 Z" fill="#00ed64" opacity="0.5" />
    </svg>
  )
}

// Contact/Envelope illustration
export function ContactIllustration({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 180" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Envelope body - freehand */}
      <path
        d="M20 60 C22 54, 178 52, 182 58 C186 64, 188 140, 184 146 C180 152, 22 154, 18 148 C14 142, 18 66, 20 60Z"
        fill="#c4ede0" stroke="#181818" strokeWidth="2.5"
      />
      {/* Envelope flap */}
      <path
        d="M20 60 C40 80, 80 110, 100 116 C120 110, 160 80, 182 58"
        fill="none" stroke="#181818" strokeWidth="2.5" strokeLinecap="round"
      />
      {/* Letter peeking out */}
      <path
        d="M50 50 C52 30, 148 28, 150 50"
        fill="white" stroke="#181818" strokeWidth="2"
      />
      <line x1="70" y1="38" x2="130" y2="38" stroke="#c4ede0" strokeWidth="3" strokeLinecap="round" />
      {/* Notification dot */}
      <circle cx="172" cy="52" r="12" fill="#00ed64" stroke="#181818" strokeWidth="2" />
      <text x="172" y="57" textAnchor="middle" fill="#181818" fontWeight="bold" fontSize="12">!</text>
      {/* Paper plane flying away */}
      <path d="M160 20 L180 10 L170 28 L174 22 Z" fill="#00ed64" stroke="#181818" strokeWidth="1.5" />
      {/* Sparkle */}
      <path d="M30 30 L33 22 L36 30 L44 33 L36 36 L33 44 L30 36 L22 33 Z" fill="#00ed64" opacity="0.5" />
    </svg>
  )
}
