"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Check, Star } from "lucide-react"

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlan: string
}

const plans = [
  {
    id: "basic-insights",
    name: "Basic Insights",
    price: "$9.95",
    period: "week",
    description: "Perfect for solo agents or early-stage users",
    features: [
      "Manage up to 100 clients",
      "Personal CRM dashboard",
      "Basic AI-powered questionnaires",
      "Readiness to Sell Index",
      "Ideal re-contact timing",
      "Basic analytics and visualization tools",
      "Email support",
    ],
    hasTrial: true,
    popular: false,
    stars: 1,
    additionalDescription: "Great entry point to scale smarter",
  },
  {
    id: "pro-insights",
    name: "Pro Insights",
    price: "$19.95",
    period: "week",
    description: "Ideal for high-volume agents and growing teams",
    features: [
      "Manage up to 1,000 clients",
      "Personal CRM dashboard",
      "Advanced AI-powered questionnaires",
      "Readiness to Sell Index",
      "Ideal re-contact timing",
      "Advanced analytics and visualization tools",
      "Smart Follow-up Reminders",
      "AI audio analysis (100 min/week)",
      "Map visualization for 1,000 clients",
      "Priority email support",
    ],
    hasTrial: false,
    popular: true,
    stars: 2,
    additionalDescription: "Enhanced insights at scale",
  },
  {
    id: "premium-insights",
    name: "Premium Insights",
    price: "$29.95",
    period: "week",
    description: "For elite agents and power users",
    features: [
      "Unlimited clients",
      "Personal CRM dashboard",
      "Comprehensive AI-powered questionnaires",
      "Readiness to Sell Index",
      "Ideal re-contact timing",
      "Comprehensive analytics and visualization tools",
      "Smart Follow-up Reminders",
      "AI audio analysis (1,000 min/week)",
      "Unlimited map visualization",
      "Beta feature access",
      "Priority email + 24/7 call support",
    ],
    hasTrial: false,
    popular: false,
    stars: 3,
    additionalDescription: "Unlocked performance, no caps",
  },
]

export function SubscriptionModal({ open, onOpenChange, currentPlan }: SubscriptionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Upgrade Your Plan</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 py-6">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-lg ${
                  isCurrentPlan ? 'border-purple-500 ring-2 ring-purple-200' : 
                  plan.popular ? 'border-purple-300' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 bg-purple-600 text-white px-6 py-2 rounded-full text-xs font-semibold flex items-center shadow-lg">
                    <Star className="h-4 w-4 mr-1" />
                    <span>Most Popular</span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white text-xs px-3 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-6 pt-8">
                  <div className="flex items-center justify-center mx-auto mb-4">
                    {Array.from({ length: plan.stars }).map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-purple-600 fill-purple-600" />
                    ))}
                  </div>
                  <CardTitle className="text-2xl font-bold mb-1">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-purple-800">{plan.price}</span>
                    <span className="text-lg ml-2 text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.additionalDescription && (
                    <p className="mt-4 text-sm font-medium text-gray-700 text-center">
                      {plan.additionalDescription}
                    </p>
                  )}
                </CardContent>
                <CardFooter>
                  {isCurrentPlan ? (
                    <Button variant="outline" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button 
                      className={`w-full py-4 text-lg font-semibold transition-all duration-200 ${
                        plan.popular 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl' 
                          : 'bg-white text-purple-700 border-2 border-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      {plan.hasTrial ? 'Start Free Trial' : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </CardFooter>
                {plan.hasTrial && (
                  <p className="text-center text-sm text-gray-500 mt-2 pb-4">
                    14-day free trial • Cancel anytime
                  </p>
                )}
              </Card>
            )
          })}
        </div>

        <DialogFooter className="flex justify-center">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
