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
      <div className="bg-white shadow-md p-1.5 rounded-full flex items-center justify-center">
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
            <filter id="glow" x="-4" y="-4" width="40" height="40" filterUnits="userSpaceOnUse">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* Fluid Wave Play Button */}
          <path
            d="M8.5 15.5C8.5 11 12 9.5 15 11L23.5 14.5C25.5 15.3 25.5 17.7 23.5 18.5L15 22C12 23.5 8.5 22 8.5 17.5V15.5Z"
            fill={`url(#${gradId})`}
          />
          <path
            d="M6 16.5C6 24 15 24 15 22M6 16.5C6 9 15 9 15 11"
            stroke={`url(#${gradId})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        </svg>
      </div>

      {showWordmark ? (
        <span
          className={
            wordmarkClassName ??
            'text-xl font-bold text-gray-900'
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
