"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Toast } from "@/components/ui/toast"
import { Building2, Eye, EyeOff, Check, ChevronsUpDown, Mail, Lock, Loader2, AlertCircle, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [isAnimating, setIsAnimating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

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
    // Show modal with entrance animation
    const timer = setTimeout(() => setShowModal(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
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

    // Check URL params for initial mode
    const initialMode = searchParams.get("mode")
    if (initialMode === "signup") {
      setMode("signup")
    }
  }, [router, searchParams])

  useEffect(() => {
    const fetchAgencies = async () => {
      const { data, error } = await supabase.from("real_estate_agencies").select("*").order("name")
      if (data && !error) {
        setAgencies(data)
      }
    }
    fetchAgencies()
  }, [])

  const toggleMode = () => {
    setIsAnimating(true)
    setError("")
    setTimeout(() => {
      setMode(mode === "signin" ? "signup" : "signin")
      setTimeout(() => setIsAnimating(false), 50)
    }, 300)
  }

  const handleClose = () => {
    setShowModal(false)
    setTimeout(() => router.push("/"), 300)
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

    if (
      !signUpData.firstName ||
      !signUpData.lastName ||
      !signUpData.email ||
      !signUpData.password ||
      !signUpData.confirmPassword
    ) {
      setError("Please fill in all required fields")
      return
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (signUpData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (!signUpData.agreedToTerms) {
      setError("Please agree to the Terms & Conditions")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const userMetadata = {
        first_name: signUpData.firstName,
        last_name: signUpData.lastName,
        phone_number: signUpData.phoneNumber,
        agency_id: selectedAgency?.id || null,
        agency_name: selectedAgency?.name || null,
      }

      const { data: signUpResponse, error: signUpError } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

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
          setShowSuccessToast(true)
          return
        }
        router.push("/dashboard")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [])

  return (
    <>
      {/* Success Toast */}
      {showSuccessToast && (
        <Toast variant="success" title="Email Sent! 🎉" onClose={() => setShowSuccessToast(false)}>
          <div className="mt-2 space-y-3">
            <p className="text-sm text-green-700">
              We've sent you an email with a login link. Please check your inbox and click the link to access your
              account.
            </p>
          </div>
        </Toast>
      )}

      {/* Dark Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full animate-pulse"></div>
          <div
            className="absolute top-40 -left-40 w-60 h-60 bg-slate-700/40 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 right-20 w-40 h-40 bg-primary/15 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        {/* Modal Container */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className={`relative w-full max-w-6xl h-[700px] transform transition-all duration-700 ease-out ${
              showModal ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8"
            }`}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute -top-4 -right-4 z-50 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-all duration-200 hover:scale-110"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main Container with Yin-Yang Effect */}
            <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
              {/* Toggle Buttons */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-30">
                <div className="flex bg-white/10 backdrop-blur-sm rounded-full p-1">
                  <button
                    onClick={toggleMode}
                    disabled={isAnimating}
                    className={`px-8 py-3 rounded-full font-semibold transition-all duration-500 ${
                      mode === "signin" ? "bg-white text-slate-900 shadow-lg" : "text-white hover:text-white/80"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={toggleMode}
                    disabled={isAnimating}
                    className={`px-8 py-3 rounded-full font-semibold transition-all duration-500 ${
                      mode === "signup" ? "bg-slate-900 text-white shadow-lg" : "text-white hover:text-white/80"
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Yin-Yang Container */}
              <div className="relative w-full h-full flex">
                {/* Left Side - Sign In */}
                <div
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    mode === "signin"
                      ? "bg-gradient-to-br from-white to-gray-50"
                      : "bg-gradient-to-br from-slate-900 to-slate-800"
                  } ${isAnimating ? "scale-105" : "scale-100"}`}
                  style={{
                    clipPath:
                      mode === "signin"
                        ? "polygon(0 0, 60% 0, 50% 100%, 0 100%)"
                        : "polygon(0 0, 40% 0, 50% 100%, 0 100%)",
                  }}
                >
                  {/* Sign In Form */}
                  <div
                    className={`absolute inset-0 flex items-center justify-start pl-16 transition-all duration-700 ${
                      mode === "signin" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                    }`}
                  >
                    <div className="w-full max-w-md space-y-6">
                      {/* Logo */}
                      <div className="flex items-center mb-8">
                        <Building2 className="h-8 w-8 text-primary mr-3" />
                        <span className="text-2xl font-bold text-gray-900">Reverly</span>
                      </div>

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
                </div>

                {/* Right Side - Sign Up */}
                <div
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                    mode === "signup"
                      ? "bg-gradient-to-bl from-slate-900 to-slate-800"
                      : "bg-gradient-to-bl from-white to-gray-50"
                  } ${isAnimating ? "scale-105" : "scale-100"}`}
                  style={{
                    clipPath:
                      mode === "signup"
                        ? "polygon(40% 0, 100% 0, 100% 100%, 50% 100%)"
                        : "polygon(60% 0, 100% 0, 100% 100%, 50% 100%)",
                  }}
                >
                  {/* Sign Up Form */}
                  <div
                    className={`absolute inset-0 flex items-center justify-end pr-16 transition-all duration-700 ${
                      mode === "signup" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                    }`}
                  >
                    <div className="w-full max-w-md space-y-4">
                      {/* Logo */}
                      <div className="flex items-center mb-6">
                        <Building2 className="h-8 w-8 text-white mr-3" />
                        <span className="text-2xl font-bold text-white">Reverly</span>
                      </div>

                      <div className="space-y-2 mb-6">
                        <h1 className="text-3xl font-bold text-white">Create account</h1>
                        <p className="text-white/80">Start your real estate journey</p>
                      </div>

                      <form onSubmit={handleSignUp} className="space-y-4">
                        {/* Name Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-sm font-medium text-white/90">
                              First Name
                            </Label>
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="First name"
                              value={signUpData.firstName}
                              onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                              className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20"
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-sm font-medium text-white/90">
                              Last Name
                            </Label>
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Last name"
                              value={signUpData.lastName}
                              onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                              className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-sm font-medium text-white/90">
                            Email
                          </Label>
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20"
                            disabled={isLoading}
                          />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="text-sm font-medium text-white/90">
                            Phone
                          </Label>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            placeholder="Phone number"
                            value={signUpData.phoneNumber}
                            onChange={(e) => setSignUpData({ ...signUpData, phoneNumber: e.target.value })}
                            className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20"
                            disabled={isLoading}
                          />
                        </div>

                        {/* Agency */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-white/90">Agency (Optional)</Label>
                          <Popover open={agencySearchOpen} onOpenChange={setAgencySearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full h-10 justify-between bg-white/10 border-white/20 text-white hover:bg-white/20"
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
                                          <div className="font-medium">{agency.name}</div>
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

                        {/* Password Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="signup-password" className="text-sm font-medium text-white/90">
                              Password
                            </Label>
                            <div className="relative">
                              <Input
                                id="signup-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={signUpData.password}
                                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                                className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20 pr-10"
                                disabled={isLoading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/90">
                              Confirm
                            </Label>
                            <div className="relative">
                              <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm"
                                value={signUpData.confirmPassword}
                                onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                                className="h-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white focus:ring-white/20 pr-10"
                                disabled={isLoading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="terms"
                            checked={signUpData.agreedToTerms}
                            onCheckedChange={(checked) =>
                              setSignUpData({ ...signUpData, agreedToTerms: checked as boolean })
                            }
                            disabled={isLoading}
                            className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-slate-900"
                          />
                          <Label htmlFor="terms" className="text-sm text-white/90">
                            I agree to the{" "}
                            <Link href="/terms" className="text-white hover:underline">
                              Terms & Conditions
                            </Link>
                          </Label>
                        </div>

                        {/* Submit Button */}
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-10 bg-white text-slate-900 hover:bg-white/90 font-semibold"
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
                </div>
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
