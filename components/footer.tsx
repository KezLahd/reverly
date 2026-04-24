import { Building2, Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-slate-800 text-slate-100 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 space-y-4">
            <div className="flex items-center mb-4">
              <Building2 className="h-8 w-8 text-primary mr-2" />
              <span className="text-xl font-bold">Reverly</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Empowering real estate professionals with smart analytics and predictive insights.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-slate-300">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-sm">reverly@mjsons.net</span> {/* Updated email */}
              </div>
              <div className="flex items-center text-slate-300">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-sm">1-800-REVERLY</span>
              </div>
              <div className="flex items-center text-slate-300">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="text-sm">Sydney, NSW</span> {/* Updated location */}
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-50">Product</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              {/* Removed API and Integrations */}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-50">Company</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              {/* Removed Careers and Press */}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-slate-50">Support</h3>
            <ul className="space-y-2 text-slate-300">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">&copy; 2025 Reverly. All rights reserved.</p>
          <p className="text-slate-400 text-sm">
            Another{" "}
            <a
              href="https://instagram.com/kieranjxn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Kez Curation ↗
            </a>
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-400 hover:text-primary transition-colors text-sm">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
