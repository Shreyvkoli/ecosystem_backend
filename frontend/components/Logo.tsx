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
    <span className={className ?? 'inline-flex items-center gap-3'}>
      <div className="flex items-center justify-center text-brand">
        <svg 
          width={size + 8} 
          height={size + 8} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className={iconClassName || ''}
        >
          <path d="M12 2L2 7.77V16.22L12 22L22 16.22V7.77L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 8.5L16 12L10 15.5V8.5Z" fill="currentColor" />
        </svg>
      </div>

      {showWordmark ? (
        <span
          className={
            wordmarkClassName ??
            'text-2xl font-bold text-charcoal tracking-tight'
          }
        >
          LumaHive
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
