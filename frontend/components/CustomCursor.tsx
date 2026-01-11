'use client'

import { useEffect, useState } from 'react'

interface Position {
  x: number
  y: number
}

export default function CustomCursor() {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isPointer, setIsPointer] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [trail, setTrail] = useState<Position[]>([])

  useEffect(() => {
    const hasFinePointer =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: fine)').matches

    if (!hasFinePointer) return

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    const moveCursor = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })

      setTrail((prev) => [{ x: e.clientX, y: e.clientY }, ...prev.slice(0, 8)])

      const element = document.elementFromPoint(e.clientX, e.clientY)
      if (element) {
        const computedStyle = window.getComputedStyle(element)
        setIsPointer(
          computedStyle.cursor === 'pointer' ||
            element.tagName === 'BUTTON' ||
            element.tagName === 'A' ||
            element.getAttribute('role') === 'button'
        )
      } else {
        setIsPointer(false)
      }
    }

    document.addEventListener('mousemove', moveCursor)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)

    // Hide default cursor
    document.body.style.cursor = 'none'

    return () => {
      document.removeEventListener('mousemove', moveCursor)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'auto'
    }
  }, [])

  return (
    <>
      {/* Trail effect */}
      {trail.map((pos, index) => (
        <div
          key={index}
          className="fixed pointer-events-none z-50 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20"
          style={{
            left: pos.x - 4,
            top: pos.y - 4,
            width: 8,
            height: 8,
            transform: `scale(${1 - index * 0.1})`,
            opacity: 1 - index * 0.12,
            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      ))}

      {/* Main cursor */}
      <div
        className="fixed pointer-events-none z-50 mix-blend-difference"
        style={{
          left: position.x - 16,
          top: position.y - 16,
          width: 32,
          height: 32,
          transition: 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div 
          className={`w-full h-full rounded-full border-2 border-white relative transition-all duration-200 ${
            isClicking ? 'scale-75' : 'scale-100'
          } ${isPointer ? 'bg-white/20' : 'bg-transparent'}`}
        >
          {/* Inner dot */}
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full transition-all duration-200 ${
            isPointer ? 'w-2 h-2' : 'w-1 h-1'
          }`} />
        </div>
      </div>

      {/* Glow effect */}
      <div
        className="fixed pointer-events-none z-40"
        style={{
          left: position.x - 40,
          top: position.y - 40,
          width: 80,
          height: 80,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
          transform: `scale(${isClicking ? 0.8 : 1})`,
          transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}
