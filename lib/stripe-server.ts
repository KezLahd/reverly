import Stripe from "stripe"

// Initialize Stripe with the secret key
// This should only be used in server-side code
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", // Use the latest API version
})

export { stripe }
