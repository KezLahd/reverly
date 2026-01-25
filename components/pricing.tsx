"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Check } from "lucide-react"

interface PricingProps {
  onSignUpClick?: () => void
}

// Master list of individual features for consistent rendering
const individualFeaturesList = [
  { key: "clientLimit", label: "Manage up to" },
  { key: "personalCrmDashboard", label: "Personal CRM dashboard" },
  { key: "smartQuestionnaires", label: "AI-powered questionnaires" },
  { key: "readinessToSellIndex", label: "Readiness to Sell Index" },
  { key: "idealRecontactTiming", label: "Ideal re-contact timing" },
  { key: "graphBasedInsights", label: "Analytics and visualisation tools" },
  { key: "smartFollowUpReminders", label: "Smart Follow-up Reminders" },
  { key: "aiAudioAnalysis", label: "AI audio analysis" },
  { key: "mapVisualisation", label: "Map visualisation" },
  { key: "betaFeatureAccess", label: "Beta Feature Access" },
  { key: "supportTier", label: "Support Tier:" },
]

// Add index signatures to feature types
// For individual features
interface IndividualFeatures {
  [key: string]: string | boolean | undefined;
  clientLimit: string;
  personalCrmDashboard: boolean;
  smartQuestionnaires: string;
  readinessToSellIndex: boolean;
  idealRecontactTiming: boolean;
  graphBasedInsights: string;
  smartFollowUpReminders: boolean;
  aiAudioAnalysis: boolean | string;
  mapVisualisation: boolean | string;
  betaFeatureAccess: boolean;
  supportTier: string;
}

const individualPlans = [
  {
    name: "Basic Insights",
    price: "$9.95",
    period: "week",
    description: "Perfect for solo agents or early-stage users",
    features: {
      clientLimit: "100 clients",
      personalCrmDashboard: true,
      smartQuestionnaires: "Basic",
      readinessToSellIndex: true,
      idealRecontactTiming: true,
      graphBasedInsights: "Basic",
      smartFollowUpReminders: false,
      aiAudioAnalysis: false,
      mapVisualisation: false,
      betaFeatureAccess: false,
      supportTier: "Email only",
    },
    cta: "Get Started",
    hasTrial: true,
    popular: false,
    icon: Star,
    stars: 1,
    additionalDescription: "Great entry point to scale smarter",
  },
  {
    name: "Pro Insights",
    price: "$19.95",
    period: "week",
    description: "Ideal for high-volume agents and growing teams",
    features: {
      clientLimit: "1,000 clients",
      personalCrmDashboard: true,
      smartQuestionnaires: "Advanced",
      readinessToSellIndex: true,
      idealRecontactTiming: true,
      graphBasedInsights: "Advanced",
      smartFollowUpReminders: true,
      aiAudioAnalysis: "100 min/week",
      mapVisualisation: "for 1,000 clients",
      betaFeatureAccess: false,
      supportTier: "Priority Email",
    },
    cta: "Upgrade to Pro",
    hasTrial: false,
    popular: true,
    icon: Star,
    stars: 2,
    additionalDescription: "Enhanced insights at scale",
  },
  {
    name: "Premium Insights",
    price: "$29.95",
    period: "week",
    description: "For elite agents and power users",
    features: {
      clientLimit: "Unlimited", // Updated to Unlimited
      personalCrmDashboard: true,
      smartQuestionnaires: "Comprehensive",
      readinessToSellIndex: true,
      idealRecontactTiming: true,
      graphBasedInsights: "Comprehensive",
      smartFollowUpReminders: true,
      aiAudioAnalysis: "1,000 min/week",
      mapVisualisation: "unlimited clients",
      betaFeatureAccess: true,
      supportTier: "Priority Email + 24/7 Call",
    },
    cta: "Go Premium",
    hasTrial: false,
    popular: false,
    icon: Star,
    stars: 3,
    additionalDescription: "Unlocked performance, no caps",
  },
]

// Master list of agency features for consistent rendering
const agencyFeaturesList = [
  { key: "clientLimitPerUser", label: "Client Limit (Per User)" },
  { key: "sharedAgencyDatabase", label: "Shared Agency Database" },
  { key: "adminControls", label: "Admin Controls" },
  { key: "userVisibilitySettings", label: "User Visibility Settings" },
  { key: "minimumUsers", label: "Minimum Users" },
]

// For agency features
interface AgencyFeatures {
  [key: string]: string | boolean | number | undefined;
  clientLimitPerUser: string;
  sharedAgencyDatabase: boolean;
  adminControls: string;
  userVisibilitySettings: string;
  minimumUsers: number;
}

