import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { planId, userId, email, successUrl, cancelUrl } = await request.json()

    if (!planId || !userId || !email) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies })

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Map plan IDs to prices (in cents)
    const planPrices: Record<string, number> = {
      insights: 995, // $9.95
      "ai-processing": 1995, // $19.95
      "ai-call-agent": 19995, // $199.95
    }

    const priceInCents = planPrices[planId]
    if (!priceInCents) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
    }

    // Create or get customer
    let customer
    const { data: existingCustomers } = await stripe.customers.list({
      email,
      limit: 1,
    })

    if (existingCustomers && existingCustomers.length > 0) {
      customer = existingCustomers[0]
    } else {
      customer = await stripe.customers.create({
        email,
        metadata: {
          supabase_user_id: userId,
        },
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      billing_address_collection: "auto",
      line_items: [
        {
          price_data: {
            currency: "aud", // Australian dollars
            product_data: {
              name: `Reverly ${planId.charAt(0).toUpperCase() + planId.slice(1).replace("-", " ")} Plan`,
              description: `Weekly subscription to Reverly ${planId} plan`,
            },
            unit_amount: priceInCents,
            recurring: {
              interval: "week",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          supabase_user_id: userId,
          plan_id: planId,
        },
      },
      metadata: {
        supabase_user_id: userId,
        plan_id: planId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: error.message || "Error creating checkout session" }, { status: 500 })
  }
}
