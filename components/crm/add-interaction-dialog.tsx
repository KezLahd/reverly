"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

interface AddInteractionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onInteractionAdded: () => void
}

export function AddInteractionDialog({ open, onOpenChange, userId, onInteractionAdded }: AddInteractionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [formData, setFormData] = useState({
    contactId: "",
    interactionType: "",
    interactionDate: new Date().toISOString().split("T")[0],
    interactionTime: new Date().toTimeString().split(" ")[0].slice(0, 5),
    durationMinutes: "",
    outcome: "",
    notes: "",
    readinessScore: "",
    followUpRequired: false,
    followUpDate: "",
  })

  useEffect(() => {
    if (open) {
      loadContacts()
    }
  }, [open, userId])

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("reverly_contacts")
        .select("id, first_name, last_name")
        .eq("user_id", userId)
        .order("first_name")

      if (error) {
        console.error("Error loading contacts:", error)
      } else {
        setContacts(data || [])
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const interactionDateTime = new Date(`${formData.interactionDate}T${formData.interactionTime}`)

      const { error } = await supabase.from("reverly_interactions").insert({
        user_id: userId,
        contact_id: formData.contactId,
        interaction_type: formData.interactionType,
        interaction_date: interactionDateTime.toISOString(),
        duration_minutes: formData.durationMinutes ? Number.parseInt(formData.durationMinutes) : null,
        outcome: formData.outcome || null,
        notes: formData.notes || null,
        readiness_score: formData.readinessScore ? Number.parseInt(formData.readinessScore) : null,
        follow_up_required: formData.followUpRequired,
        follow_up_date: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
      })

      if (error) {
        console.error("Error adding interaction:", error)
        alert("Error adding interaction. Please try again.")
      } else {
        // Update contact's last contact date and readiness score
        if (formData.readinessScore) {
          await supabase
            .from("reverly_contacts")
            .update({
              last_contact_date: interactionDateTime.toISOString(),
              readiness_score: Number.parseInt(formData.readinessScore),
            })
            .eq("id", formData.contactId)
        } else {
          await supabase
            .from("reverly_contacts")
            .update({
              last_contact_date: interactionDateTime.toISOString(),
            })
            .eq("id", formData.contactId)
        }

        // Reset form
        setFormData({
          contactId: "",
          interactionType: "",
          interactionDate: new Date().toISOString().split("T")[0],
          interactionTime: new Date().toTimeString().split(" ")[0].slice(0, 5),
          durationMinutes: "",
          outcome: "",
          notes: "",
          readinessScore: "",
          followUpRequired: false,
          followUpDate: "",
        })
        onInteractionAdded()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error adding interaction:", error)
      alert("Error adding interaction. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log New Interaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Selection */}
          <div>
            <Label htmlFor="contactId">Contact *</Label>
            <Select value={formData.contactId} onValueChange={(value) => handleInputChange("contactId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.first_name} {contact.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interaction Type */}
          <div>
            <Label htmlFor="interactionType">Interaction Type *</Label>
            <Select
              value={formData.interactionType}
              onValueChange={(value) => handleInputChange("interactionType", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select interaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone_call">Phone Call</SelectItem>
                <SelectItem value="door_knock">Door Knock</SelectItem>
                <SelectItem value="ai_call">AI Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="text_message">Text Message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interactionDate">Date *</Label>
              <Input
                id="interactionDate"
                type="date"
                value={formData.interactionDate}
                onChange={(e) => handleInputChange("interactionDate", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="interactionTime">Time *</Label>
              <Input
                id="interactionTime"
                type="time"
                value={formData.interactionTime}
                onChange={(e) => handleInputChange("interactionTime", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Duration and Outcome */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input
                id="durationMinutes"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => handleInputChange("durationMinutes", e.target.value)}
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <Label htmlFor="outcome">Outcome</Label>
              <Select value={formData.outcome} onValueChange={(value) => handleInputChange("outcome", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="callback_requested">Callback Requested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Readiness Score */}
          <div>
            <Label htmlFor="readinessScore">Readiness Score (0-100)</Label>
            <Input
              id="readinessScore"
              type="number"
              min="0"
              max="100"
              value={formData.readinessScore}
              onChange={(e) => handleInputChange("readinessScore", e.target.value)}
              placeholder="Rate their readiness to sell"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Details about the interaction..."
              rows={4}
            />
          </div>

          {/* Follow-up */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="followUpRequired"
                checked={formData.followUpRequired}
                onCheckedChange={(checked) => handleInputChange("followUpRequired", checked as boolean)}
              />
              <Label htmlFor="followUpRequired">Follow-up required</Label>
            </div>

            {formData.followUpRequired && (
              <div>
                <Label htmlFor="followUpDate">Follow-up Date</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => handleInputChange("followUpDate", e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.contactId || !formData.interactionType}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Log Interaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
