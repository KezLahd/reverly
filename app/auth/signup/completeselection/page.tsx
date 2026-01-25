"use client"

import Link from "next/link"
import { Building2, Users, Star } from "lucide-react"

export default function CompleteSelectionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Building2 className="h-10 w-10 text-purple-700 mx-auto mb-2" />
            <h1 className="text-3xl font-bold text-purple-900 mb-2">Complete Your Signup</h1>
            <p className="text-purple-700">Choose your account type to get started with Reverly.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Individual Card */}
            <Link href="/auth/signup/completeselection/individual" className="group block rounded-xl border-2 border-purple-200 hover:border-purple-500 bg-purple-50 p-6 text-center transition-all shadow hover:shadow-lg">
              <Users className="h-8 w-8 mx-auto text-purple-600 mb-2 group-hover:text-purple-800" />
              <div className="text-xl font-semibold text-purple-900 mb-1">Individual</div>
              <div className="text-sm text-purple-700">For solo agents and personal use</div>
            </Link>
            {/* Agency Card (Most Popular) */}
            <Link href="/auth/signup/completeselection/agency" className="group block rounded-xl border-2 border-yellow-400 hover:border-yellow-500 bg-yellow-50 p-6 text-center transition-all shadow hover:shadow-lg relative">
              <div className="absolute -top-4 right-4 flex items-center gap-1 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow">Most Popular <Star className="h-4 w-4 ml-1" /></div>
              <Users className="h-8 w-8 mx-auto text-yellow-700 mb-2 group-hover:text-yellow-900" />
              <div className="text-xl font-semibold text-yellow-900 mb-1">Agency</div>
              <div className="text-sm text-yellow-800">For teams, agencies, and organizations</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
