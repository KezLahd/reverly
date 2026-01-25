"use client"

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { ChevronUp, ChevronDown, X, DoorOpen, Phone, Bot, Flame, Sun, Snowflake, Lightbulb, Sprout, Box } from "lucide-react"
import { Popover } from "@headlessui/react"

interface AnalyticsTableProps {
  columns: { key: string; label: string }[]
  visibleColumns: string[]
  columnOrder: string[]
  onColumnOrderChange: (newOrder: string[]) => void
  onSort: (col: string) => void
  sortColumn: string | null
  sortDirection: 'asc' | 'desc'
  filters: any
  onFilterChange: (column: string, value: any, operator: any, secondValue?: any) => void
  onClearFilter: (column: string) => void
  onClearAllFilters: () => void
  data: any[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const methodIcon = (method: string) => {
  if (method === "door") return <DoorOpen className="h-5 w-5 text-purple-600" />
  if (method === "phone") return <Phone className="h-5 w-5 text-purple-600" />
  if (method === "ai") return <Bot className="h-5 w-5 text-purple-600" />
  return null
}

const readinessColor = (score: number) => {
  if (score >= 95) return "bg-green-500 text-white"
  if (score >= 85) return "bg-green-400 text-white"
  if (score >= 75) return "bg-green-300 text-green-900"
  if (score >= 67) return "bg-green-200 text-green-900"
  if (score >= 60) return "bg-yellow-300 text-yellow-900"
  if (score >= 50) return "bg-yellow-200 text-yellow-900"
  if (score >= 40) return "bg-orange-300 text-orange-900"
  if (score >= 34) return "bg-orange-200 text-orange-900"
  if (score >= 20) return "bg-red-300 text-red-900"
  if (score >= 10) return "bg-red-400 text-white"
  return "bg-red-500 text-white"
}

const leadStatusTheme = {
  inactive: { icon: <Snowflake className="h-4 w-4 text-slate-400" />, className: "bg-slate-100 text-slate-700 border-slate-200" },
  cold: { icon: <Box className="h-4 w-4 text-blue-400" />, className: "bg-blue-50 text-blue-700 border-blue-200" },
  new: { icon: <Sprout className="h-4 w-4 text-green-500" />, className: "bg-purple-50 text-purple-700 border-purple-200" },
  interested: { icon: <Lightbulb className="h-4 w-4 text-yellow-400" />, className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  warm: { icon: <Sun className="h-4 w-4 text-orange-400" />, className: "bg-orange-50 text-orange-700 border-orange-200" },
  hot: { icon: <Flame className="h-4 w-4 text-red-500" />, className: "bg-red-50 text-red-700 border-red-200" }
} as const

export function AnalyticsTable({
  columns,
  visibleColumns,
  columnOrder,
  onColumnOrderChange,
  onSort,
  sortColumn,
  sortDirection,
  filters,
  onFilterChange,
  onClearFilter,
  onClearAllFilters,
  data,
  loading,
  page,
  totalPages,
  onPageChange
}: AnalyticsTableProps) {
  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(columnOrder)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onColumnOrderChange(items)
  }

  // Get visible columns in current order
  const orderedVisibleColumns = columnOrder.filter(col => visibleColumns.includes(col))

  const renderCell = (colKey: string, value: any) => {
    switch (colKey) {
      case "address":
        return <span className="font-medium">{value}</span>
      case "last_contacted":
        return value ? new Date(value).toLocaleDateString() : "-"
      case "method":
        return <div className="flex items-center justify-center">{methodIcon(value || "")}</div>
      case "readiness":
        return <span className={`inline-block px-3 py-1 rounded-full font-semibold text-xs ${readinessColor(value || 0)}`}>{value ?? "-"}</span>
      case "next_contact":
        return value ? new Date(value).toLocaleDateString() : "-"
      case "estimated_value":
        return value && !isNaN(Number(value)) ? `$${Number(value).toLocaleString()}` : value || "-"
      case "last_agent":
        return value || "-"
      case "agent_profile_url":
        return value ? (
          <img
            src={value}
            alt="Agent Profile"
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
          />
        ) : (
          <span className="inline-block w-8 h-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">-</span>
        )
      case "interaction_count":
        return value ?? "-"
      case "lead_status":
        if (!value) return <span className="inline-block px-3 py-1 rounded-full font-semibold text-xs bg-slate-100 text-slate-500 border border-slate-200">-</span>
        const status = value.toLowerCase() as keyof typeof leadStatusTheme
        const theme = leadStatusTheme[status] || leadStatusTheme.inactive
        return (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border ${theme.className}`}>
            {theme.icon}
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        )
      case "sell_prediction_score":
        return value ?? "-"
      default:
        return value ?? "-"
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <DragDropContext onDragEnd={onDragEnd}>
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-slate-50">
            <Droppable droppableId="columns" direction="horizontal">
              {(provided) => (
                <tr ref={provided.innerRef} {...provided.droppableProps}>
                  {orderedVisibleColumns.map((colKey, index) => {
                    const column = columns.find(c => c.key === colKey)
                    if (!column) return null

                    const filter = filters[colKey]
                    const hasFilter = filter && (filter.value || filter.secondValue)

                    return (
                      <Draggable key={colKey} draggableId={colKey} index={index}>
                        {(provided) => (
                          <th
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="px-4 py-3 font-semibold text-left group whitespace-nowrap select-none relative"
                          >
                            <div className="flex items-center gap-1">
                              <span>{column.label}</span>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); onSort(colKey); }}
                                className="bg-transparent border-none p-0 m-0 cursor-pointer focus:outline-none"
                                tabIndex={0}
                                style={{ display: 'flex', alignItems: 'center' }}
                              >
                                {sortColumn === colKey ? (
                                  sortDirection === 'asc' ? (
                                    <ChevronUp className="inline h-4 w-4 text-primary ml-1" />
                                  ) : (
                                    <ChevronDown className="inline h-4 w-4 text-primary ml-1" />
                                  )
                                ) : (
                                  <ChevronUp className="inline h-4 w-4 text-slate-300 opacity-50 ml-1" />
                                )}
                              </button>
                            </div>
                          </th>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </tr>
              )}
            </Droppable>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={visibleColumns.length} className="text-center py-8">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={visibleColumns.length} className="text-center py-8">No data found.</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50">
                  {orderedVisibleColumns.map(colKey => (
                    <td key={colKey} className="px-4 py-3 whitespace-nowrap">
                      {renderCell(colKey, row[colKey])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DragDropContext>
      {/* Add filter summary */}
      {Object.keys(filters).length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-slate-50 border-t border-slate-200">
          <span className="text-sm text-slate-600">Active filters:</span>
          {Object.entries(filters).map(([col, filter]: [string, any]) => (
            <span
              key={col}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded-full text-xs border border-slate-200"
            >
              {columns.find(c => c.key === col)?.label}: {filter.operator} {filter.value}
              {filter.operator === 'between' && filter.secondValue && ` - ${filter.secondValue}`}
              <button
                onClick={() => onClearFilter(col)}
                className="ml-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onClearAllFilters}
            className="ml-auto text-xs text-primary hover:text-primary-dark"
          >
            Clear all
          </button>
        </div>
      )}
      {/* Pagination Footer */}
      <div className="flex justify-center items-center bg-slate-100 border-t border-slate-200 py-3 mt-0">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`mx-1 px-3 py-1 rounded font-medium text-sm transition-colors duration-150 ${page === i + 1 ? 'bg-primary text-white' : 'bg-slate-200 text-slate-700 hover:bg-primary/10'}`}
            onClick={() => onPageChange(i + 1)}
            disabled={page === i + 1}
            aria-current={page === i + 1 ? 'page' : undefined}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
} 