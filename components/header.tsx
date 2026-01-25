"use client"
import { Building2, User, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { GlowButton } from "./glow-button" // Import GlowButton
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Popover } from "@headlessui/react"

interface HeaderProps {
  onSignInClick?: () => void
}

export function Header({ onSignInClick }: HeaderProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  const handleLogin = () => {
    if (onSignInClick) {
      onSignInClick()
    } else {
      router.push("/auth/signin")
    }
  }

  const handleDashboard = async () => {
    try {
      console.log("Dashboard clicked, user:", user?.id)
      const { data: profile, error } = await supabase.from("user_profiles").select("subscription_status").eq("id", user.id).single()
      console.log("Profile check result:", { profile, error })
      
      // Create and submit a form to force navigation
      const form = document.createElement('form')
      form.method = 'GET'
      
      if (!profile || !profile.subscription_status || (profile.subscription_status !== 'active' && profile.subscription_status !== 'paid')) {
        console.log("Redirecting to billing - subscription status:", profile?.subscription_status)
        form.action = '/billing'
      } else {
        console.log("Redirecting to dashboard - subscription status:", profile.subscription_status)
        form.action = '/dashboard'
      }
      
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    } catch (error) {
      console.error("Error checking subscription status:", error)
      const form = document.createElement('form')
      form.method = 'GET'
      form.action = '/billing'
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    }
    setDropdownOpen(false)
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    await supabase.auth.signOut()
    setIsLoading(false)
    setDropdownOpen(false)
    router.refresh()
    router.push("/")
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

        {/* Auth Button or Dropdown */}
        {user ? (
          <Popover className="relative hidden md:flex">
            <Popover.Button as={GlowButton}
              className="bg-white text-primary border border-primary hover:bg-primary hover:text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base flex items-center whitespace-nowrap"
            >
              <User className="h-5 w-5 mr-2" />
              Signed in
            </Popover.Button>
            <Popover.Panel
              className="absolute top-full left-1/2 -translate-x-1/2 z-50 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg focus:outline-none"
            >
              {/* Arrow */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-slate-200 rotate-45 z-10"></div>
              <div className="py-1 relative z-20">
                <button
                  onClick={handleDashboard}
                  className="w-full text-left px-4 py-3 hover:bg-primary/10 text-primary font-medium rounded-t-lg"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium rounded-b-lg border-t border-slate-100"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing out..." : "Sign out"}
                </button>
              </div>
            </Popover.Panel>
          </Popover>
        ) : (
          <GlowButton
            onClick={handleLogin}
            disabled={isLoading}
            className="hidden md:flex bg-primary hover:bg-primary-700 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-base flex items-center whitespace-nowrap"
          >
            <User className="h-5 w-5 mr-2" />
            {isLoading ? "Loading..." : "Sign In"}
          </GlowButton>
        )}
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
            {user ? (
              <div className="w-full">
                <button
                  onClick={handleDashboard}
                  className="w-full text-left px-4 py-3 bg-white text-primary font-medium rounded-t-lg border border-slate-200"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-3 bg-white text-red-600 font-medium rounded-b-lg border border-slate-200 border-t"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing out..." : "Sign out"}
                </button>
              </div>
            ) : (
              <GlowButton
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary-700 text-primary-foreground font-medium flex items-center justify-center whitespace-nowrap"
              >
                <User className="h-4 w-4 mr-2" />
                {isLoading ? "Loading..." : "Sign In"}
              </GlowButton>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
