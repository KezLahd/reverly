import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const { sessionId, customerId } = await request.json()

    let customerIdToUse = customerId

    // If sessionId is provided, get customer from session
    if (sessionId && !customerId) {
      const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
      if (!checkoutSession.customer) {
        return NextResponse.json({ error: "No customer found" }, { status: 400 })
      }
      customerIdToUse = checkoutSession.customer as string
    }

    if (!customerIdToUse) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    // Get the cookie store
    const cookieStore = await cookies()

    // Verify user is authenticated
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set(name, value, options)
          },
          remove: (name, options) => {
            cookieStore.set(name, "", { ...options, maxAge: 0 })
          },
        },
      }
    )
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerIdToUse,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error("Error creating portal session:", error)
    return NextResponse.json({ error: error.message || "Error creating portal session" }, { status: 500 })
  }
}
