'use client'

import Link from 'next/link'
import { useId } from 'react'

type LogoProps = {
  href?: string
  className?: string
  iconClassName?: string
  wordmarkClassName?: string
  showWordmark?: boolean
  size?: number
}

export default function Logo({
  href,
  className,
  iconClassName,
  wordmarkClassName,
  showWordmark = true,
  size = 28,
}: LogoProps) {
  const id = useId()
  const gradId = `${id}-cutflow-grad`

  const content = (
    <span className={className ?? 'inline-flex items-center gap-2'}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={iconClassName}
      >
        <defs>
          <linearGradient id={gradId} x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#818CF8" />
            <stop offset="1" stopColor="#C084FC" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="14" stroke={`url(#${gradId})`} strokeWidth="2" fill="none" />
        
        <rect x="8" y="6" width="16" height="2" fill={`url(#${gradId})`} />
        <rect x="8" y="24" width="16" height="2" fill={`url(#${gradId})`} />
        
        <path
          d="M12 10L12 22L22 16Z"
          fill={`url(#${gradId})`}
        />
        
        <circle cx="10" cy="10" r="1.5" fill={`url(#${gradId})`} />
        <circle cx="22" cy="10" r="1.5" fill={`url(#${gradId})`} />
        <circle cx="10" cy="22" r="1.5" fill={`url(#${gradId})`} />
        <circle cx="22" cy="22" r="1.5" fill={`url(#${gradId})`} />
      </svg>

      {showWordmark ? (
        <span
          className={
            wordmarkClassName ??
            'text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent'
          }
        >
          Cutflow
        </span>
      ) : null}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    )
  }

  return content
}
