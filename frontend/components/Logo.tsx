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
      <div className="flex items-center justify-center overflow-hidden">
        <img
          src="/cutflow-logo-green.png"
          alt="Cutflow Logo"
          width={size + 8}
          height={size + 8}
          className={`object-contain ${iconClassName || ''}`}
        />
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
