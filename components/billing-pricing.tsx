"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BillingPricingProps {
  onSignUpClick?: () => void
  currentPlan?: string
}

const individualPlans = [
  {
    name: "Basic Insights",
    emoji: "🧑‍💼",
    price: "$9.95",
    period: "week",
    description: "Essential features for solo agents",
    features: [
      { text: "100 clients", tooltip: null },
      { text: "Basic CRM dashboard", tooltip: "Track your client interactions and manage your pipeline" },
      { text: "Basic analytics", tooltip: "View key metrics and performance indicators" },
      { text: "Email support", tooltip: null }
    ],
    cta: "Select Plan",
    popular: false
  },
  {
    name: "Pro Insights",
    emoji: "🚀",
    price: "$19.95",
    period: "week",
    description: "Advanced features for growing teams",
    features: [
      { text: "1,000 clients", tooltip: null },
      { text: "Advanced analytics", tooltip: "Deep insights into your business performance" },
      { text: "AI-powered insights", tooltip: "Get smart recommendations and predictions powered by AI" },
      { text: "Priority support", tooltip: "Faster response times and dedicated support" },
      { text: "Smart follow-ups", tooltip: "Automated follow-up reminders based on client behavior" }
    ],
    cta: "Select Plan",
    popular: true
  },
  {
    name: "Premium Insights",
    emoji: "🧠",
    price: "$29.95",
    period: "week",
    description: "Complete solution for power users",
    features: [
      { text: "Unlimited clients", tooltip: null },
      { text: "Comprehensive analytics", tooltip: "Advanced reporting and custom dashboards" },
      { text: "Advanced AI tools", tooltip: "Cutting-edge AI features for maximum efficiency" },
      { text: "24/7 priority support", tooltip: "Round-the-clock support with dedicated account manager" },
      { text: "Beta feature access", tooltip: "Early access to new features and innovations" }
    ],
    cta: "Select Plan",
    popular: false
  }
]

const agencyPlans = [
  {
    name: "Basic Agency",
    emoji: "🏢",
    price: "$11.95",
    period: "week",
    description: "Perfect for small teams",
    features: [
      { text: "100 clients per user", tooltip: null },
      { text: "Shared agency database", tooltip: "Collaborative workspace for your team" },
      { text: "Basic admin controls", tooltip: "Manage team permissions and access" },
      { text: "Email support", tooltip: null }
    ],
    cta: "Select Plan",
    popular: false
  },
  {
    name: "Pro Agency",
    emoji: "🚀",
    price: "$21.95",
    period: "week",
    description: "Ideal for growing agencies",
    features: [
      { text: "1,000 clients per user", tooltip: null },
      { text: "Advanced team analytics", tooltip: "Track team performance and collaboration" },
      { text: "Custom roles & permissions", tooltip: "Fine-grained control over team access" },
      { text: "Priority support", tooltip: "Dedicated support for your agency" },
      { text: "Team collaboration tools", tooltip: "Enhanced tools for team coordination" }
    ],
    cta: "Select Plan",
    popular: true
  },
  {
    name: "Premium Agency",
    emoji: "💎",
    price: "$31.95",
    period: "week",
    description: "For large enterprises",
    features: [
      { text: "Unlimited clients", tooltip: null },
      { text: "Enterprise analytics", tooltip: "Advanced reporting for large organizations" },
      { text: "Advanced AI tools", tooltip: "AI-powered insights for your entire team" },
      { text: "24/7 priority support", tooltip: "Round-the-clock support with dedicated account manager" },
      { text: "Custom integrations", tooltip: "Connect with your existing tools and workflows" }
    ],
    cta: "Select Plan",
    popular: false
  }
]

const featureComparison = {
  headers: ["Feature", "Basic", "Pro", "Premium"],
  rows: [
    ["Client Limit", "100 clients", "1,000 clients", "Unlimited"],
    ["CRM Dashboard", "Basic", "Advanced", "Enterprise"],
    ["Analytics", "Basic metrics", "Advanced insights", "Custom reports"],
    ["AI Tools", "Basic AI", "Advanced AI", "Custom AI"],
    ["Support", "Email", "Priority", "24/7 Priority"],
    ["Map Tools", "Basic", "Advanced", "Custom"],
    ["Beta Access", "No", "No", "Yes"]
  ]
}

