"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, Check, ArrowRight, Shield } from "lucide-react"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const sessionIdParam = searchParams.get("session_id")
    if (sessionIdParam) {
      setSessionId(sessionIdParam)
    }
  }, [searchParams])

  const handleManageBilling = async () => {
    if (!sessionId) return

    try {
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      }
    } catch (error) {
      console.error("Error creating portal session:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      {/* Stripe-style header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-[#635bff] mr-3" />
              <span className="text-xl font-semibold text-slate-900">Reverly</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-[#635bff]" />
              <span className="text-sm text-slate-600">Secured by Stripe</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>

            <h1 className="text-2xl font-semibold text-slate-900 mb-4">Subscription successful!</h1>

            <p className="text-slate-600 mb-8">
              Welcome to Reverly! Your subscription has been activated and you can now access all premium features. Your
              14-day free trial has started.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center text-sm text-slate-600">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>14-day free trial activated</span>
              </div>
              <div className="flex items-center justify-center text-sm text-slate-600">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Full access to all features</span>
              </div>
              <div className="flex items-center justify-center text-sm text-slate-600">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span>Cancel anytime</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/dashboard">
                <Button className="w-full h-12 bg-[#635bff] hover:bg-[#5a52e8] text-white font-medium">
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              {sessionId && (
                <Button
                  onClick={handleManageBilling}
                  variant="outline"
                  className="w-full h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Manage billing information
                </Button>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-6">
              You'll receive a confirmation email shortly with your subscription details.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
