import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { paymentMethodId, planId, userId, email } = await request.json()

    console.log("Received subscription request:", { paymentMethodId, planId, userId, email })

    if (!paymentMethodId || !planId || !userId || !email) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Create Supabase client with cookies for authentication
    const supabase = createRouteHandlerClient({ cookies })

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      console.error("Authentication failed:", authError, "User ID mismatch:", user?.id, "vs", userId)
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("User authenticated:", user.id)

    // Map plan IDs to Stripe price IDs
    // For testing, we'll use test price IDs - replace with your actual ones
    const planToPriceMap: Record<string, string> = {
      insights: "price_1234567890", // Replace with actual Stripe price IDs
      "ai-processing": "price_1234567891",
      "ai-call-agent": "price_1234567892",
    }

    const priceId = planToPriceMap[planId]
    if (!priceId) {
      console.error("Invalid plan selected:", planId)
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
    }

    console.log("Using price ID:", priceId)

    // Create or get a customer
    let customer
    const { data: existingCustomers } = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers && existingCustomers.length > 0) {
      customer = existingCustomers[0]
      console.log("Found existing customer:", customer.id)
    } else {
      customer = await stripe.customers.create({
        email,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
        metadata: {
          supabase_user_id: userId,
        },
      })
      console.log("Created new customer:", customer.id)
    }

    // For testing purposes, let's create a simple subscription without requiring payment
    // In production, you'd use your actual price IDs
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Reverly ${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
            },
            unit_amount: planId === "insights" ? 995 : planId === "ai-processing" ? 1995 : 19995, // Amount in cents
            recurring: {
              interval: "week",
            },
          },
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        payment_method_types: ["card"],
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        supabase_user_id: userId,
        plan_id: planId,
      },
    })

    console.log("Created subscription:", subscription.id, "Status:", subscription.status)

    // Store customer and subscription info in the database
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        stripe_customer_id: customer.id,
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        subscription_plan: planId,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("Error updating user profile:", updateError)
      // Continue anyway, as the subscription was created in Stripe
    } else {
      console.log("Updated user profile with subscription info")
    }

    // Return the client secret for the subscription
    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any).payment_intent?.client_secret,
      status: subscription.status,
    })
  } catch (error: any) {
    console.error("Error creating subscription:", error)
    return NextResponse.json({ error: error.message || "Error creating subscription" }, { status: 500 })
  }
}
