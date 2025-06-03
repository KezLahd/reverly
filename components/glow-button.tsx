"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button" // Assuming shadcn/ui Button

interface GlowButtonProps extends React.ComponentProps<typeof Button> {
  children: React.ReactNode
}

export function GlowButton({ children, className, ...props }: GlowButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const { left, top, width, height } = buttonRef.current.getBoundingClientRect()
      const x = e.clientX - left
      const y = e.clientY - top
      setMousePosition({ x, y })
    }
  }

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  return (
    <Button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.4) 0%, transparent 20%)`,
            mixBlendMode: "screen",
            opacity: 1,
            transition: "opacity 0.1s ease-out",
          }}
        />
      )}
      {/* Added flex, items-center, and whitespace-nowrap to the span */}
      <span className="relative z-10 flex items-center whitespace-nowrap">{children}</span>
    </Button>
  )
}