const agencyPlans = [
  {
    name: "Basic Agency",
    price: "$11.95",
    period: "week",
    description: "Perfect for small teams starting their agency journey.",
    individualFeatures: {
      // Individual features for Basic Agency
      clientLimit: "100 clients",
      personalCrmDashboard: true,
      smartQuestionnaires: "Basic",
      readinessToSellIndex: true,
      idealRecontactTiming: true,
      graphBasedInsights: "Basic",
      smartFollowUpReminders: false,
      aiAudioAnalysis: false,
      mapVisualisation: false,
      betaFeatureAccess: false,
      supportTier: "Email only",
    },
    agencyFeatures: {
      // Agency-specific features for Basic Agency
      clientLimitPerUser: "100 clients",
      sharedAgencyDatabase: true,
      adminControls: "Limited",
      userVisibilitySettings: "Basic Roles",
      minimumUsers: 2,
    },
    cta: "Get Started",
    hasTrial: true,
    popular: false,
    icon: Star,
    stars: 1,
  },
  {
    name: "Pro Agency",
    price: "$21.95",
    period: "week",
    description: "Ideal for growing agencies needing advanced collaboration.",
    individualFeatures: {
      // Individual features for Pro Agency
      clientLimit: "1,000 clients",
      personalCrmDashboard: true,
      smartQuestionnaires: "Advanced",
      readinessToSellIndex: true,
      idealRecontactTiming: true,
      graphBasedInsights: "Advanced",
      smartFollowUpReminders: true,
      aiAudioAnalysis: "100 min/week",
      mapVisualisation: "for 1,000 clients",
      betaFeatureAccess: false,
      supportTier: "Priority Email",
    },
    agencyFeatures: {
      // Agency-specific features for Pro Agency
      clientLimitPerUser: "1,000 clients",
      sharedAgencyDatabase: true,
      adminControls: "Full",
      userVisibilitySettings: "Custom Roles",
      minimumUsers: 2,
    },
    cta: "Upgrade to Pro",
    hasTrial: false,
    popular: true,
    icon: Star,
    stars: 2,
  },
  {
    name: "Premium Agency",
    price: "$31.95",
    period: "week",
    description: "For large enterprises requiring fine-grained control and unlimited scale.",
    individualFeatures: {
      // Individual features for Premium Agency
      clientLimit: "Unlimited", // Updated to Unlimited
      personalCrmDashboard: true,
      smartQuestionnaires: "Comprehensive",
      readinessToSellIndex: true,
      idealRecontactTiming: true,
      graphBasedInsights: "Comprehensive",
      smartFollowUpReminders: true,
      aiAudioAnalysis: "1,000 min/week",
      mapVisualisation: "unlimited clients",
      betaFeatureAccess: true,
      supportTier: "Priority Email + 24/7 Call",
    },
    agencyFeatures: {
      // Agency-specific features for Premium Agency
      clientLimitPerUser: "Unlimited", // Updated to Unlimited
      sharedAgencyDatabase: true,
      adminControls: "Full + Bulk Tools",
      userVisibilitySettings: "Fine-Grained Access",
      minimumUsers: 2,
    },
    cta: "Go Premium",
    hasTrial: false,
    popular: false,
    icon: Star,
    stars: 3,
  },
]

const boldIfDifferent = (featureKey: string, value: any, planIndex: number, type: "individual" | "agency") => {
  let basicValue: any
  let isDifferentiatingFeature = false

  if (type === "individual") {
    basicValue = (individualPlans[0].features as any)[featureKey]
    isDifferentiatingFeature = [
      "clientLimit",
      "aiAudioAnalysis",
      "mapVisualisation",
      "betaFeatureAccess",
      "supportTier",
      "graphBasedInsights",
      "smartQuestionnaires",
      "idealRecontactTiming",
      "smartFollowUpReminders",
    ].includes(featureKey)
  } else {
    // type === "agency"
    basicValue = (agencyPlans[0].agencyFeatures as any)[featureKey] // Compare against Basic Agency's agencyFeatures
    isDifferentiatingFeature = ["clientLimitPerUser", "adminControls", "userVisibilitySettings"].includes(featureKey)
  }

  let shouldBold = false
  if (isDifferentiatingFeature) {
    if (
      featureKey === "clientLimit" ||
      featureKey === "aiAudioAnalysis" ||
      featureKey === "mapVisualisation" ||
      featureKey === "clientLimitPerUser"
    ) {
      shouldBold = true
    } else if (
      featureKey === "graphBasedInsights" ||
      featureKey === "smartQuestionnaires" ||
      featureKey === "adminControls" ||
      featureKey === "userVisibilitySettings"
    ) {
      shouldBold = value !== basicValue
    } else if (featureKey === "betaFeatureAccess") {
      shouldBold = value === true
    } else if (featureKey === "supportTier") {
      shouldBold = value !== basicValue
    } else if (featureKey === "smartFollowUpReminders" || featureKey === "idealRecontactTiming") {
      shouldBold = value === true && basicValue === false
    }
  }
  return shouldBold
}

