"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, DoorOpen, Mail, Calendar, Clock, TrendingUp, MoreHorizontal, Bot } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Interaction {
  id: string
  contact_id: string
  interaction_type: string
  interaction_date: string
  duration_minutes: number
  outcome: string
  notes: string
  readiness_score: number
  follow_up_required: boolean
  follow_up_date: string
  contacts: {
    first_name: string
    last_name: string
  }
}

interface InteractionsTableProps {
  userId: string
  searchTerm: string
}

export function InteractionsTable({ userId, searchTerm }: InteractionsTableProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInteractions()
  }, [userId, searchTerm])

  const loadInteractions = async () => {
    try {
      const query = supabase
        .from("interactions")
        .select(`
          *,
          contacts (
            first_name,
            last_name
          )
        `)
        .eq("user_id", userId)
        .order("interaction_date", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error loading interactions:", error)
      } else {
        setInteractions(data || [])
      }
    } catch (error) {
      console.error("Error loading interactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "phone_call":
        return <Phone className="h-4 w-4" />
      case "door_knock":
        return <DoorOpen className="h-4 w-4" />
      case "ai_call":
        return <Bot className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  const getInteractionColor = (type: string) => {
    switch (type) {
      case "phone_call":
        return "bg-blue-500"
      case "door_knock":
        return "bg-green-500"
      case "ai_call":
        return "bg-purple-500"
      case "email":
        return "bg-orange-500"
      default:
        return "bg-gray-500"
    }
  }

  const getOutcomeColor = (outcome: string) => {
    switch (outcome?.toLowerCase()) {
      case "positive":
        return "bg-green-500"
      case "interested":
        return "bg-blue-500"
      case "neutral":
        return "bg-yellow-500"
      case "negative":
        return "bg-red-500"
      case "no_answer":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interactions...</p>
        </CardContent>
      </Card>
    )
  }

  if (interactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No interactions found</h3>
          <p className="text-gray-600">Start logging your first interaction with a contact.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Interactions ({interactions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date & Duration</TableHead>
              <TableHead>Outcome</TableHead>
              <TableHead>Readiness Score</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interactions.map((interaction) => (
              <TableRow key={interaction.id}>
                <TableCell>
                  <div className="font-medium">
                    {interaction.contacts?.first_name} {interaction.contacts?.last_name}
                  </div>
                  <div className="text-sm text-gray-500">ID: {interaction.contact_id.slice(0, 8)}...</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getInteractionColor(interaction.interaction_type)} text-white`}>
                      {getInteractionIcon(interaction.interaction_type)}
                      <span className="ml-1 capitalize">{interaction.interaction_type.replace("_", " ")}</span>
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(interaction.interaction_date).toLocaleDateString()}
                    </div>
                    {interaction.duration_minutes && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {interaction.duration_minutes} min
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {interaction.outcome && (
                    <Badge className={`${getOutcomeColor(interaction.outcome)} text-white`}>
                      {interaction.outcome}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {interaction.readiness_score ? (
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">{interaction.readiness_score}/100</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {interaction.follow_up_required ? (
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        Required
                      </Badge>
                      {interaction.follow_up_date && (
                        <div className="text-xs text-gray-500">
                          {new Date(interaction.follow_up_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Interaction</DropdownMenuItem>
                      <DropdownMenuItem>Add Follow-up</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
