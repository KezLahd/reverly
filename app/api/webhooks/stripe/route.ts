import { type NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { createClient } from "@supabase/supabase-js"

// Use service role key for webhook processing
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log("Received webhook event:", event.type)

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object)
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object)
        break
      case "customer.subscription.trial_will_end":
        await handleTrialWillEnd(event.data.object)
        break
      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object)
        break
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleSubscriptionCreated(subscription: any) {
  const userId = subscription.metadata?.supabase_user_id
  const planId = subscription.metadata?.plan_id

  if (!userId) {
    console.error("No user ID in subscription metadata")
    return
  }

  const { error } = await supabase.from("reverly_user_profiles").upsert({
    id: userId,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_plan: planId,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  })

  if (error) {
    console.error("Error updating user profile:", error)
  } else {
    console.log("Subscription created for user:", userId)
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) {
    console.error("No user ID in subscription metadata")
    return
  }

  const { error } = await supabase
    .from("reverly_user_profiles")
    .update({
      subscription_status: subscription.status,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("Error updating subscription:", error)
  } else {
    console.log("Subscription updated for user:", userId)
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) {
    console.error("No user ID in subscription metadata")
    return
  }

  const { error } = await supabase
    .from("reverly_user_profiles")
    .update({
      subscription_status: "canceled",
      stripe_subscription_id: null,
    })
    .eq("id", userId)

  if (error) {
    console.error("Error canceling subscription:", error)
  } else {
    console.log("Subscription canceled for user:", userId)
  }
}

async function handleTrialWillEnd(subscription: any) {
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) {
    console.error("No user ID in subscription metadata")
    return
  }

  // You could send an email notification here
  console.log("Trial will end for user:", userId)
}

async function handlePaymentSucceeded(invoice: any) {
  const subscriptionId = invoice.subscription

  if (!subscriptionId) return

  // Get subscription to find user
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) return

  const { error } = await supabase
    .from("reverly_user_profiles")
    .update({
      subscription_status: "active",
    })
    .eq("id", userId)

  if (error) {
    console.error("Error updating payment status:", error)
  } else {
    console.log("Payment succeeded for user:", userId)
  }
}

async function handlePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription

  if (!subscriptionId) return

  // Get subscription to find user
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) return

  const { error } = await supabase
    .from("reverly_user_profiles")
    .update({
      subscription_status: "past_due",
    })
    .eq("id", userId)

  if (error) {
    console.error("Error updating payment failure:", error)
  } else {
    console.log("Payment failed for user:", userId)
  }
}
