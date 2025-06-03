"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Toast } from "@/components/ui/toast"
import { Building2, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Users, Plus, Minus } from "lucide-react" // Removed MapPin
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { v4 as uuidv4 } from "uuid"

// Removed Google Places types declaration

// TypeScript declaration for window.google
// @ts-ignore
declare global {
  interface Window {
    google: any;
  }
}

export default function AgencySignUpForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agencyName: "",
    agencyLocation: "", // This will now be a simple text input
    numberOfUsers: 2,
    agreedToTerms: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Get the Google Places API key from the environment
  const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY

  const pricePerUser = 11.95
  const totalWeeklyPrice = formData.numberOfUsers * pricePerUser
  const totalMonthlyPrice = totalWeeklyPrice * 4.33 // Average weeks per month

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

    // Google Places Autocomplete logic
    function initAutocomplete() {
      if (window.google && locationInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(locationInputRef.current, {
          types: ["(cities)"]
        })
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()
          if (place && place.formatted_address) {
            setFormData((prev) => ({ ...prev, agencyLocation: place.formatted_address }))
          } else if (place && place.name) {
            setFormData((prev) => ({ ...prev, agencyLocation: place.name }))
          }
        })
      }
    }

    if (!window.google) {
      // Only add script if not already present
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
      script.async = true
      script.onload = initAutocomplete
      document.body.appendChild(script)
    } else {
      initAutocomplete()
    }
  }, [router, GOOGLE_PLACES_API_KEY])

  // Removed initializeAutocomplete function

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword || !formData.agencyName) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreedToTerms) {
      toast({
        title: "Terms not agreed",
        description: "Please agree to the Terms & Conditions.",
        variant: "destructive",
      });
      return;
    }

    if (formData.numberOfUsers < 2) {
      toast({
        title: "Not enough users",
        description: "Agency accounts require a minimum of 2 users.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true)

    try {
      // Generate IDs
      const tempId = uuidv4()
      const agency_id = uuidv4()

      // Insert into signups first - this will work with RLS enabled due to our policy
      const { error: signupError } = await supabase.from('signups').insert([
        {
          id: tempId, // Temporary ID until email confirmation
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          user_type: 'agency',
          agency_id: agency_id,
          agency_name: formData.agencyName,
          agency_location: formData.agencyLocation,
          is_agency_owner: true,
          agency_member_id: `${agency_id}_${tempId}`, // Format: agency_id_user_id
          subscription_status: 'unpaid',
          has_confirmed_email: false,
          created_at: new Date().toISOString(),
        }
      ])

      if (signupError) {
        toast({
          title: "Failed to create signup",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      const userMetadata = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber || null,
        account_type: "agency",
        agency_name: formData.agencyName,
        agency_location: formData.agencyLocation || null,
        number_of_users: formData.numberOfUsers,
        is_agency_owner: true,
        agency_id,
        temp_signup_id: tempId, // Store the temp ID to link back to signups after confirmation
      }

      const { data: signUpResponse, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        if (
          signUpError.message.toLowerCase().includes("password")
        ) {
          toast({
            title: "Incorrect password",
            description: (
              <span>
                The password you entered is incorrect. <a href="/auth/forgot-password" className="text-purple-600 underline ml-1">Forgot password?</a>
              </span>
            ),
            variant: "destructive",
          });
          return;
        }
        if (
          signUpError.message.includes("User already registered") ||
          signUpError.message.includes("already been registered")
        ) {
          const { error: magicLinkError } = await supabase.auth.signInWithOtp({
            email: formData.email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          })

          if (magicLinkError) {
            toast({
              title: "Failed to send login link",
              description: "Please try again.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Email Sent! 🎉",
            description: "We've sent you an email with a login link. Please check your inbox and click the link to access your agency account.",
            variant: "default",
          });
          return;
        }

        toast({
          title: "Sign up error",
          description: signUpError.message,
          variant: "destructive",
        });
        return;
      }

      if (signUpResponse.user) {
        const { user } = signUpResponse
        
        // Only update signups and create user_profiles if we have a session (user is authenticated)
        if (signUpResponse.session) {
          // Update the signups record with the real user ID and confirmed status
          await supabase.from('signups')
            .update({ 
              id: user.id,
              has_confirmed_email: true,
              agency_member_id: `${agency_id}_${user.id}` // Update with real user ID
            })
            .eq('id', tempId)
          
          // Create user_profiles record
          await supabase.from("user_profiles").insert([
            {
              id: user.id,
              first_name: formData.firstName,
              last_name: formData.lastName,
              email: formData.email,
              phone_number: formData.phoneNumber || null,
              agency_id: agency_id,
              agency_name: formData.agencyName,
              agency_location: formData.agencyLocation || null,
              subscription_status: "unpaid",
              account_type: "agency",
              is_agency_owner: true,
              number_of_users: formData.numberOfUsers,
            },
          ])
          
          // Redirect to payment portal
          router.push("/payment")
        } else {
          // Show success message if email confirmation required
          toast({
            title: "Check your email",
            description: "Please check your email to confirm your account.",
          });
        }
      }
    } catch (err) {
      toast({
        title: "An unexpected error occurred",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false)
    }
  }

  const adjustUserCount = (increment: boolean) => {
    const newCount = increment ? formData.numberOfUsers + 1 : formData.numberOfUsers - 1
    if (newCount >= 2 && newCount <= 100) {
      setFormData({ ...formData, numberOfUsers: newCount })
    }
  }

  return (
    <>
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
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/auth/signup")}
                  className="absolute top-4 left-4 p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center justify-center mb-4">
                  <Building2 className="h-10 w-10 text-purple-600 mr-3" />
                  <span className="text-3xl font-bold text-gray-900">Reverly</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Agency Account</h1>
                <p className="text-gray-600">Create your enterprise real estate solution</p>
              </div>

              {/* Sign Up Form */}
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Owner Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>

                {/* Password Fields (moved up) */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500 pr-10"
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
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500 pr-10"
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
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="Phone number"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>

                {/* Agency Info */}
                <div className="space-y-2">
                  <Label htmlFor="agencyName" className="text-sm font-medium text-gray-700">
                    Agency Name
                  </Label>
                  <Input
                    id="agencyName"
                    type="text"
                    placeholder="Your agency name"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                    className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="agencyLocation" className="text-sm font-medium text-gray-700">
                      Agency Suburb (Optional)
                    </Label>
                    {/* Removed placesError conditional rendering */}
                  </div>
                  <div className="relative">
                    {/* Removed MapPin icon */}
                    <Input
                      ref={locationInputRef}
                      id="agencyLocation"
                      type="text"
                      placeholder="Enter suburb"
                      value={formData.agencyLocation}
                      onChange={(e) => setFormData({ ...formData, agencyLocation: e.target.value })}
                      className="h-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Number of Users */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Number of Users (Minimum 2)</Label>
                  <div className="flex items-center space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustUserCount(false)}
                      disabled={formData.numberOfUsers <= 2 || isLoading}
                      className="h-10 w-10 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <Input
                        type="number"
                        min="2"
                        max="100"
                        value={formData.numberOfUsers}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value) || 2
                          if (value >= 2 && value <= 100) {
                            setFormData({ ...formData, numberOfUsers: value })
                          }
                        }}
                        className="h-10 text-center border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => adjustUserCount(true)}
                      disabled={formData.numberOfUsers >= 100 || isLoading}
                      className="h-10 w-10 p-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked as boolean })}
                    disabled={isLoading}
                  />
                  <Label htmlFor="terms" className="text-sm text-gray-600">
                    I agree to the{" "}
                    <Link href="/terms" className="text-purple-600 hover:underline">
                      Terms & Conditions
                    </Link>
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Agency...
                    </>
                  ) : (
                    "Create Agency Account"
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="text-purple-600 hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>

            {/* Right Side - Pricing Summary */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Users className="h-5 w-5 mr-2" />
                    Agency Pricing Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Price per user/week:</span>
                    <span className="font-semibold">${pricePerUser}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Number of users:</span>
                    <span className="font-semibold">{formData.numberOfUsers}</span>
                  </div>
                  <div className="border-t border-white/20 pt-4">
                    <div className="flex justify-between items-center text-lg">
                      <span>Weekly total:</span>
                      <span className="font-bold">${totalWeeklyPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-white/80">
                      <span>Monthly estimate:</span>
                      <span>${totalMonthlyPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
                <CardHeader>
                  <CardTitle className="text-white">Agency Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="font-bold">Multi-user management dashboard</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="font-bold">Team performance analytics</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      <span className="font-bold">Centralized reporting & Agency-wide insights</span>
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      User role & permission management
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Agency-wide client database access
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Admin-controlled data visibility
                    </li>
                    <li className="flex items-center">
                      <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                      Cross-agency contact tracking
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-white/80 text-sm">
                  Need help with setup?{" "}
                  <Link href="/contact" className="text-white hover:underline">
                    Contact our team
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
