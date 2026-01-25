"use client"

import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { Analytics } from "@/components/analytics"
import { Testimonials } from "@/components/testimonials"
import { Pricing } from "@/components/pricing"
import { Footer } from "@/components/footer"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const router = useRouter()

  const handleSignInClick = () => {
    router.push("/auth/signin")
  }

  const handleSignUpClick = () => {
    router.push("/auth/signup")
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
