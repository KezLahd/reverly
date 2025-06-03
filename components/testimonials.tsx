import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Top Producer, Century 21",
    content:
      "Reverly helped me increase my door knock conversion rate by 40%. The readiness index is incredibly accurate.",
    rating: 5,
  },
  {
    name: "Mike Chen",
    role: "Real Estate Agent, RE/MAX",
    content: "The mapping feature is a game-changer. I can see exactly where to focus my efforts for maximum impact.",
    rating: 5,
  },
  {
    name: "Lisa Rodriguez",
    role: "Broker, Keller Williams",
    content: "Finally, a CRM that understands real estate. The property valuations are spot-on and save me hours.",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by top agents nationwide</h2>
          <p className="text-xl text-gray-600">See what real estate professionals are saying about Reverly</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
