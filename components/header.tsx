"use client"
import { Building2, User, Menu } from "lucide-react"
import { useState } from "react"
import { GlowButton } from "./glow-button" // Import GlowButton

interface HeaderProps {
  onSignInClick?: () => void
}

export function Header({ onSignInClick }: HeaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogin = () => {
    if (onSignInClick) {
      onSignInClick()
    } else {
      window.location.href = "/auth/signin" // Changed from "/auth" to "/auth/signin"
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center group">
          <Building2 className="h-10 w-10 text-primary mr-3 transition-transform group-hover:scale-110" />
          <span className="text-2xl font-bold text-foreground">Reverly</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-slate-600 hover:text-primary transition-colors duration-200 font-medium">
            Features
          </a>
          <a
            href="#testimonials"
            className="text-slate-600 hover:text-primary transition-colors duration-200 font-medium"
          >
            Testimonials
          </a>
          <a href="#pricing" className="text-slate-600 hover:text-primary transition-colors duration-200 font-medium">
            Pricing
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-slate-600 hover:text-primary transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Sign In Button */}
        <GlowButton
          onClick={handleLogin}
          disabled={isLoading}
          className="hidden md:flex bg-primary hover:bg-primary-700 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base flex items-center whitespace-nowrap" // Reverted to flex and original padding, added whitespace-nowrap
        >
          <User className="h-5 w-5 mr-2" /> {/* Reverted icon size */}
          {isLoading ? "Loading..." : "Sign In"}
        </GlowButton>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-background/95 backdrop-blur-md">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <a href="#features" className="block text-slate-600 hover:text-primary transition-colors font-medium">
              Features
            </a>
            <a href="#testimonials" className="block text-slate-600 hover:text-primary transition-colors font-medium">
              Testimonials
            </a>
            <a href="#pricing" className="block text-slate-600 hover:text-primary transition-colors font-medium">
              Pricing
            </a>
            <GlowButton
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary-700 text-primary-foreground font-medium flex items-center justify-center whitespace-nowrap" // Reverted to flex and added whitespace-nowrap
            >
              <User className="h-4 w-4 mr-2" /> {/* Reverted icon size */}
              {isLoading ? "Loading..." : "Sign In"}
            </GlowButton>
          </nav>
        </div>
      )}
    </header>
  )
}