export function Pricing({ onSignUpClick }: PricingProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [pricingType, setPricingType] = useState<"individual" | "agency">("individual")
  const plans = pricingType === "individual" ? individualPlans : agencyPlans

  const handleGetStarted = () => {
    if (onSignUpClick) {
      onSignUpClick()
    }
  }

  const handlePlanClick = (index: number) => {
    setSelectedPlan(selectedPlan === index ? null : index)
  }

  return (
    <section
      className={`py-20 transition-all duration-500 ${
        pricingType === "agency"
          ? "bg-gradient-to-b from-purple-900 to-purple-800 text-white" // Deep purple background for agency section
          : "bg-gradient-to-b from-background to-purple-50"
      }`}
      id="pricing"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-bold text-center mb-4">Choose Your Plan</h2>
        </div>
        <div className="text-center mb-16 space-y-4">
        </div>

        {/* Pricing Type Toggle */}
        <div className="flex justify-center mb-12">
          <div className={`p-1 rounded-xl flex ${pricingType === "agency" ? "bg-white/20" : "bg-slate-100"}`}>
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
                pricingType === "agency" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Agency
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            // Type guards
            const isIndividual = pricingType === "individual" && 'features' in plan;
            const isAgency = pricingType === "agency" && 'agencyFeatures' in plan && 'individualFeatures' in plan;
            return (
              <div
                key={index}
                className={`relative group transition-transform duration-300 hover:scale-[1.02]`}
              >
                {plan.popular && (
                  <div
                    className={`absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 bg-purple-600 text-white px-6 py-2 rounded-full text-xs font-semibold flex items-center shadow-lg`}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    <span className="text-xs">Most Popular</span>
                  </div>
                )}
                <Card
                  onClick={() => handlePlanClick(index)}
                  className={`relative border-2 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer h-full bg-white text-gray-900 ${
                    selectedPlan === index ? "border-purple-500 ring-4 ring-purple-200" : "border-gray-200"
                  }`}
                >
                  <CardHeader className="text-center pb-6 pt-8">
                    <div className="flex items-center justify-center mx-auto mb-4">
                      {Array.from({ length: plan.stars }).map((_, i) => (
                        <Star key={i} className="h-6 w-6 text-purple-600 fill-purple-600" />
                      ))}
                    </div>
                    <CardTitle className="text-2xl md:text-lg font-bold mb-1 text-gray-900">
                      {plan.name}
                    </CardTitle>
                    <div className="mb-4">
                      <span className="text-5xl md:text-3xl font-bold text-purple-800">{plan.price}</span>
                      <span className="text-lg md:text-base ml-2 text-gray-700">
                        {pricingType === "agency" ? "/user/" : "/"}
                        {plan.period}
                      </span>
                    </div>
                    <p className="leading-relaxed text-base md:text-sm text-gray-700">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0 px-6 pb-8 flex flex-col flex-grow">
                    {/* Agency Features Section */}
                    {isAgency && plan.agencyFeatures && (
                      <div className="bg-purple-800 text-white p-4 rounded-lg mb-8">
                        <h4 className="text-lg font-semibold mb-3">Agency Features</h4>
                        <ul className="space-y-4">
                          {agencyFeaturesList.map((featureItem, featureIndex) => {
                            const featureValue = (plan.agencyFeatures as AgencyFeatures)[featureItem.key];
                            if (featureValue === undefined) return null;
                            const isBold = boldIfDifferent(featureItem.key, featureValue, index, "agency");
                            let displayValue: React.ReactNode = isBold ? <strong>{featureValue}</strong> : featureValue;
                            if (featureItem.key === "sharedAgencyDatabase" && featureValue === true) {
                              displayValue = "Yes";
                            } else if (featureItem.key === "clientLimitPerUser" && featureValue === "Unlimited") {
                              displayValue = <strong>Unlimited clients</strong>;
                            }
                            return (
                              <li key={`agency-feat-${featureIndex}`} className="flex items-start">
                                <Check className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-white" />
                                <span className="leading-relaxed text-base md:text-sm text-white">
                                  {featureItem.label}: {displayValue}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    {/* Individual Features Section */}
                    {isAgency && <h4 className="text-lg font-semibold mb-3 text-gray-900">Individual Features</h4>}
                    <ul className="space-y-4 mb-4">
                      {isIndividual && individualFeaturesList.map((featureItem, featureIndex) => {
                        const featureValue = (plan.features as IndividualFeatures)[featureItem.key];
                        if (featureValue === false || featureValue === undefined) return null;
                        const isBold = boldIfDifferent(featureItem.key, featureValue, index, "individual");
                        const displayValue: React.ReactNode = isBold ? <strong>{featureValue}</strong> : featureValue;
                        let featureText: React.ReactNode;
                        if (featureItem.key === "clientLimit") {
                          featureText = (
                            <>
                              {featureItem.label} {featureValue === "Unlimited" ? <strong>Unlimited clients</strong> : displayValue}
                            </>
                          );
                        } else if (
                          featureItem.key === "graphBasedInsights" ||
                          featureItem.key === "smartQuestionnaires"
                        ) {
                          featureText = (
                            <>
                              {displayValue} {featureItem.label.toLowerCase()}
                            </>
                          );
                        } else if (
                          featureItem.key === "aiAudioAnalysis" ||
                          featureItem.key === "mapVisualisation" ||
                          featureItem.key === "supportTier"
                        ) {
                          featureText = (
                            <>
                              {featureItem.label} {displayValue}
                            </>
                          );
                        } else if (featureItem.key === "betaFeatureAccess") {
                          featureText = featureItem.label;
                        } else {
                          featureText = featureItem.label;
                        }
                        return (
                          <li key={`ind-feat-${featureIndex}`} className="flex items-start">
                            <Check className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-purple-600" />
                            <span className="leading-relaxed text-base md:text-sm text-gray-700">{featureText}</span>
                          </li>
                        );
                      })}
                      {isAgency && individualFeaturesList.map((featureItem, featureIndex) => {
                        const featureValue = (plan.individualFeatures as IndividualFeatures)[featureItem.key];
                        if (featureValue === false || featureValue === undefined) return null;
                        const isBold = boldIfDifferent(featureItem.key, featureValue, index, "individual");
                        const displayValue: React.ReactNode = isBold ? <strong>{featureValue}</strong> : featureValue;
                        let featureText: React.ReactNode;
                        if (featureItem.key === "clientLimit") {
                          featureText = (
                            <>
                              {featureItem.label} {featureValue === "Unlimited" ? <strong>Unlimited clients</strong> : displayValue}
                            </>
                          );
                        } else if (
                          featureItem.key === "graphBasedInsights" ||
                          featureItem.key === "smartQuestionnaires"
                        ) {
                          featureText = (
                            <>
                              {displayValue} {featureItem.label.toLowerCase()}
                            </>
                          );
                        } else if (
                          featureItem.key === "aiAudioAnalysis" ||
                          featureItem.key === "mapVisualisation" ||
                          featureItem.key === "supportTier"
                        ) {
                          featureText = (
                            <>
                              {featureItem.label} {displayValue}
                            </>
                          );
                        } else if (featureItem.key === "betaFeatureAccess") {
                          featureText = featureItem.label;
                        } else {
                          featureText = featureItem.label;
                        }
                        return (
                          <li key={`ind-feat-${featureIndex}`} className="flex items-start">
                            <Check className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5 text-purple-600" />
                            <span className="leading-relaxed text-base md:text-sm text-gray-700">{featureText}</span>
                          </li>
                        );
                      })}
                      {isIndividual && plan.additionalDescription && (
                        <li className={`leading-relaxed font-semibold mt-4 text-gray-700`}>
                          {plan.additionalDescription}
                        </li>
                      )}
                    </ul>
                    <Button
                      onClick={handleGetStarted}
                      disabled={isLoading}
                      className={`w-full py-4 text-lg font-semibold transition-all duration-200 mt-4 bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl`}
                    >
                      {isLoading ? "Loading..." : plan.cta}
                    </Button>
                    {plan.hasTrial && (
                      <p className={`text-center text-sm text-slate-500 mt-2`}>14-day free trial • Cancel anytime</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className={`mb-4 ${pricingType === "agency" ? "text-white/90" : "text-slate-600"}`}>
            Need a custom solution for your team?
          </p>
          <Button
            variant="outline"
            className={`px-8 py-3 ${
              pricingType === "agency"
                ? "border-white/30 text-black hover:bg-white/10" // Changed text-white to text-black
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Contact Sales
          </Button>
        </div>
      </div>
    </section>
  )
}
