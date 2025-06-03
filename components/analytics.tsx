"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { DoorOpen, Phone, Bot, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Popover } from "@headlessui/react"

// Sample data for charts
const monthlyData = [
  { month: "Jan", calls: 65, doorKnocks: 78, deals: 12 },
  { month: "Feb", calls: 59, doorKnocks: 63, deals: 10 },
  { month: "Mar", calls: 80, doorKnocks: 82, deals: 15 },
  { month: "Apr", calls: 81, doorKnocks: 90, deals: 17 },
  { month: "May", calls: 56, doorKnocks: 69, deals: 11 },
  { month: "Jun", calls: 55, doorKnocks: 60, deals: 9 },
  { month: "Jul", calls: 40, doorKnocks: 45, deals: 7 },
]

const readinessData = [
  { score: "90-100", properties: 14, color: "#6d28d9" },
  { score: "80-89", properties: 23, color: "#8b5cf6" },
  { score: "70-79", properties: 34, color: "#a78bfa" },
  { score: "60-69", properties: 45, color: "#c4b5fd" },
  { score: "50-59", properties: 30, color: "#ddd6fe" },
  { score: "0-49", properties: 25, color: "#ede9fe" },
]

// Update PropertyRow interface to match DB
interface PropertyRow {
  id: string
  address: string
  last_contacted: string | null
  method: string | null
  readiness: number | null
  next_contact: string | null
  estimated_value: string | null
}

// Update DEFAULT_COLUMNS to match DB
const DEFAULT_COLUMNS = [
  { key: "address", label: "Address" },
  { key: "last_contacted", label: "Date Last Contacted" },
  { key: "method", label: "Method" },
  { key: "readiness", label: "Readiness to Sell" },
  { key: "next_contact", label: "Suggested Next Contact" },
  { key: "estimated_value", label: "Est. Value" },
]

const methodIcon = (method: string) => {
  if (method === "door") return <DoorOpen className="h-5 w-5 text-purple-600" />
  if (method === "phone") return <Phone className="h-5 w-5 text-purple-600" />
  if (method === "ai") return <Bot className="h-5 w-5 text-purple-600" />
  return null
}

const readinessColor = (score: number) => {
  if (score <= 33) return "bg-gradient-to-r from-red-500 to-red-300 text-white"
  if (score <= 66) return "bg-gradient-to-r from-yellow-400 to-yellow-200 text-gray-900"
  return "bg-gradient-to-r from-green-500 to-green-300 text-white"
}

const getDefaultVisibleColumns = () => {
  if (typeof window !== "undefined" && window.innerWidth < 768) {
    return DEFAULT_COLUMNS.map(c => c.key) // all on mobile
  }
  return DEFAULT_COLUMNS.slice(0, 4).map(c => c.key) // first 4 on desktop
}

