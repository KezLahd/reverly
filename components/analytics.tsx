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
import { useState, useEffect, useRef, useCallback } from "react"
import { DoorOpen, Phone, Bot, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Search, Filter, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Popover } from "@headlessui/react"
import dynamic from 'next/dynamic'
import { AnalyticsTable } from "./analytics-table"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

// Dynamically import the AnalyticsTable component with SSR disabled
const DynamicAnalyticsTable = dynamic(() => Promise.resolve(AnalyticsTable), {
  ssr: false
})

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

// Sample landing page properties for demo - Sydney Australia
const sampleProperties: PropertyRow[] = [
  {
    id: "1",
    address: "42 Macquarie Street, Sydney, NSW 2000",
    last_contacted: "2025-01-15",
    method: "door",
    readiness: 85,
    next_contact: "2025-01-22",
    estimated_value: "$2,450,000",
    last_agent: "James Mitchell",
    agent_profile_url: "https://api.example.com/agents/james",
    interaction_count: 3,
    lead_status: "hot",
    sell_prediction_score: "92",
  },
  {
    id: "2",
    address: "156 Oxford Street, Paddington, NSW 2021",
    last_contacted: "2025-01-12",
    method: "phone",
    readiness: 72,
    next_contact: "2025-01-19",
    estimated_value: "$1,850,000",
    last_agent: "Sophie Chen",
    agent_profile_url: "https://api.example.com/agents/sophie",
    interaction_count: 2,
    lead_status: "warm",
    sell_prediction_score: "78",
  },
  {
    id: "3",
    address: "87 Neutral Bay Road, Neutral Bay, NSW 2089",
    last_contacted: "2025-01-10",
    method: "ai",
    readiness: 65,
    next_contact: "2025-01-20",
    estimated_value: "$2,100,000",
    last_agent: "Emma Thompson",
    agent_profile_url: "https://api.example.com/agents/emma",
    interaction_count: 4,
    lead_status: "interested",
    sell_prediction_score: "68",
  },
  {
    id: "4",
    address: "234 Ocean Street, Wooloomooloo, NSW 2011",
    last_contacted: "2025-01-08",
    method: "door",
    readiness: 55,
    next_contact: "2025-01-25",
    estimated_value: "$1,675,000",
    last_agent: "Michael Wong",
    agent_profile_url: "https://api.example.com/agents/michael",
    interaction_count: 1,
    lead_status: "new",
    sell_prediction_score: "45",
  },
  {
    id: "5",
    address: "512 Bay Road, Mosman, NSW 2088",
    last_contacted: "2025-01-05",
    method: "phone",
    readiness: 42,
    next_contact: "2025-01-28",
    estimated_value: "$1,450,000",
    last_agent: "Lisa Anderson",
    agent_profile_url: "https://api.example.com/agents/lisa",
    interaction_count: 1,
    lead_status: "cold",
    sell_prediction_score: "32",
  },
  {
    id: "6",
    address: "78 Military Road, Watsons Bay, NSW 2030",
    last_contacted: "2025-01-14",
    method: "ai",
    readiness: 88,
    next_contact: "2025-01-21",
    estimated_value: "$3,200,000",
    last_agent: "David Roberts",
    agent_profile_url: "https://api.example.com/agents/david",
    interaction_count: 5,
    lead_status: "hot",
    sell_prediction_score: "95",
  },
  {
    id: "7",
    address: "91 Coogee Bay Road, Coogee, NSW 2034",
    last_contacted: "2025-01-11",
    method: "door",
    readiness: 76,
    next_contact: "2025-01-18",
    estimated_value: "$1,925,000",
    last_agent: "Angela Morrison",
    agent_profile_url: "https://api.example.com/agents/angela",
    interaction_count: 3,
    lead_status: "warm",
    sell_prediction_score: "81",
  },
  {
    id: "8",
    address: "203 Arden Street, Clovelly, NSW 2031",
    last_contacted: "2025-01-09",
    method: "phone",
    readiness: 68,
    next_contact: "2025-01-23",
    estimated_value: "$1,750,000",
    last_agent: "Kevin Lee",
    agent_profile_url: "https://api.example.com/agents/kevin",
    interaction_count: 2,
    lead_status: "interested",
    sell_prediction_score: "62",
  },
  {
    id: "9",
    address: "445 New South Head Road, Edgecliff, NSW 2027",
    last_contacted: "2025-01-13",
    method: "ai",
    readiness: 82,
    next_contact: "2025-01-20",
    estimated_value: "$2,350,000",
    last_agent: "Rachel Taylor",
    agent_profile_url: "https://api.example.com/agents/rachel",
    interaction_count: 4,
    lead_status: "hot",
    sell_prediction_score: "88",
  },
  {
    id: "10",
    address: "112 Beach Street, Darling Point, NSW 2027",
    last_contacted: "2025-01-07",
    method: "door",
    readiness: 50,
    next_contact: "2025-01-26",
    estimated_value: "$1,625,000",
    last_agent: "Tom Jackson",
    agent_profile_url: "https://api.example.com/agents/tom",
    interaction_count: 1,
    lead_status: "new",
    sell_prediction_score: "38",
  },
  {
    id: "11",
    address: "567 Victoria Street, Potts Point, NSW 2011",
    last_contacted: "2025-01-16",
    method: "phone",
    readiness: 92,
    next_contact: "2025-01-23",
    estimated_value: "$3,100,000",
    last_agent: "Nicole Barnes",
    agent_profile_url: "https://api.example.com/agents/nicole",
    interaction_count: 6,
    lead_status: "hot",
    sell_prediction_score: "98",
  },
  {
    id: "12",
    address: "89 Crown Street, Surry Hills, NSW 2010",
    last_contacted: "2025-01-06",
    method: "ai",
    readiness: 45,
    next_contact: "2025-01-27",
    estimated_value: "$1,550,000",
    last_agent: "Mark Harrison",
    agent_profile_url: "https://api.example.com/agents/mark",
    interaction_count: 1,
    lead_status: "cold",
    sell_prediction_score: "28",
  },
  {
    id: "13",
    address: "324 King Street, Newtown, NSW 2042",
    last_contacted: "2025-01-04",
    method: "door",
    readiness: 35,
    next_contact: "2025-01-30",
    estimated_value: "$1,200,000",
    last_agent: "Susan Perry",
    agent_profile_url: "https://api.example.com/agents/susan",
    interaction_count: 0,
    lead_status: "inactive",
    sell_prediction_score: "15",
  },
  {
    id: "14",
    address: "678 Parramatta Road, Glebe, NSW 2037",
    last_contacted: "2025-01-17",
    method: "phone",
    readiness: 79,
    next_contact: "2025-01-24",
    estimated_value: "$2,050,000",
    last_agent: "Christopher Day",
    agent_profile_url: "https://api.example.com/agents/christopher",
    interaction_count: 3,
    lead_status: "warm",
    sell_prediction_score: "84",
  },
  {
    id: "15",
    address: "245 Enmore Road, Enmore, NSW 2042",
    last_contacted: "2025-01-02",
    method: "ai",
    readiness: 58,
    next_contact: "2025-01-29",
    estimated_value: "$1,475,000",
    last_agent: "Patricia Wilson",
    agent_profile_url: "https://api.example.com/agents/patricia",
    interaction_count: 2,
    lead_status: "new",
    sell_prediction_score: "52",
  },
  {
    id: "16",
    address: "156 Marrickville Road, Marrickville, NSW 2204",
    last_contacted: "2025-01-18",
    method: "door",
    readiness: 86,
    next_contact: "2025-01-25",
    estimated_value: "$1,875,000",
    last_agent: "Robert Kennedy",
    agent_profile_url: "https://api.example.com/agents/robert",
    interaction_count: 4,
    lead_status: "hot",
    sell_prediction_score: "91",
  },
  {
    id: "17",
    address: "412 Constance Street, Stanmore, NSW 2048",
    last_contacted: "2025-01-03",
    method: "phone",
    readiness: 40,
    next_contact: "2025-02-01",
    estimated_value: "$1,325,000",
    last_agent: "Jennifer Price",
    agent_profile_url: "https://api.example.com/agents/jennifer",
    interaction_count: 1,
    lead_status: "cold",
    sell_prediction_score: "22",
  },
  {
    id: "18",
    address: "734 Anzac Parade, Maroubra, NSW 2035",
    last_contacted: "2025-01-19",
    method: "ai",
    readiness: 74,
    next_contact: "2025-01-26",
    estimated_value: "$1,625,000",
    last_agent: "Daniel Cooper",
    agent_profile_url: "https://api.example.com/agents/daniel",
    interaction_count: 3,
    lead_status: "interested",
    sell_prediction_score: "75",
  },
  {
    id: "19",
    address: "189 The Esplanade, Balmoral Beach, NSW 2088",
    last_contacted: "2025-01-20",
    method: "door",
    readiness: 89,
    next_contact: "2025-01-27",
    estimated_value: "$2,950,000",
    last_agent: "Barbara Stone",
    agent_profile_url: "https://api.example.com/agents/barbara",
    interaction_count: 5,
    lead_status: "hot",
    sell_prediction_score: "96",
  },
  {
    id: "20",
    address: "521 Roscoe Street, Bondi, NSW 2026",
    last_contacted: "2025-01-01",
    method: "phone",
    readiness: 38,
    next_contact: "2025-02-02",
    estimated_value: "$1,550,000",
    last_agent: "Paul Thompson",
    agent_profile_url: "https://api.example.com/agents/paul",
    interaction_count: 1,
    lead_status: "inactive",
    sell_prediction_score: "18",
  },
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
  last_agent: string | null
  agent_profile_url: string | null
  interaction_count: number | null
  lead_status: string | null
  sell_prediction_score: string | null
}

