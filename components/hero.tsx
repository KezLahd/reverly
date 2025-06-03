"use client"
import { useRouter } from "next/navigation"
import { GlowButton } from "./glow-button" // Import GlowButton

export function Hero() {
  const router = useRouter()

  const handleGetStartedClick = () => {
    router.push("/auth/signup")
  }

  return (
    <section className="relative w-full py-20 md:py-32 lg:py-40 bg-gradient-to-br from-purple-600 to-purple-800 text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1200')] opacity-10" />
      </div>
      <div className="container relative z-10 mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 drop-shadow-lg">
          Unlock Your Real Estate Potential with AI
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto mb-10 opacity-90">
          Reverly provides cutting-edge AI-powered insights and automation tools to help real estate professionals
          thrive in a competitive market.
        </p>
        <GlowButton
          onClick={handleGetStartedClick}
          className="bg-white text-purple-700 hover:bg-gray-100 px-8 py-3 md:px-10 md:py-4 text-lg md:text-xl font-semibold rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          Get Started Today
        </GlowButton>
      </div>
    </section>
  )
}
