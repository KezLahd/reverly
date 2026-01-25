"use client"

import type React from "react"

import { useState, useEffect } from "react" // Import useRef
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Building2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  ArrowLeft,
} from "lucide-react" // Import ArrowLeft
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GlowButton } from "@/components/glow-button" // Import GlowButton

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          // Check if user has a profile
          const { data: profile } = await supabase.from("user_profiles").select("subscription_status").eq("id", user.id).single()
          const pathname = window.location.pathname;
          if (!profile || !profile.subscription_status) {
            router.push("/auth/signup/completeselection")
          } else if (profile.subscription_status === 'active' || profile.subscription_status === 'paid') {
            router.push("/dashboard")
          } else {
            router.push("/billing")
          }
        }
      } catch (error) {
        // Ignore errors, user is not logged in
      }
    }
    checkUser()
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) {
        if (error.message.includes('User not found')) {
          setError('No account found with this email.')
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Invalid login credentials.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address. Check your inbox for a confirmation link.')
        } else {
          setError(error.message)
        }
      } else if (data.user) {
        // Check if user has a profile to determine redirect
        const { data: profile } = await supabase.from("user_profiles").select("subscription_status").eq("id", data.user.id).single()
        const pathname = window.location.pathname;
        if (!profile || !profile.subscription_status) {
          router.push("/auth/signup/completeselection")
        } else if (profile.subscription_status === 'active' || profile.subscription_status === 'paid') {
          router.push("/dashboard")
        } else {
          router.push("/billing")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/10 rounded-full animate-pulse"></div>
        <div
          className="absolute top-40 -left-40 w-60 h-60 bg-indigo-400/10 rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-40 right-20 w-40 h-40 bg-purple-400/15 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative w-full max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Side - Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 relative">
            {" "}
            {/* Added relative for back button positioning */}
            {/* Back Button */}
            <Link
              href="/"
              className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            {/* Header */}
            <div className="text-center mb-8 mt-8">
              {" "}
              {/* Adjusted mt for back button */}
              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-10 w-10 text-purple-600 mr-3" />
                <span className="text-3xl font-bold text-gray-900">Reverly</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back</h1>
              <p className="text-gray-600">Sign in to your account to continue</p>
            </div>
            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Link href="/auth/forgot-password" className="text-sm text-purple-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked as boolean })}
                  disabled={isLoading}
                />
                <Label htmlFor="remember" className="text-sm text-gray-600">
                  Remember me
                </Label>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                    {error === 'Invalid login credentials.' && (
                      <>
                        {" "}
                        <Link href="/auth/forgot-password" className="text-purple-600 hover:underline ml-2">Forgot password?</Link>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Button with GlowEffect */}
              <GlowButton
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-semibold text-lg bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </GlowButton>
            </form>
            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-purple-600 hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          {/* Right Side - Analytics Visualization */}
          <div className="space-y-6 hidden md:block">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Real Estate Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Mock Analytics Chart 1 */}
                  <div className="h-32 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-lg p-4 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Lead Conversion</span>
                      <span className="text-sm font-bold">+24%</span>
                    </div>
                    <div className="flex items-end h-12 mt-2 space-x-1">
                      {[40, 25, 35, 30, 45, 35, 55, 25, 40, 45, 60, 50].map((height, i) => (
                        <div key={i} className="bg-white/40 rounded-sm w-full" style={{ height: `${height}%` }}></div>
                      ))}
                    </div>
                  </div>

                  {/* Mock Analytics Chart 2 */}
                  <div className="h-32 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Client Engagement</span>
                      <PieChart className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-center h-16 mt-2">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-300/30"></div>
                        <div
                          className="absolute inset-0 rounded-full border-4"
                          style={{
                            clipPath: "polygon(0 0, 100% 0, 100% 100%, 0% 100%)",
                            borderColor: "white transparent transparent transparent",
                            transform: "rotate(45deg)",
                          }}
                        ></div>
                        <div
                          className="absolute inset-0 rounded-full border-4"
                          style={{
                            clipPath: "polygon(0 0, 50% 0, 50% 50%, 0 50%)",
                            borderColor: "transparent purple-400 transparent transparent",
                            transform: "rotate(30deg)",
                          }}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">75%</div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Analytics Chart 3 */}
                  <div className="h-32 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Property Insights</span>
                      <LineChart className="h-4 w-4" />
                    </div>
                    <div className="flex items-end h-12 mt-2 relative">
                      <div className="absolute inset-x-0 bottom-0 h-px bg-white/30"></div>
                      <svg className="w-full h-full" viewBox="0 0 100 40">
                        <path
                          d="M0,35 Q10,10 20,30 T40,15 T60,25 T80,5 T100,20"
                          fill="none"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <circle cx="20" cy="30" r="2" fill="white" />
                        <circle cx="40" cy="15" r="2" fill="white" />
                        <circle cx="60" cy="25" r="2" fill="white" />
                        <circle cx="80" cy="5" r="2" fill="white" />
                      </svg>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-white/80 text-sm">
                Access your real-time analytics and insights by signing in to your Reverly account.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
