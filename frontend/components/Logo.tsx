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
      <div className="bg-white shadow-md p-1.5 rounded-full flex items-center justify-center overflow-hidden">
        <img
          src="/cutflow-logo.png"
          alt="Cutflow Logo"
          width={size}
          height={size}
          className={`object-contain scale-125 mix-blend-multiply ${iconClassName || ''}`}
        />
      </div>

      {showWordmark ? (
        <span
          className={
            wordmarkClassName ??
            'text-2xl font-extrabold text-gray-900 tracking-tight'
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
