"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Phone, TrendingUp, DollarSign, MapPin, ArrowRight } from "lucide-react"
import { useState } from "react"

const features = [
  {
    icon: Phone,
    title: "Door Knock & Call Tracking",
    description: "Log every interaction with prospects and track your outreach effectiveness across all channels.",
    stats: "40% increase in conversion",
    color: "bg-primary/15 text-primary",
  },
  {
    icon: TrendingUp,
    title: "Readiness to Sell Index",
    description: "AI-powered scoring system that predicts which properties are most likely to sell soon.",
    stats: "85% prediction accuracy",
    color: "bg-slate-100 text-slate-700",
  },
  {
    icon: DollarSign,
    title: "Smart Property Valuations",
    description: "Get accurate, real-time property valuations powered by market data and comparable sales.",
    stats: "Real-time market data",
    color: "bg-purple-100 text-purple-800",
  },
  {
    icon: MapPin,
    title: "Google Maps Visualisation",
    description: "Visualize your territory, track activities, and identify opportunities on an interactive map.",
    stats: "Territory optimization",
    color: "bg-primary/15 text-primary",
  },
]

export function Features() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  return (
    <section className="py-20 bg-gradient-to-b from-purple-50 to-background" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">Everything you need to close more deals</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Powerful tools designed specifically for real estate professionals who want to work smarter, not harder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className={`group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform bg-white/80 backdrop-blur-sm ${
                hoveredCard === index ? "scale-105 -translate-y-2" : ""
              }`}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardContent className="p-8 text-center space-y-6">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 ${feature.color} ${
                    hoveredCard === index ? "scale-110" : ""
                  }`}
                >
                  <feature.icon className="h-8 w-8" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{feature.description}</p>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">{feature.stats}</span>
                    <ArrowRight
                      className={`h-4 w-4 text-slate-400 transition-all duration-300 ${
                        hoveredCard === index ? "text-primary translate-x-1" : ""
                      }`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional dynamic element */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-purple-100 shadow-lg">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-slate-600 font-medium">Live data updates every 5 minutes</span>
          </div>
        </div>
      </div>
    </section>
  )
}
