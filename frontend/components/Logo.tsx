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
      <div className="flex items-center justify-center text-brand drop-shadow-sm">
        <svg 
          width={size + 4} 
          height={size + 4} 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className={iconClassName || ''}
        >
          <path d="M6 4.5V19.5L20 12L6 4.5Z" fill="currentColor"/>
        </svg>
      </div>

      {showWordmark ? (
        <span
          className={
            wordmarkClassName ??
            'text-2xl font-bold text-charcoal tracking-tight'
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
