"use client"

import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Analytics } from "@/components/analytics"
import { Testimonials } from "@/components/testimonials"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  const handleSignInClick = () => {
    window.location.href = "/auth/signin" // Direct navigation to sign-in page
  }

  const handleSignUpClick = () => {
    window.location.href = "/auth/signup" // Direct navigation to sign-up page
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onSignInClick={handleSignInClick} />
      <Hero />
      <div id="features">
        <Features />
      </div>
      <div id="analytics">
        <Analytics />
      </div>
      <div id="pricing">
        <Pricing onSignUpClick={handleSignUpClick} />
      </div>
      <div id="testimonials">
        <Testimonials />
      </div>
      <Footer />
    </div>
  )
}
