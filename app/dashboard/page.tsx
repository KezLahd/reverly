"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Database,
  BarChart3,
  FileAudio,
  MapPin,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  PhoneCall,
  TrendingUp,
  PlusCircle,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { ContactsTable } from "@/components/crm/contacts-table"
import { InteractionsTable } from "@/components/crm/interactions-table"
import { AudioRecordingsTable } from "@/components/crm/audio-recordings-table"
import { QuestionnairesManager } from "@/components/crm/questionnaires-manager"
import { DashboardCharts } from "@/components/crm/dashboard-charts"
import { AddContactDialog } from "@/components/crm/add-contact-dialog"
import { AddInteractionDialog } from "@/components/crm/add-interaction-dialog"
import { UploadAudioDialog } from "@/components/crm/upload-audio-dialog"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { SubscriptionModal } from "@/components/crm/subscription-modal"
import { ContactsMap } from "@/components/crm/contacts-map"
import Loading from './loading'

// Navigation items with icons
const navItems = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "database", label: "Smart Database", icon: Database },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "audio", label: "Audio Uploads", icon: FileAudio, premium: true },
  { id: "map", label: "Map View", icon: MapPin },
  { id: "settings", label: "Settings", icon: Settings },
]

export default function CRMDashboard() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [minAnimationDone, setMinAnimationDone] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [showUploadAudio, setShowUploadAudio] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalInteractions: 0,
    avgReadinessScore: 0,
    thisMonthInteractions: 0,
  })
  const [agencyLocation, setAgencyLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)
  const router = useRouter()
  const [showSplash, setShowSplash] = useState(false)

  useEffect(() => {
    setMinAnimationDone(false)
    const timer = setTimeout(() => setMinAnimationDone(true), 4500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Only show splash if not already shown in this session
    if (typeof window !== 'undefined') {
      if (!sessionStorage.getItem('dashboardSplashShown')) {
        setShowSplash(true)
      }
    }
  }, [])

  useEffect(() => {
    const getUser = async () => {
      console.log("Dashboard page: Checking user auth state...")
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser()
      console.log("Dashboard page: Auth check result:", { user: user?.id, error: authError })
      
      if (user) {
        setUser(user)
        console.log("Dashboard page: User found, checking profile...")

        // First get the user profile
        const { data: profile, error: profileError } = await supabase
          .from("reverly_user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        
        console.log("Dashboard page: Profile check result:", { profile, error: profileError })

        if (profile) {
          setUserProfile(profile)

          // Then get agency info if user is part of an agency
          if (profile.agency_id) {
            const { data: agency, error: agencyError } = await supabase
              .from("reverly_agencies")
              .select("agency_location")
              .eq("id", profile.agency_id)
              .single()
            
            console.log("Dashboard page: Agency check result:", { agency, error: agencyError })

            if (agency?.agency_location) {
              const [lat, lng] = agency.agency_location.split(',').map(Number)
              if (!isNaN(lat) && !isNaN(lng)) {
                setAgencyLocation({ lat, lng, zoom: 12 })
              }
            }
          } else if (profile.selected_agency_location) {
            const [lat, lng] = profile.selected_agency_location.split(',').map(Number)
            if (!isNaN(lat) && !isNaN(lng)) {
              setAgencyLocation({ lat, lng, zoom: 12 })
            }
          }
        }

        // Load dashboard stats
        await loadStats(user.id)
      } else {
        console.log("Dashboard page: No user found, redirecting to home")
        router.push("/")
      }
      setLoading(false)
    }

    getUser()
  }, [router])

  const loadStats = async (userId: string) => {
    try {
      // Get total contacts
      const { count: contactsCount } = await supabase
        .from("reverly_contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      // Get total interactions
      const { count: interactionsCount } = await supabase
        .from("reverly_interactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      // Get average readiness score
      const { data: avgScore } = await supabase
        .from("reverly_contacts")
        .select("readiness_score")
        .eq("user_id", userId)
        .not("readiness_score", "is", null)

      const avgReadiness =
        avgScore && avgScore.length > 0
          ? Math.round(avgScore.reduce((sum, contact) => sum + (contact.readiness_score || 0), 0) / avgScore.length)
          : 0

      // Get this month's interactions
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: thisMonthCount } = await supabase
        .from("reverly_interactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("interaction_date", startOfMonth.toISOString())

      setStats({
        totalContacts: contactsCount || 0,
        totalInteractions: interactionsCount || 0,
        avgReadinessScore: avgReadiness,
        thisMonthInteractions: thisMonthCount || 0,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const loadContacts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("reverly_contacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error("Error loading contacts:", error)
    }
  }

  useEffect(() => {
    if (user?.id) {
      loadContacts(user.id)
    }
  }, [user?.id])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getSubscriptionStatusBadge = () => {
    if (!userProfile?.subscription_status || userProfile.subscription_status === "free") {
      return <Badge variant="outline" className="bg-white/10 text-white border-white/20">Free Account</Badge>
    }

    switch (userProfile.subscription_status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-200 border-green-500/30">Active</Badge>
      case "trialing":
        return <Badge className="bg-blue-500/20 text-blue-200 border-blue-500/30">Trial</Badge>
      case "past_due":
        return <Badge className="bg-yellow-500/20 text-yellow-200 border-yellow-500/30">Past Due</Badge>
      case "canceled":
        return <Badge className="bg-red-500/20 text-red-200 border-red-500/30">Canceled</Badge>
      default:
        return <Badge variant="outline" className="bg-white/10 text-white border-white/20">Free Account</Badge>
    }
  }

  const hasAIFeatures = () => {
    return userProfile?.subscription_plan === "ai-processing" || userProfile?.subscription_plan === "ai-call-agent"
  }

  const hasCallAgentFeatures = () => {
    return userProfile?.subscription_plan === "ai-call-agent"
  }

  // Only hide loading after inverse animation is done
  const handleLoadingFinish = () => {
    // No need to setShowLoading(false) since we use showSplash now
    // Set splash flag so it doesn't show again this session
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dashboardSplashShown', 'true')
    }
    setShowSplash(false)
  };

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-purple-700 text-white transition-all duration-300 z-30
          ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-purple-600">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8" />
                <span className="font-extrabold text-2xl tracking-tight">Reverly</span>
              </div>
            )}
            {sidebarCollapsed && <Building2 className="h-8 w-8 mx-auto" />}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const isPremium = item.premium && !hasAIFeatures()

              return (
                <button
                  key={item.id}
                  onClick={() => !isPremium && setActiveTab(item.id)}
                  className={`w-full flex items-center px-4 py-3.5 text-base transition-colors
                    ${isActive ? 'bg-purple-800 border-l-4 border-purple-300 font-medium' : 'hover:bg-purple-600'}
                    ${isPremium ? 'opacity-50 cursor-not-allowed' : ''}
                    ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                  disabled={isPremium}
                >
                  <Icon className="h-5 w-5" />
                  {!sidebarCollapsed && (
                    <span className="flex-1 text-left">
                      {item.label}
                      {isPremium && <span className="ml-2 text-xs text-purple-300">(Pro)</span>}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-4 border-t border-purple-600 hover:bg-purple-600 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5 mx-auto" />
            ) : (
              <ChevronLeft className="h-5 w-5 mx-auto" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Header */}
        <header className="fixed top-0 right-0 h-16 bg-purple-600 text-white z-20 shadow-sm"
          style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}>
          <div className="h-full px-6 flex items-center justify-between">
            {/* Left side: Profile Section - Aligned with sidebar */}
            <div className="flex items-center">
              <Link 
                href="/settings/account" 
                className="flex items-center space-x-3 transition-all duration-200 hover:bg-purple-500/20 rounded-lg px-3 py-2 cursor-pointer group"
              >
                <Avatar className="h-9 w-9 border-2 border-white/20 transition-transform duration-200 group-hover:scale-105">
                  {userProfile?.profile_picture_url ? (
                    <AvatarImage 
                      src={userProfile.profile_picture_url} 
                      alt={userProfile?.first_name || user.email} 
                    />
                  ) : (
                    <AvatarFallback className="bg-gray-200 text-purple-700 text-sm font-semibold">
                      {userProfile?.first_name?.[0] || user.email?.[0]?.toUpperCase()}
                      {userProfile?.last_name?.[0] || ''}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-lg font-medium transition-colors duration-200 group-hover:text-purple-100">
                  Welcome, {userProfile?.first_name || user.email}
                </span>
              </Link>
            </div>

            {/* Right side: Plan + Sign Out */}
            <div className="flex items-center space-x-4">
              {/* Subscription Plan Badge */}
              <button
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-white text-purple-700 px-4 py-1.5 rounded text-sm font-medium border border-gray-200 shadow-sm hover:shadow transition-all hover:bg-purple-50"
              >
                {userProfile?.subscription_plan ? 
                  userProfile.subscription_plan.split('-').map((word: string) => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ') : 
                  'Basic'}
              </button>

              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                size="sm" 
                className="text-white hover:bg-purple-500 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-16 min-h-screen">
          <div className="container mx-auto px-6 py-8">
            {/* Content based on active tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalContacts}</div>
                      <p className="text-xs text-muted-foreground">Active prospects</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                      <PhoneCall className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalInteractions}</div>
                      <p className="text-xs text-muted-foreground">{stats.thisMonthInteractions} this month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Readiness Score</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.avgReadinessScore}/100</div>
                      <p className="text-xs text-muted-foreground">Selling readiness</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">--</div>
                      <p className="text-xs text-muted-foreground">Coming soon</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Action Button */}
                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
                    onClick={() => setShowAddInteraction(true)}
                  >
                    <PlusCircle className="h-6 w-6 mr-2" />
                    Log New Interaction
                  </Button>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InteractionsTable userId={user.id} limit={5} />
                  </CardContent>
                </Card>

                {/* Map Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContactsMap 
                      contacts={contacts} 
                      className="h-[400px]"
                      defaultLocation={agencyLocation || undefined}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "database" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Smart Database</h2>
                  <div className="flex space-x-2">
                    <Button onClick={() => setShowAddContact(true)}>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Contact
                    </Button>
                    <Button onClick={() => setShowAddInteraction(true)} variant="outline">
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Log Interaction
                    </Button>
                  </div>
                </div>

                {/* Contacts Table */}
                <div className="bg-white rounded-lg shadow">
                  <ContactsTable 
                    userId={user.id} 
                    searchTerm={searchTerm}
                    onContactsLoaded={setContacts}
                  />
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
                <DashboardCharts userId={user.id} detailed={true} />
              </div>
            )}

            {activeTab === "audio" && (
              <div className="space-y-6">
                {hasAIFeatures() ? (
                  <>
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Audio Recordings</h2>
                      <Button onClick={() => setShowUploadAudio(true)}>
                        <FileAudio className="h-4 w-4 mr-2" />
                        Upload Recording
                      </Button>
                    </div>
                    <AudioRecordingsTable userId={user.id} searchTerm={searchTerm} />
                  </>
                ) : (
                  <Card className="p-8 text-center">
                    <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
                    <p className="text-gray-600 mb-4">
                      Upgrade to AI Processing or AI Call Agent plan to access audio recording analysis.
                    </p>
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "map" && (
              <div className="flex flex-col px-6 pb-6 pt-6">
                <h2 className="text-2xl font-bold mb-4">Contact Map</h2>
                <Card className="h-[80vh] flex flex-col">
                  <CardContent className="h-full flex flex-col p-0">
                    <ContactsMap
                      contacts={contacts}
                      className="h-full w-full"
                      defaultLocation={agencyLocation || undefined}
                      fullControls={true}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Settings</h2>
                <Card>
                  <CardContent className="p-6">
                    <p className="text-gray-500">Settings panel coming soon...</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <AddContactDialog
        open={showAddContact}
        onOpenChange={setShowAddContact}
        userId={user.id}
        onContactAdded={() => loadStats(user.id)}
      />

      <AddInteractionDialog
        open={showAddInteraction}
        onOpenChange={setShowAddInteraction}
        userId={user.id}
        onInteractionAdded={() => loadStats(user.id)}
      />

      {hasAIFeatures() && (
        <UploadAudioDialog
          open={showUploadAudio}
          onOpenChange={setShowUploadAudio}
          userId={user.id}
          onAudioUploaded={() => loadStats(user.id)}
        />
      )}

      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        currentPlan={userProfile?.subscription_plan || 'basic'}
      />

      {(showSplash || loading || !minAnimationDone) && (
        <Loading onFinish={handleLoadingFinish} />
      )}
    </div>
  )
}