// Update DEFAULT_COLUMNS to match DB
const DEFAULT_COLUMNS = [
  { key: "address", label: "Address" },
  { key: "last_contacted", label: "Date Last Contacted" },
  { key: "method", label: "Method" },
  { key: "readiness", label: "Readiness to Sell" },
  { key: "next_contact", label: "Suggested Next Contact" },
  { key: "estimated_value", label: "Est. Value" },
  { key: "last_agent", label: "Last Agent" },
  { key: "agent_profile_url", label: "Agent Profile" },
  { key: "interaction_count", label: "Interactions" },
  { key: "lead_status", label: "Lead Status" },
  { key: "sell_prediction_score", label: "Sell Prediction" },
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

// Add filter types
type FilterType = {
  [key: string]: {
    value: string | number | null;
    operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | null;
    secondValue?: string | number | null;
  };
};

// Lead status order and icon/color mapping
const LEAD_STATUS_ORDER = [
  'inactive',
  'cold',
  'new',
  'interested',
  'warm',
  'hot',
];
const leadStatusTheme = {
  inactive: {
    icon: <span role="img" aria-label="Frozen" className="mr-1">❄️</span>,
    className: 'bg-slate-200 text-slate-500 border border-slate-300',
  },
  cold: {
    icon: <span role="img" aria-label="Cold" className="mr-1">🧊</span>,
    className: 'bg-blue-100 text-blue-600 border border-blue-200',
  },
  new: {
    icon: <span role="img" aria-label="New" className="mr-1">🌱</span>,
    className: 'bg-green-100 text-green-700 border border-green-200',
  },
  interested: {
    icon: <span role="img" aria-label="Interested" className="mr-1">💡</span>,
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  },
  warm: {
    icon: <span role="img" aria-label="Warm" className="mr-1">🌤️</span>,
    className: 'bg-orange-100 text-orange-700 border border-orange-200',
  },
  hot: {
    icon: <span role="img" aria-label="Hot" className="mr-1">🔥</span>,
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
};

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
  const [columnOrder, setColumnOrder] = useState<string[]>(DEFAULT_COLUMNS.map(col => col.key))
  const [filters, setFilters] = useState<FilterType>({})
  const [activeFilter, setActiveFilter] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      // Use sample data for demo on landing page
      setProperties(sampleProperties)
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

  // Add filter handlers
  const handleFilterChange = (column: string, value: string | number | null, operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | null, secondValue?: string | number | null) => {
    setFilters(prev => ({
      ...prev,
      [column]: { value, operator, secondValue }
    }))
  }

  const clearFilter = (column: string) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[column]
      return newFilters
    })
  }

  const clearAllFilters = () => {
    setFilters({})
  }

  // Update sorting and filtering logic
  const getSortedFilteredProperties = () => {
    let filtered = properties

    // Apply search term filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(row =>
        row.address?.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    }

    // Apply column filters
    Object.entries(filters).forEach(([column, filter]) => {
      if (!filter.value && !filter.secondValue) return

      filtered = filtered.filter(row => {
        const value = row[column as keyof PropertyRow]
        if (value === null) return false

        switch (filter.operator) {
          case 'equals':
            return String(value).toLowerCase() === String(filter.value).toLowerCase()
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
          case 'greater':
            return Number(value) > Number(filter.value)
          case 'less':
            return Number(value) < Number(filter.value)
          case 'between':
            if (!filter.secondValue) return true
            const numValue = Number(value)
            return numValue >= Number(filter.value) && numValue <= Number(filter.secondValue)
          default:
            return true
        }
      })
    })

    // Apply sorting
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
        if (sortColumn === 'interaction_count') {
          const aNum = aVal && !isNaN(Number(aVal)) ? Number(aVal) : 0
          const bNum = bVal && !isNaN(Number(bVal)) ? Number(bVal) : 0
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
        }
        if (sortColumn === 'sell_prediction_score') {
          const aNum = aVal && !isNaN(Number(aVal)) ? Number(aVal) : 0
          const bNum = bVal && !isNaN(Number(bVal)) ? Number(bVal) : 0
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
        }
        if (sortColumn === 'lead_status') {
          const aIdx = aVal && typeof aVal === 'string' ? LEAD_STATUS_ORDER.indexOf(aVal.toLowerCase()) : -1;
          const bIdx = bVal && typeof bVal === 'string' ? LEAD_STATUS_ORDER.indexOf(bVal.toLowerCase()) : -1;
          return sortDirection === 'asc' ? aIdx - bIdx : bIdx - aIdx;
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
                  {/* Replace the table section with the dynamic component */}
                  <DynamicAnalyticsTable
                    columns={DEFAULT_COLUMNS}
                    visibleColumns={visibleColumns}
                    columnOrder={columnOrder}
                    onColumnOrderChange={setColumnOrder}
                    onSort={handleSort}
                    sortColumn={sortColumn}
                    sortDirection={sortDirection}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilter={clearFilter}
                    onClearAllFilters={clearAllFilters}
                    data={paginatedProperties}
                    loading={loading}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
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