export function Analytics() {
  const [activeTab, setActiveTab] = useState("database")
  const [properties, setProperties] = useState<PropertyRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalRows, setTotalRows] = useState(0)
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getDefaultVisibleColumns())
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // Get all rows for client-side pagination
      const { data, error } = await supabase
        .from("landing_page_properties")
        .select("id, address, last_contacted, method, readiness, next_contact, estimated_value")
        .order("last_contacted", { ascending: false })
      if (!error && data) setProperties(data as PropertyRow[])
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    // Update visible columns on resize
    const handleResize = () => {
      setVisibleColumns(getDefaultVisibleColumns())
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const toggleColumn = (key: string) => {
    setVisibleColumns(cols =>
      cols.includes(key) ? cols.filter(c => c !== key) : [...cols, key]
    )
  }

  // Sorting and filtering logic
  const getSortedFilteredProperties = () => {
    let filtered = properties
    if (searchTerm.trim()) {
      filtered = filtered.filter(row =>
        row.address?.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    }
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortColumn as keyof PropertyRow]
        let bVal = b[sortColumn as keyof PropertyRow]
        if (sortColumn === 'address') {
          // Remove leading numbers and spaces for street sorting
          const stripNum = (addr: string | null) => (addr ? addr.replace(/^\d+\s*/, '').toLowerCase() : '')
          const aStreet = stripNum(a.address)
          const bStreet = stripNum(b.address)
          return sortDirection === 'asc' ? aStreet.localeCompare(bStreet) : bStreet.localeCompare(aStreet)
        }
        if (sortColumn === 'readiness') {
          aVal = aVal ?? 0
          bVal = bVal ?? 0
          return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
        }
        if (sortColumn === 'estimated_value') {
          const aNum = aVal && !isNaN(Number(aVal)) ? Number(aVal) : 0
          const bNum = bVal && !isNaN(Number(bVal)) ? Number(bVal) : 0
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
        }
        if (sortColumn === 'last_contacted' || sortColumn === 'next_contact') {
          const aDate = aVal ? new Date(aVal as string).getTime() : 0
          const bDate = bVal ? new Date(bVal as string).getTime() : 0
          return sortDirection === 'asc' ? aDate - bDate : bDate - aDate
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }
        return 0
      })
    }
    return filtered
  }

  const sortedFilteredProperties = getSortedFilteredProperties()

  // Pagination logic (after filtering/sorting)
  const totalFilteredRows = sortedFilteredProperties.length
  const totalPages = Math.max(1, Math.ceil(totalFilteredRows / pageSize))
  const paginatedProperties = sortedFilteredProperties.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(dir => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

  // Add useEffect to reset page when search/filter/sort changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm, sortColumn, sortDirection])

  return (
    <section className="py-20 bg-gradient-to-b from-background to-purple-50" id="analytics">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">Powerful Data Analytics</h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Visualize your performance and gain actionable insights with our advanced analytics tools
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="database" className="w-full" onValueChange={setActiveTab}>
            <div className="mb-8">
              <TabsList className="bg-slate-100">
                <TabsTrigger value="database" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Smart Database
                </TabsTrigger>
                <TabsTrigger value="readiness" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Readiness Index
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                  Performance
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6">
              <TabsContent value="database" className="mt-0">
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-foreground">Smart Database</h3>
                  <p className="text-slate-600">A powerful, filterable table of your contacts and property pipeline.</p>
                  {/* Controls row: search bar left, columns dropdown right */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search address..."
                          value={searchTerm}
                          onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                          className="pl-8 pr-3 py-2 rounded border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          style={{ minWidth: 220 }}
                        />
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <Popover className="relative">
                      <Popover.Button as="button" className="flex items-center px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 ml-4 text-sm font-medium">
                        <Eye className="h-4 w-4 mr-1" /> Columns
                      </Popover.Button>
                      <Popover.Panel className="absolute right-0 mt-2 bg-white rounded shadow-lg p-2 w-44 z-50 border border-slate-200">
                        <div className="font-semibold mb-1 text-xs text-slate-700">Show Columns</div>
                        {DEFAULT_COLUMNS.map(col => (
                          <label key={col.key} className="flex items-center space-x-2 py-1 cursor-pointer text-xs text-slate-700">
                            <input
                              type="checkbox"
                              checked={visibleColumns.includes(col.key)}
                              onChange={() => toggleColumn(col.key)}
                              className="accent-primary h-3 w-3"
                            />
                            <span className="truncate">{col.label}</span>
                          </label>
                        ))}
                      </Popover.Panel>
                    </Popover>
                  </div>
                  {/* Table with horizontal scroll and nowrap headers */}
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full bg-white text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          {DEFAULT_COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                            <th
                              key={col.key}
                              className="px-4 py-3 font-semibold text-left cursor-pointer group whitespace-nowrap select-none"
                              onClick={() =>
                                ["address", "last_contacted", "method", "readiness", "estimated_value"].includes(col.key)
                                  ? handleSort(col.key)
                                  : undefined
                              }
                            >
                              <span className="flex items-center gap-1">
                                {col.label}
                                {["address", "last_contacted", "method", "readiness", "estimated_value"].includes(col.key) && (
                                  sortColumn === col.key ? (
                                    sortDirection === 'asc' ? <ChevronUp className="inline h-4 w-4 text-primary" /> : <ChevronDown className="inline h-4 w-4 text-primary" />
                                  ) : (
                                    <ChevronUp className="inline h-4 w-4 text-slate-300 opacity-50" />
                                  )
                                )}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr><td colSpan={visibleColumns.length} className="text-center py-8">Loading...</td></tr>
                        ) : paginatedProperties.length === 0 ? (
                          <tr><td colSpan={visibleColumns.length} className="text-center py-8">No data found.</td></tr>
                        ) : (
                          paginatedProperties.map((row, i) => (
                            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                              {visibleColumns.includes("address") && (
                                <td className="px-4 py-3 whitespace-nowrap font-medium">{row.address}</td>
                              )}
                              {visibleColumns.includes("last_contacted") && (
                                <td className="px-4 py-3 whitespace-nowrap">{row.last_contacted ? new Date(row.last_contacted).toLocaleDateString() : "-"}</td>
                              )}
                              {visibleColumns.includes("method") && (
                                <td className="px-4 py-3 whitespace-nowrap flex items-center justify-center">{methodIcon(row.method || "")}</td>
                              )}
                              {visibleColumns.includes("readiness") && (
                                <td className="px-4 py-3">
                                  <span className={`inline-block px-3 py-1 rounded-full font-semibold text-xs ${readinessColor(row.readiness || 0)}`}>{row.readiness ?? "-"}</span>
                                </td>
                              )}
                              {visibleColumns.includes("next_contact") && (
                                <td className="px-4 py-3 whitespace-nowrap">{row.next_contact ? new Date(row.next_contact).toLocaleDateString() : "-"}</td>
                              )}
                              {visibleColumns.includes("estimated_value") && (
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {row.estimated_value && !isNaN(Number(row.estimated_value))
                                    ? `$${Number(row.estimated_value).toLocaleString()}`
                                    : row.estimated_value || "-"}
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                    {/* Pagination Footer */}
                    <div className="flex justify-center items-center bg-slate-100 border-t border-slate-200 py-3 mt-0">
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          className={`mx-1 px-3 py-1 rounded font-medium text-sm transition-colors duration-150 ${page === i + 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 hover:bg-primary/10'}`}
                          onClick={() => setPage(i + 1)}
                          disabled={page === i + 1}
                          aria-current={page === i + 1 ? 'page' : undefined}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* RLS Policy Note for Devs */}
                  <div className="text-xs text-slate-400 mt-2">
                    {/* RLS Policy: Public read access is enabled for landing_page_properties only. Other tables remain protected. */}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="readiness" className="mt-0">
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-foreground">Property Readiness Index</h3>
                  <p className="text-slate-600">
                    Distribution of properties by their readiness-to-sell score, helping you prioritize your outreach.
                  </p>

                  <div className="h-[400px] mt-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={readinessData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="score" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="properties" name="Number of Properties" fill="#6d28d9" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="mt-0">
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-foreground">Agent Performance Metrics</h3>
                  <p className="text-slate-600">
                    Compare your performance against team averages and identify areas for improvement.
                  </p>

                  <div className="grid md:grid-cols-3 gap-6 mt-8">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Conversion Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">24.8%</div>
                        <p className="text-sm text-primary">+2.5% from last month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Avg. Response Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">1.2 hrs</div>
                        <p className="text-sm text-primary">-0.3 hrs from last month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500">Client Satisfaction</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-foreground">4.8/5</div>
                        <p className="text-sm text-primary">+0.2 from last month</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  )
}
