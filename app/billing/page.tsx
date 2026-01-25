"use client"

import { BillingPricing } from "@/components/billing-pricing"

export default function BillingPage() {
  // Simulate Stripe redirect (replace with your actual Stripe logic)
  const handleSignUpClick = () => {
    window.location.href = "/api/stripe-redirect" // Or your actual Stripe checkout URL
  }

  return (
    <BillingPricing onSignUpClick={handleSignUpClick} />
  )
} 