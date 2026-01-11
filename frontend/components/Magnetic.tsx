'use client'

import { useEffect, useRef, useState } from 'react'

interface MagneticProps {
  children: React.ReactNode
  strength?: number
  className?: string
}

export default function Magnetic({ children, strength = 0.12, className = '' }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState('')

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const hasFinePointer =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches

    if (!hasFinePointer) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = (e.clientX - centerX) * strength
      const deltaY = (e.clientY - centerY) * strength
      
      setTransform(`translate(${deltaX}px, ${deltaY}px)`)
    }

    const handleMouseLeave = () => {
      setTransform('translate(0px, 0px)')
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [strength])

  return (
    <div
      ref={ref}
      className={`magnetic-cursor ${className}`}
      style={{ transform }}
    >
      {children}
    </div>
  )
}
