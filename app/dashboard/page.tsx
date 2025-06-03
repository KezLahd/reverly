"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building2,
  TrendingUp,
  LogOut,
  Crown,
  Zap,
  Users,
  PhoneCall,
  FileAudio,
  BarChart3,
  PlusCircle,
  Search,
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

export default function CRMDashboard() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [showUploadAudio, setShowUploadAudio] = useState(false)
  const [stats, setStats] = useState({
    totalContacts: 0,
    totalInteractions: 0,
    avgReadinessScore: 0,
    thisMonthInteractions: 0,
  })
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUser(user)

        // Get user profile with subscription info
        const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

        setUserProfile(profile)

        // Load dashboard stats
        await loadStats(user.id)
      } else {
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
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      // Get total interactions
      const { count: interactionsCount } = await supabase
        .from("interactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

      // Get average readiness score
      const { data: avgScore } = await supabase
        .from("contacts")
        .select("readiness_score")
        .eq("user_id", userId)
        .not("readiness_score", "is", null)

      const avgReadiness =
        avgScore?.length > 0
          ? Math.round(avgScore.reduce((sum, contact) => sum + (contact.readiness_score || 0), 0) / avgScore.length)
          : 0

      // Get this month's interactions
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count: thisMonthCount } = await supabase
        .from("interactions")
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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const getSubscriptionStatusBadge = () => {
    if (!userProfile?.subscription_status || userProfile.subscription_status === "free") {
      return <Badge variant="outline">Free Account</Badge>
    }

    switch (userProfile.subscription_status) {
      case "active":
        return <Badge className="bg-green-500 text-white">Active</Badge>
      case "trialing":
        return <Badge className="bg-blue-500 text-white">Trial</Badge>
      case "past_due":
        return <Badge className="bg-yellow-500 text-white">Past Due</Badge>
      case "canceled":
        return <Badge variant="destructive">Canceled</Badge>
      default:
        return <Badge variant="outline">Free Account</Badge>
    }
  }

  const hasAIFeatures = () => {
    return userProfile?.subscription_plan === "ai-processing" || userProfile?.subscription_plan === "ai-call-agent"
  }

  const hasCallAgentFeatures = () => {
    return userProfile?.subscription_plan === "ai-call-agent"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your CRM dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isFreeAccount = !userProfile?.subscription_status || userProfile.subscription_status === "free"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold text-gray-900">Reverly CRM</span>
            {getSubscriptionStatusBadge()}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {userProfile?.first_name || user.email}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
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

        {/* Main CRM Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-fit grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="interactions">Interactions</TabsTrigger>
              <TabsTrigger value="recordings" disabled={!hasAIFeatures()}>
                Audio {!hasAIFeatures() && "(Pro)"}
              </TabsTrigger>
              <TabsTrigger value="questionnaires">Questionnaires</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button onClick={() => setShowAddContact(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <DashboardCharts userId={user.id} />
          </TabsContent>

          <TabsContent value="contacts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Contacts</h2>
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
            <ContactsTable userId={user.id} searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="interactions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Interactions</h2>
              <Button onClick={() => setShowAddInteraction(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Log Interaction
              </Button>
            </div>
            <InteractionsTable userId={user.id} searchTerm={searchTerm} />
          </TabsContent>

          <TabsContent value="recordings" className="space-y-6">
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
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">AI Features Required</h3>
                <p className="text-gray-600 mb-4">
                  Upgrade to AI Processing or AI Call Agent plan to access audio recording analysis.
                </p>
                <Button>
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="questionnaires" className="space-y-6">
            <QuestionnairesManager userId={user.id} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Analytics & Reports</h2>
            <DashboardCharts userId={user.id} detailed={true} />
          </TabsContent>
        </Tabs>
      </main>

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
    </div>
  )
}