export function BillingPricing({ onSignUpClick, currentPlan }: BillingPricingProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(currentPlan || null)
  const [pricingType, setPricingType] = useState<"individual" | "agency">("individual")
  const [showComparison, setShowComparison] = useState(false)

  const handlePlanSelect = (planName: string) => {
    setSelectedPlan(planName)
    if (onSignUpClick) {
      onSignUpClick()
    }
  }

  const plans = pricingType === "individual" ? individualPlans : agencyPlans

  function PricingCard({ plan, selectedPlan, onSelect, isLoading }: {
    plan: typeof individualPlans[0]
    selectedPlan: string | null
    onSelect: (name: string) => void
    isLoading: boolean
  }) {
    return (
      <Card
        className={`relative border-2 transition-all duration-300 hover:scale-105 ${
          selectedPlan === plan.name
            ? "border-purple-500 ring-2 ring-purple-200"
            : plan.popular
            ? "border-purple-400"
            : "border-gray-200"
        } shadow-lg rounded-xl bg-transparent`}
      >
        {plan.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-purple-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>
        )}
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex flex-col items-center gap-1 mb-2">
            {/* Star indicators above the plan name, color and size match @pricing.tsx */}
            <span className={`${pricingType === "agency" ? "text-white" : "text-purple-600"} text-2xl font-bold flex items-center justify-center mb-1`}>
              {Array.from({ length: getStars(plan.name) }).map((_, i) => (
                <span key={i}>★</span>
              ))}
            </span>
            <CardTitle className={`text-xl font-bold ${
              pricingType === "agency" ? "text-white" : "text-gray-900"
            }`}>
              {plan.name}
            </CardTitle>
          </div>
          <div className="space-y-1">
            <div className={`text-3xl font-bold ${
              pricingType === "agency" ? "text-white" : "text-purple-700"
            }`}>
              {plan.price}
            </div>
            <div className={`text-sm ${
              pricingType === "agency" ? "text-white/80" : "text-gray-500"
            }`}>
              per {plan.period}
            </div>
          </div>
          <p className={`text-sm ${
            pricingType === "agency" ? "text-white/90" : "text-gray-600"
          } mt-2`}>
            {plan.description}
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start text-sm">
                <Check className={`h-5 w-5 mr-2 flex-shrink-0 ${
                  pricingType === "agency" ? "text-white" : "text-purple-600"
                }`} />
                {feature.tooltip ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`${
                          pricingType === "agency" ? "text-white/90" : "text-gray-700"
                        } cursor-help`}>
                          {feature.text}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{feature.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <span className={pricingType === "agency" ? "text-white/90" : "text-gray-700"}>
                    {feature.text}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <Button
            onClick={() => onSelect(plan.name)}
            disabled={isLoading || selectedPlan === plan.name}
            className={`w-full h-12 ${
              selectedPlan === plan.name
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : pricingType === "agency"
                ? "bg-white text-purple-900 hover:bg-white/90"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            {selectedPlan === plan.name ? "Current Plan" : plan.cta}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`min-h-screen w-full transition-all duration-500 pt-0 mt-0 ${
      pricingType === "agency"
        ? "bg-gradient-to-b from-purple-900 to-purple-800 text-white"
        : "bg-gradient-to-b from-background to-purple-50"
    }`}>
      <div className="w-full max-w-5xl mx-auto px-4 pt-12 mt-0">
        <div className="text-center mb-8 pt-0 mt-0">
          <h2 className={`text-2xl font-semibold mb-2 pt-0 mt-0 ${
            pricingType === "agency" ? "text-white" : "text-gray-900"
          }`}>
            Select Your Plan
          </h2>
          <p className={pricingType === "agency" ? "text-white/90" : "text-gray-600"}>
            Choose the plan that best fits your needs
          </p>
        </div>
        <div className="flex justify-center mb-12">
          <div className={`p-1 rounded-xl flex ${
            pricingType === "agency" ? "bg-white/20" : "bg-slate-100"
          }`}>
            <button
              onClick={() => setPricingType("individual")}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                pricingType === "individual"
                  ? "bg-white text-slate-900 shadow-sm"
                  : pricingType === "agency"
                    ? "text-white/80 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setPricingType("agency")}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                pricingType === "agency"
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Agency
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              selectedPlan={selectedPlan}
              onSelect={handlePlanSelect}
              isLoading={isLoading}
            />
          ))}
        </div>
        <div className="text-center mt-8 space-y-4">
          <button
            onClick={() => setShowComparison(true)}
            className={`font-medium text-sm ${
              pricingType === "agency"
                ? "text-white/90 hover:text-white"
                : "text-purple-600 hover:text-purple-700"
            }`}
          >
            View full feature comparison
          </button>
          <p className={`text-sm ${
            pricingType === "agency" ? "text-white/80" : "text-gray-500"
          }`}>
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className={`text-sm ${
            pricingType === "agency" ? "text-white/80" : "text-gray-500"
          }`}>
            Need a custom solution?{" "}
            <button className={`font-medium ${
              pricingType === "agency"
                ? "text-white hover:text-white/90"
                : "text-purple-600 hover:text-purple-700"
            }`}>
              Contact Sales
            </button>
          </p>
        </div>
        <ComparisonModal isOpen={showComparison} onClose={() => setShowComparison(false)} />
      </div>
    </div>
  )
}

function ComparisonModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-6">Feature Comparison</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                {featureComparison.headers.map((header, index) => (
                  <th
                    key={header}
                    className={`py-3 px-4 text-left ${
                      index === 0 ? "text-gray-900" : "text-purple-700"
                    } font-semibold`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureComparison.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`py-3 px-4 ${
                        cellIndex === 0 ? "text-gray-900 font-medium" : "text-gray-700"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="outline" className="px-6">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add a helper to get stars for each plan
const getStars = (planName: string) => {
  if (planName.toLowerCase().includes("basic")) return 1;
  if (planName.toLowerCase().includes("pro")) return 2;
  if (planName.toLowerCase().includes("premium")) return 3;
  return 1;
};
