"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Mail, MapPin, Calendar, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  suburb: string
  state: string
  postcode: string
  property_type: string
  estimated_value: number
  readiness_score: number
  last_contact_date: string
  status: string
  created_at: string
}

interface ContactsTableProps {
  userId: string
  searchTerm: string
  onContactsLoaded?: (contacts: Contact[]) => void
}

export function ContactsTable({ userId, searchTerm, onContactsLoaded }: ContactsTableProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContacts()
  }, [userId, searchTerm])

  const loadContacts = async () => {
    try {
      let query = supabase.from("reverly_contacts").select("*").eq("user_id", userId).order("created_at", { ascending: false })

      if (searchTerm) {
        query = query.or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`,
        )
      }

      const { data, error } = await query

      if (error) {
        console.error("Error loading contacts:", error)
      } else {
        const contactsData = data || []
        setContacts(contactsData)
        onContactsLoaded?.(contactsData)
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
    } finally {
      setLoading(false)
    }
  }

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    if (score >= 40) return "bg-orange-500"
    return "bg-red-500"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot":
        return "bg-red-500"
      case "warm":
        return "bg-yellow-500"
      case "cold":
        return "bg-blue-500"
      case "prospect":
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
          <p className="mt-4 text-gray-600">Loading contacts...</p>
        </CardContent>
      </Card>
    )
  }

  if (contacts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No contacts found</h3>
          <p className="text-gray-600">
            {searchTerm ? "No contacts match your search." : "Start by adding your first contact."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts ({contacts.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Readiness Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-sm text-gray-500">ID: {contact.id.slice(0, 8)}...</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {contact.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1" />
                        {contact.email}
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {contact.phone}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {contact.address && (
                      <div className="flex items-center text-sm mb-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {contact.suburb}, {contact.state} {contact.postcode}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {contact.property_type}
                      {contact.estimated_value && <span> • ${contact.estimated_value.toLocaleString()}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getReadinessColor(contact.readiness_score || 0)}`}></div>
                    <span className="font-medium">{contact.readiness_score || 0}/100</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(contact.status)} text-white`}>{contact.status}</Badge>
                </TableCell>
                <TableCell>
                  {contact.last_contact_date ? (
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(contact.last_contact_date).toLocaleDateString()}
                    </div>
                  ) : (
                    <span className="text-gray-400">Never</span>
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
                      <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                      <DropdownMenuItem>Log Interaction</DropdownMenuItem>
                      <DropdownMenuItem>Send Questionnaire</DropdownMenuItem>
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
