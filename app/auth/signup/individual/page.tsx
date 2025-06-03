"use client"

import type React from "react"
import { Fragment } from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Toast } from "@/components/ui/toast"
import { Building2, Eye, EyeOff, Check, ChevronsUpDown, Loader2, AlertCircle, ArrowLeft } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, Transition } from "@headlessui/react"
import { v4 as uuidv4 } from "uuid"

export default function IndividualSignUpPage() {
  const [formData, setFormData] = useState({
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
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const router = useRouter()

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

    // Fetch agencies
    const fetchAgencies = async () => {
      const { data, error } = await supabase.from("real_estate_agencies").select("*").order("name")
      if (data && !error) {
        setAgencies(data)
      }
    }
    fetchAgencies()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all required fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (!formData.agreedToTerms) {
      setError("Please agree to the Terms & Conditions")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // 1. Create the user in Supabase Auth (this sends the confirmation email)
      const userMetadata = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber || null,
        account_type: "individual",
        agency_id: selectedAgency?.id || null,
        agency_name: selectedAgency?.name || null,
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
            setError("Failed to send login link. Please try again.")
            return
          }

          setShowSuccessModal(true)
          return
        }

        setError(signUpError.message)
        return
      }

      // 2. Insert into signups table only if Auth signup succeeded
      if (signUpResponse?.user) {
        const { user } = signUpResponse
        await supabase.from('signups').insert([
          {
            id: user.id,
            email: formData.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone_number: formData.phoneNumber,
            user_type: 'individual',
            selected_agency: selectedAgency?.name || null,
            agency_id: null,
            agency_name: null,
            agency_location: null,
            is_agency_owner: null,
            agency_member_id: null,
            agency_subscription_id: null,
            subscription_status: 'unpaid',
            has_confirmed_email: false,
            created_at: new Date().toISOString(),
          }
        ])
        // ...rest of your logic (update, user_profiles, redirect, etc.)
        if (!signUpResponse.session) {
          setShowSuccessModal(true)
          return
        }
        router.push("/payment")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Success Modal Popup */}
      <Transition.Root show={showSuccessModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowSuccessModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-70 transition-opacity" />
          </Transition.Child>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="bg-purple-600 text-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-2">Email Sent! 🎉</h2>
                <p className="mb-4 text-center">We've sent you an email with a login link. Please check your inbox and click the link to access your account.</p>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="mt-2 px-6 py-2 bg-white text-purple-700 font-semibold rounded hover:bg-purple-100 transition"
                >
                  Close
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 flex items-center justify-center p-4">
        {/* Animated background elements - adjusted for lighter background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 rounded-full animate-pulse"></div>
          <div
            className="absolute top-40 -left-40 w-60 h-60 bg-purple-300/20 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-40 right-20 w-40 h-40 bg-purple-200/40 rounded-full animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative w-full max-w-md">
          <div className="bg-purple-700 rounded-2xl shadow-2xl p-8 text-white">
            {/* Header */}
            <div className="text-center mb-8">
              <Button
                variant="ghost"
                onClick={() => router.push("/auth/signup")}
                className="absolute top-4 left-4 p-2 text-white hover:bg-purple-600"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center justify-center mb-4">
                <Building2 className="h-10 w-10 text-white mr-3" />
                <span className="text-3xl font-bold">Reverly</span>
              </div>
              <h1 className="text-2xl font-bold mb-2">Individual Agent Account</h1>
              <p className="text-purple-100">Create your personal real estate CRM account</p>
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="h-10 border-purple-400 bg-purple-200 text-purple-900 placeholder:text-purple-500 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="h-10 border-purple-400 bg-purple-200 text-purple-900 placeholder:text-purple-500 focus:border-purple-500 focus:ring-purple-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 border-purple-400 bg-purple-200 text-purple-900 placeholder:text-purple-500 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-10 border-purple-400 bg-purple-200 text-purple-900 placeholder:text-purple-500 focus:border-purple-500 focus:ring-purple-500 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                    Confirm
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-10 border-purple-400 bg-purple-200 text-purple-900 placeholder:text-purple-500 focus:border-purple-500 focus:ring-purple-500 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="h-10 border-purple-400 bg-purple-200 text-purple-900 placeholder:text-purple-500 focus:border-purple-500 focus:ring-purple-500"
                  disabled={isLoading}
                />
              </div>

              {/* Agency */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Agency (Optional)</Label>
                <Popover open={agencySearchOpen} onOpenChange={setAgencySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={`w-full h-10 justify-between border-purple-400 bg-purple-200 text-purple-900 hover:bg-purple-300 hover:text-purple-900 ${!selectedAgency ? 'placeholder:text-purple-500 text-purple-500' : ''}`}
                      disabled={isLoading}
                    >
                      <span className={!selectedAgency ? 'text-purple-500' : 'truncate'}>{selectedAgency ? selectedAgency.name : "Select agency"}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-purple-200 text-purple-900 border-purple-400">
                    <Command className="bg-purple-200 text-purple-900">
                      <CommandInput placeholder="Search agencies..." className="placeholder:text-purple-500" />
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
                              className="hover:bg-purple-300 data-[selected=true]:bg-purple-300"
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedAgency?.id === agency.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              <div>
                                <div className="font-medium text-purple-900">{agency.name}</div>
                                <div className="text-xs text-purple-500">{agency.location}</div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Terms */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked as boolean })}
                  disabled={isLoading}
                  className="border-purple-500 data-[state=checked]:bg-white data-[state=checked]:text-purple-600"
                />
                <Label htmlFor="terms" className="text-sm text-purple-100">
                  I agree to the{" "}
                  <Link href="/terms" className="text-white hover:underline">
                    Terms & Conditions
                  </Link>
                </Label>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="bg-red-500/20 border-red-400 text-white">
                  <AlertCircle className="h-4 w-4 text-red-300" />
                  <AlertDescription className="text-red-100">{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-purple-100 text-purple-800 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Individual Account"
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-purple-100 text-sm">
                Already have an account?{" "}
                <Link href="/auth/signin" className="text-white hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
