"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, ArrowLeft, Check, Shield, Lock, CreditCard, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

const plans = [
  {
    id: "insights",
    name: "Insights",
    price: "$9.95",
    period: "per week",
    description: "Perfect for tracking and analyzing your outreach",
    features: [
      "Post-call questionnaires",
      "Door knock tracking forms",
      "Advanced analytics & insights",
      "Readiness to sell scoring",
      "Property valuations",
      "Google Maps integration",
      "Email support",
    ],
    popular: false,
    stripePriceId: "price_insights_weekly",
  },
  {
    id: "ai-processing",
    name: "AI Processing",
    price: "$19.95",
    period: "per week",
    description: "AI-powered call and door knock analysis",
    features: [
      "Everything in Insights",
      "Upload call recordings",
      "Upload door knock audio",
      "AI transcription & analysis",
      "Automated insights extraction",
      "Sentiment analysis",
      "Priority support",
    ],
    popular: true,
    stripePriceId: "price_ai_processing_weekly",
  },
  {
    id: "ai-call-agent",
    name: "AI Call Agent",
    price: "$199.95",
    period: "per week",
    description: "Full AI calling system with 200 minutes included",
    features: [
      "Everything in AI Processing",
      "200 minutes of AI calls per week",
      "Automated lead calling",
      "Smart conversation flows",
      "Real-time call insights",
      "Custom call scripts",
      "Dedicated support",
    ],
    popular: false,
    stripePriceId: "price_ai_agent_weekly",
  },
]

export default function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState(plans[1]) // Default to AI Processing
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/signup")
        return
      }

      setUser(user)
    }

    getUser()

    // Get plan from URL params
    const planId = searchParams.get("plan")
    if (planId) {
      const plan = plans.find((p) => p.id === planId)
      if (plan) {
        setSelectedPlan(plan)
      }
    }
  }, [router, searchParams])

  const handleCheckout = async () => {
    if (!user) {
      router.push("/auth/signup")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          userId: user.id,
          email: user.email,
          successUrl: `${window.location.origin}/checkout/success`,
          cancelUrl: `${window.location.origin}/checkout`,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Checkout error:", error)
      setIsLoading(false)
    }
  }

  const handleSkipPayment = () => {
    router.push("/dashboard")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f9fc]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#635bff]" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Stripe-style header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-[#635bff]" />
              <span className="text-sm text-slate-600">Secured by Stripe</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left side - Plan selection */}
          <div>
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8 text-[#635bff] mr-3" />
                <h1 className="text-2xl font-semibold text-slate-900">Reverly</h1>
              </div>
              <h2 className="text-xl text-slate-700">Choose your plan</h2>
            </div>

            <div className="space-y-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedPlan.id === plan.id
                      ? "ring-2 ring-[#635bff] border-[#635bff]"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-medium text-slate-900">{plan.name}</h3>
                          {plan.popular && <Badge className="ml-2 bg-[#635bff] text-white">Most popular</Badge>}
                        </div>
                        <p className="text-slate-600 text-sm mb-3">{plan.description}</p>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-semibold text-slate-900">{plan.price}</span>
                          <span className="text-slate-600 ml-1">/{plan.period}</span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedPlan.id === plan.id ? "border-[#635bff] bg-[#635bff]" : "border-slate-300"
                        }`}
                      >
                        {selectedPlan.id === plan.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right side - Checkout summary */}
          <div>
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-8">
                <h3 className="text-lg font-medium text-slate-900 mb-6">Order summary</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{selectedPlan.name} plan</span>
                    <span className="font-medium text-slate-900">{selectedPlan.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Billing period</span>
                    <span className="text-slate-500">Weekly</span>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-900">Total due today</span>
                      <span className="font-medium text-slate-900">{selectedPlan.price}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <Button
                    onClick={handleCheckout}
                    disabled={isLoading}
                    className="w-full h-12 bg-[#635bff] hover:bg-[#5a52e8] text-white font-medium"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating checkout session...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Subscribe with Stripe
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleSkipPayment}
                    variant="outline"
                    className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Continue without payment
                  </Button>
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span>14-day free trial included</span>
                  </div>
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-slate-400 mr-2" />
                    <span>Secure 256-bit SSL encryption</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h4 className="font-medium text-slate-900 mb-3">What's included:</h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {selectedPlan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {selectedPlan.features.length > 4 && (
                      <li className="text-[#635bff] text-sm">+ {selectedPlan.features.length - 4} more features</li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Trust indicators */}
            <div className="mt-6 text-center">
              <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
                <div className="flex items-center">
                  <Shield className="h-3 w-3 mr-1" />
                  <span>PCI DSS compliant</span>
                </div>
                <div className="flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  <span>Bank-level security</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Powered by <span className="font-medium">Stripe</span> • Trusted by millions worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
