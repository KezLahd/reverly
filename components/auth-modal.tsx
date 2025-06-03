"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Toast } from "@/components/ui/toast"
import {
  Building2,
  Eye,
  EyeOff,
  Check,
  ChevronsUpDown,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  X,
  TrendingUp,
  BarChart3,
  Users,
  Phone,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: "signin" | "signup"
}

export function AuthModal({ isOpen, onClose, initialMode = "signin" }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode)
  const [isAnimating, setIsAnimating] = useState(false)
  const router = useRouter()

  // Sign In Form Data
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })

  // Sign Up Form Data
  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
    accountType: "individual" as "individual" | "agency",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [agencies, setAgencies] = useState<any[]>([])
  const [selectedAgency, setSelectedAgency] = useState<any>(null)
  const [agencySearchOpen, setAgencySearchOpen] = useState(false)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const fetchAgencies = async () => {
        const { data, error } = await supabase.from("real_estate_agencies").select("*").order("name")
        if (data && !error) {
          setAgencies(data)
        }
      }
      fetchAgencies()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      // Check if user is already logged in
      const checkUser = async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            router.push("/dashboard")
          }
        } catch (error) {
          // Ignore errors, user is not logged in
        }
      }
      checkUser()
    }
  }, [isOpen, router])

  const toggleMode = () => {
    setIsAnimating(true)
    setError("")
    setTimeout(() => {
      setMode(mode === "signin" ? "signup" : "signin")
      setTimeout(() => setIsAnimating(false), 50)
    }, 300)
  }

  const handleClose = () => {
    onClose()
    // Reset form data
    setSignInData({ email: "", password: "", rememberMe: false })
    setSignUpData({
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      agreedToTerms: false,
      accountType: "individual",
    })
    setError("")
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!signInData.email || !signInData.password) {
      setError("Please enter both email and password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted", signUpData)

    if (
      !signUpData.firstName ||
      !signUpData.lastName ||
      !signUpData.email ||
      !signUpData.password ||
      !signUpData.confirmPassword
    ) {
      console.log("Validation failed: missing required fields")
      setError("Please fill in all required fields")
      return
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      console.log("Validation failed: passwords don't match")
      setError("Passwords do not match")
      return
    }

    if (signUpData.password.length < 8) {
      console.log("Validation failed: password too short")
      setError("Password must be at least 8 characters long")
      return
    }

    if (!signUpData.agreedToTerms) {
      console.log("Validation failed: terms not agreed")
      setError("Please agree to the Terms & Conditions")
      return
    }

    console.log("All validations passed, proceeding with signup")
    setIsLoading(true)
    setError("")

    try {
      const userMetadata = {
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        phone_number: signUpData.phoneNumber || null,
        account_type: signUpData.accountType,
        agency_id: signUpData.accountType === "agency" ? null : selectedAgency?.id || null,
        agency_name: signUpData.accountType === "agency" ? null : selectedAgency?.name || null,
      }

      console.log("Calling supabase.auth.signUp with:", {
        email: signUpData.email,
        metadata: userMetadata,
      })

      const { data: signUpResponse, error: signUpError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log("Supabase response:", { signUpResponse, signUpError })

      if (signUpError) {
        if (
          signUpError.message.includes("User already registered") ||
          signUpError.message.includes("already been registered")
        ) {
          const { error: magicLinkError } = await supabase.auth.signInWithOtp({
            email: signUpData.email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })

          if (magicLinkError) {
            setError("Failed to send login link. Please try again.")
            return
          }

          setShowSuccessToast(true)
          return
        }

        setError(signUpError.message)
        return
      }

      if (signUpResponse.user) {
        if (!signUpResponse.session) {
          console.log("User created, showing success toast")
          setShowSuccessToast(true)
          return
        }
        console.log("User created with session, redirecting to dashboard")
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Sign up error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 z-[200] fixed inset-0 flex items-center justify-center" role="alert">
          <div>
            <strong className="font-bold">Email Sent! 🎉</strong>
            <span className="block sm:inline ml-2">We've sent you an email with a login link. Please check your inbox and click the link to access your account.</span>
            <button onClick={() => setShowSuccessToast(false)} className="ml-4 text-green-700 font-bold">×</button>
          </div>
        </div>
      )}

      {/* Dark Purple Overlay */}
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900/95 via-violet-900/95 to-indigo-900/95 backdrop-blur-sm">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-400/10 rounded-full animate-pulse"></div>
          <div
            className="absolute top-40 -left-40 w-60 h-60 bg-violet-400/10 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 right-20 w-40 h-40 bg-indigo-400/10 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Data Visualization Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Left side charts */}
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 space-y-8 opacity-20">
            <div className="w-64 h-32 bg-gradient-to-r from-purple-400/30 to-violet-400/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-4 w-4 text-purple-300 mr-2" />
                <span className="text-xs text-purple-200">Conversion Rate</span>
              </div>
              <div className="text-2xl font-bold text-purple-100">24.8%</div>
              <div className="w-full h-2 bg-purple-800/50 rounded-full mt-2">
                <div className="w-3/4 h-full bg-gradient-to-r from-purple-400 to-violet-400 rounded-full"></div>
              </div>
            </div>

            <div className="w-64 h-32 bg-gradient-to-r from-violet-400/30 to-indigo-400/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BarChart3 className="h-4 w-4 text-violet-300 mr-2" />
                <span className="text-xs text-violet-200">Monthly Growth</span>
              </div>
              <div className="text-2xl font-bold text-violet-100">+42%</div>
              <div className="flex space-x-1 mt-2">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-violet-400/60 rounded-sm"
                    style={{ height: `${20 + Math.random() * 20}px` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side charts */}
          <div className="absolute right-8 top-1/2 transform -translate-y-1/2 space-y-8 opacity-20">
            <div className="w-64 h-32 bg-gradient-to-r from-indigo-400/30 to-purple-400/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Users className="h-4 w-4 text-indigo-300 mr-2" />
                <span className="text-xs text-indigo-200">Active Agents</span>
              </div>
              <div className="text-2xl font-bold text-indigo-100">2,547</div>
              <div className="flex items-center mt-2">
                <div className="w-8 h-8 bg-indigo-400/60 rounded-full mr-2"></div>
                <div className="w-6 h-6 bg-indigo-400/40 rounded-full mr-2"></div>
                <div className="w-4 h-4 bg-indigo-400/20 rounded-full"></div>
              </div>
            </div>

            <div className="w-64 h-32 bg-gradient-to-r from-purple-400/30 to-pink-400/30 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Phone className="h-4 w-4 text-purple-300 mr-2" />
                <span className="text-xs text-purple-200">Calls Today</span>
              </div>
              <div className="text-2xl font-bold text-purple-100">1,234</div>
              <div className="w-full h-1 bg-purple-800/50 rounded-full mt-2">
                <div className="w-2/3 h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Container */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative w-full max-w-6xl h-[700px] transform transition-all duration-300 ease-out scale-100 opacity-100">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute -top-4 -right-4 z-50 p-3 bg-white/30 backdrop-blur-sm rounded-full text-white hover:bg-white/50 transition-all duration-200 hover:scale-110"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main Container */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl bg-white">
              {/* Toggle Buttons */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-30">
                <div className="flex bg-gray-100 rounded-full p-1">
                  <button
                    onClick={toggleMode}
                    disabled={isAnimating}
                    className={`px-8 py-3 rounded-full font-semibold transition-all duration-500 ${
                      mode === "signin" ? "bg-primary text-white shadow-lg" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={toggleMode}
                    disabled={isAnimating}
                    className={`px-8 py-3 rounded-full font-semibold transition-all duration-500 ${
                      mode === "signup" ? "bg-primary text-white shadow-lg" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Content Container */}
              <div className="relative w-full h-full flex">
                {/* Sign In Mode */}
                {mode === "signin" && (
                  <>
                    {/* Left Side - Sign In Form */}
                    <div className="w-1/2 flex items-center justify-center p-16 pt-28">
                      <div className="w-full max-w-md space-y-6">
                        <div className="space-y-2 mb-8">
                          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
                          <p className="text-gray-600">Sign in to your account to continue</p>
                        </div>

                        <form onSubmit={handleSignIn} className="space-y-6">
                          {/* Email */}
                          <div className="space-y-2">
                            <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700">
                              Email
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="signin-email"
                                type="email"
                                placeholder="Enter your email"
                                value={signInData.email}
                                onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                                className="pl-10 h-12 border-gray-300 focus:border-primary focus:ring-primary"
                                disabled={isLoading}
                              />
                            </div>
                          </div>

                          {/* Password */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700">
                                Password
                              </Label>
                              <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                                Forgot password?
                              </Link>
                            </div>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                id="signin-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={signInData.password}
                                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                                className="pl-10 pr-10 h-12 border-gray-300 focus:border-primary focus:ring-primary"
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
                              checked={signInData.rememberMe}
                              onCheckedChange={(checked) =>
                                setSignInData({ ...signInData, rememberMe: checked as boolean })
                              }
                              disabled={isLoading}
                            />
                            <Label htmlFor="remember" className="text-sm text-gray-600">
                              Remember me
                            </Label>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-primary hover:bg-primary-700 text-white font-semibold"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Signing in...
                              </>
                            ) : (
                              "Sign in"
                            )}
                          </Button>
                        </form>
                      </div>
                    </div>

                    {/* Right Side - Data Visualizations */}
                    <div className="w-1/2 bg-gradient-to-br from-primary/5 to-purple-50 flex items-center justify-center p-8">
                      <div className="space-y-6 w-full max-w-sm">
                        {/* Logo */}
                        <div className="flex items-center justify-center mb-8">
                          <Building2 className="h-10 w-10 text-primary mr-3" />
                          <span className="text-3xl font-bold text-gray-900">Reverly</span>
                        </div>

                        {/* Conversion Rate Chart */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-lg">
                          <div className="flex items-center mb-4">
                            <TrendingUp className="h-5 w-5 text-primary mr-2" />
                            <span className="text-xs font-medium text-gray-700">Conversion Rate</span>
                          </div>
                          <div className="text-3xl font-bold text-primary mb-2">24.8%</div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div className="w-3/4 h-full bg-gradient-to-r from-primary to-purple-500 rounded-full"></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">+2.5% from last month</p>
                        </div>

                        {/* Monthly Growth Chart */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-lg">
                          <div className="flex items-center mb-4">
                            <BarChart3 className="h-5 w-5 text-primary mr-2" />
                            <span className="text-xs font-medium text-gray-700">Monthly Growth</span>
                          </div>
                          <div className="text-3xl font-bold text-primary mb-4">+42%</div>
                          <div className="flex items-end space-x-1 h-16">
                            {[...Array(8)].map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 bg-gradient-to-t from-primary to-purple-400 rounded-sm opacity-80"
                                style={{ height: `${30 + Math.random() * 40}%` }}
                              ></div>
                            ))}
                          </div>
                        </div>

                        {/* Active Users */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-lg">
                          <div className="flex items-center mb-4">
                            <Users className="h-5 w-5 text-primary mr-2" />
                            <span className="text-xs font-medium text-gray-700">Active Agents</span>
                          </div>
                          <div className="text-3xl font-bold text-primary mb-2">2,547</div>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/80 rounded-full"></div>
                            <div className="w-6 h-6 bg-primary/60 rounded-full"></div>
                            <div className="w-4 h-4 bg-primary/40 rounded-full"></div>
                            <span className="text-xs text-gray-500 ml-2">+12% this week</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Sign Up Mode */}
                {mode === "signup" && (
                  <>
                    {/* Left Side - Data Visualizations */}
                    <div className="w-1/2 bg-gradient-to-br from-primary/5 to-purple-50 flex items-center justify-center p-8">
                      <div className="space-y-6 w-full max-w-sm">
                        {/* Logo */}
                        <div className="flex items-center justify-center mb-6">
                          <Building2 className="h-10 w-10 text-primary mr-3" />
                          <span className="text-3xl font-bold text-gray-900">Reverly</span>
                        </div>

                        {/* Call Analytics */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-lg">
                          <div className="flex items-center mb-4">
                            <Phone className="h-5 w-5 text-primary mr-2" />
                            <span className="text-xs font-medium text-gray-700">Calls Today</span>
                          </div>
                          <div className="text-3xl font-bold text-primary mb-2">1,234</div>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div className="w-2/3 h-full bg-gradient-to-r from-primary to-purple-500 rounded-full animate-pulse"></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">85% success rate</p>
                        </div>

                        {/* Revenue Chart */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-lg">
                          <div className="flex items-center mb-4">
                            <TrendingUp className="h-5 w-5 text-primary mr-2" />
                            <span className="text-xs font-medium text-gray-700">Revenue Growth</span>
                          </div>
                          <div className="text-3xl font-bold text-primary mb-4">$127K</div>
                          <div className="relative">
                            <svg className="w-full h-12" viewBox="0 0 200 50">
                              <polyline
                                fill="none"
                                stroke="url(#gradient)"
                                strokeWidth="3"
                                points="0,40 25,35 50,25 75,30 100,15 125,20 150,10 175,5 200,8"
                              />
                              <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#7c3aed" />
                                  <stop offset="100%" stopColor="#a855f7" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-lg">
                          <div className="flex items-center mb-4">
                            <BarChart3 className="h-5 w-5 text-primary mr-2" />
                            <span className="text-xs font-medium text-gray-700">Performance</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Lead Quality</span>
                              <span className="text-sm font-semibold text-primary">94%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Response Time</span>
                              <span className="text-sm font-semibold text-primary">1.2min</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Satisfaction</span>
                              <span className="text-sm font-semibold text-primary">4.8/5</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Sign Up Form */}
                    <div className="w-1/2 flex items-center justify-center p-16 pt-28">
                      <div className="w-full max-w-md space-y-4">
                        <div className="space-y-2 mb-6">
                          <h1 className="text-3xl font-bold text-gray-900">Create account</h1>
                          <p className="text-gray-600">Start your real estate journey</p>
                        </div>

                        <form onSubmit={handleSignUp} className="space-y-4">
                          {/* Name Fields */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                                First Name
                              </Label>
                              <Input
                                id="firstName"
                                type="text"
                                placeholder="First name"
                                value={signUpData.firstName}
                                onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                                className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                                disabled={isLoading}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                                Last Name
                              </Label>
                              <Input
                                id="lastName"
                                type="text"
                                placeholder="Last name"
                                value={signUpData.lastName}
                                onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                                className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                                disabled={isLoading}
                              />
                            </div>
                          </div>

                          {/* Email */}
                          <div className="space-y-2">
                            <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                              Email
                            </Label>
                            <Input
                              id="signup-email"
                              type="email"
                              placeholder="Enter your email"
                              value={signUpData.email}
                              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                              className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                              disabled={isLoading}
                            />
                          </div>

                          {/* Password Fields (moved up) */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                                Password
                              </Label>
                              <div className="relative">
                                <Input
                                  id="signup-password"
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Password"
                                  value={signUpData.password}
                                  onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                                  className="h-10 border-gray-300 focus:border-primary focus:ring-primary pr-10"
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
                            <div className="space-y-2">
                              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                Confirm
                              </Label>
                              <div className="relative">
                                <Input
                                  id="confirmPassword"
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Confirm"
                                  value={signUpData.confirmPassword}
                                  onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                                  className="h-10 border-gray-300 focus:border-primary focus:ring-primary pr-10"
                                  disabled={isLoading}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Phone */}
                          <div className="space-y-2">
                            <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                              Phone
                            </Label>
                            <Input
                              id="phoneNumber"
                              type="tel"
                              placeholder="Phone number"
                              value={signUpData.phoneNumber}
                              onChange={(e) => setSignUpData({ ...signUpData, phoneNumber: e.target.value })}
                              className="h-10 border-gray-300 focus:border-primary focus:ring-primary"
                              disabled={isLoading}
                            />
                          </div>

                          {/* Account Type Toggle */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Account Type</Label>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                              <button
                                type="button"
                                onClick={() => setSignUpData({ ...signUpData, accountType: "individual" })}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                  signUpData.accountType === "individual"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                                disabled={isLoading}
                              >
                                Individual Agent
                              </button>
                              <button
                                type="button"
                                onClick={() => setSignUpData({ ...signUpData, accountType: "agency" })}
                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                                  signUpData.accountType === "agency"
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                                disabled={isLoading}
                              >
                                Agency Owner
                              </button>
                            </div>
                          </div>

                          {/* Agency - Only show for individual accounts */}
                          {signUpData.accountType === "individual" && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">Agency (Optional)</Label>
                              <Popover open={agencySearchOpen} onOpenChange={setAgencySearchOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full h-10 justify-between border-gray-300 hover:border-primary"
                                    disabled={isLoading}
                                  >
                                    <span className="truncate">
                                      {selectedAgency ? selectedAgency.name : "Select agency"}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                  <Command>
                                    <CommandInput placeholder="Search agencies..." />
                                    <CommandList>
                                      <CommandEmpty>No agency found.</CommandEmpty>
                                      <CommandGroup>
                                        {agencies.map((agency) => (
                                          <CommandItem
                                            key={agency.id}
                                            value={agency.name}
                                            onSelect={() => {
                                              setSelectedAgency(agency)
                                              setAgencySearchOpen(false)
                                            }}
                                          >
                                            <Check
                                              className={`mr-2 h-4 w-4 ${
                                                selectedAgency?.id === agency.id ? "opacity-100" : "opacity-0"
                                              }`}
                                            />
                                            <div>
                                              <div className="font-medium text-white">{agency.name}</div>
                                              <div className="text-xs text-gray-500">{agency.location}</div>
                                            </div>
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}

                          {/* Terms */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="terms"
                              checked={signUpData.agreedToTerms}
                              onCheckedChange={(checked) =>
                                setSignUpData({ ...signUpData, agreedToTerms: checked as boolean })
                              }
                              disabled={isLoading}
                            />
                            <Label htmlFor="terms" className="text-sm text-gray-600">
                              I agree to the{" "}
                              <Link href="/terms" className="text-primary hover:underline">
                                Terms & Conditions
                              </Link>
                            </Label>
                          </div>

                          {/* Submit Button */}
                          <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-10 bg-primary hover:bg-primary-700 text-white font-semibold"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Account"
                            )}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Error Alert - Floating */}
              {error && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-md px-4">
                  <Alert variant="destructive" className="bg-red-50/95 backdrop-blur-sm border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AuthModal
