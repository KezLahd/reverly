"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface DashboardChartsProps {
  userId: string
  detailed?: boolean
}

export function DashboardCharts({ userId, detailed = false }: DashboardChartsProps) {
  const [chartData, setChartData] = useState({
    monthlyInteractions: [],
    readinessDistribution: [],
    interactionTypes: [],
    conversionFunnel: [],
    weeklyActivity: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChartData()
  }, [userId])

  const loadChartData = async () => {
    try {
      // Monthly interactions over the last 6 months
      const monthlyData = await getMonthlyInteractions()

      // Readiness score distribution
      const readinessData = await getReadinessDistribution()

      // Interaction types breakdown
      const interactionData = await getInteractionTypes()

      // Weekly activity for the last 8 weeks
      const weeklyData = await getWeeklyActivity()

      setChartData({
        monthlyInteractions: monthlyData,
        readinessDistribution: readinessData,
        interactionTypes: interactionData,
        conversionFunnel: [
          { stage: "Prospects", count: 150, percentage: 100 },
          { stage: "Contacted", count: 120, percentage: 80 },
          { stage: "Interested", count: 60, percentage: 40 },
          { stage: "Qualified", count: 30, percentage: 20 },
          { stage: "Closed", count: 12, percentage: 8 },
        ],
        weeklyActivity: weeklyData,
      })
    } catch (error) {
      console.error("Error loading chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getMonthlyInteractions = async () => {
    const { data } = await supabase
      .from("interactions")
      .select("interaction_date, interaction_type")
      .eq("user_id", userId)
      .gte("interaction_date", new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())

    // Group by month
    const monthlyStats: any = {}
    data?.forEach((interaction) => {
      const month = new Date(interaction.interaction_date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
      if (!monthlyStats[month]) {
        monthlyStats[month] = { month, calls: 0, doorKnocks: 0, total: 0 }
      }
      monthlyStats[month].total++
      if (interaction.interaction_type === "phone_call" || interaction.interaction_type === "ai_call") {
        monthlyStats[month].calls++
      } else if (interaction.interaction_type === "door_knock") {
        monthlyStats[month].doorKnocks++
      }
    })

    return Object.values(monthlyStats)
  }

  const getReadinessDistribution = async () => {
    const { data } = await supabase
      .from("contacts")
      .select("readiness_score")
      .eq("user_id", userId)
      .not("readiness_score", "is", null)

    const distribution = [
      { range: "0-20", count: 0, color: "#ef4444" },
      { range: "21-40", count: 0, color: "#f97316" },
      { range: "41-60", count: 0, color: "#eab308" },
      { range: "61-80", count: 0, color: "#22c55e" },
      { range: "81-100", count: 0, color: "#16a34a" },
    ]

    data?.forEach((contact) => {
      const score = contact.readiness_score
      if (score <= 20) distribution[0].count++
      else if (score <= 40) distribution[1].count++
      else if (score <= 60) distribution[2].count++
      else if (score <= 80) distribution[3].count++
      else distribution[4].count++
    })

    return distribution
  }

  const getInteractionTypes = async () => {
    const { data } = await supabase.from("interactions").select("interaction_type").eq("user_id", userId)

    const types: any = {}
    data?.forEach((interaction) => {
      const type = interaction.interaction_type
      types[type] = (types[type] || 0) + 1
    })

    return Object.entries(types).map(([type, count]) => ({
      type: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      count,
      color:
        type === "phone_call"
          ? "#3b82f6"
          : type === "door_knock"
            ? "#10b981"
            : type === "ai_call"
              ? "#8b5cf6"
              : "#f59e0b",
    }))
  }

  const getWeeklyActivity = async () => {
    const { data } = await supabase
      .from("interactions")
      .select("interaction_date")
      .eq("user_id", userId)
      .gte("interaction_date", new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000).toISOString())

    const weeklyStats: any = {}
    data?.forEach((interaction) => {
      const week = getWeekStart(new Date(interaction.interaction_date))
      const weekKey = week.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      weeklyStats[weekKey] = (weeklyStats[weekKey] || 0) + 1
    })

    return Object.entries(weeklyStats).map(([week, count]) => ({ week, count }))
  }

  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading chart data...</p>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Interactions Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                total: { label: "Total Interactions", color: "#3b82f6" },
                calls: { label: "Phone Calls", color: "#10b981" },
                doorKnocks: { label: "Door Knocks", color: "#f59e0b" },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.monthlyInteractions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="doorKnocks" stroke="#f59e0b" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Readiness Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Readiness Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.readinessDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {detailed && (
        <>
          {/* Detailed Analytics */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Interaction Types Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Interaction Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.interactionTypes}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={({ type, count }) => `${type}: ${count}`}
                      >
                        {chartData.interactionTypes.map((entry: any, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.conversionFunnel} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="stage" type="category" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
