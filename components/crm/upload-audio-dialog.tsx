"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Upload, FileAudio } from "lucide-react"

interface UploadAudioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onAudioUploaded: () => void
}

export function UploadAudioDialog({ open, onOpenChange, userId, onAudioUploaded }: UploadAudioDialogProps) {
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<any[]>([])
  const [interactions, setInteractions] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    contactId: "",
    interactionId: "",
  })

  useEffect(() => {
    if (open) {
      loadContacts()
    }
  }, [open, userId])

  useEffect(() => {
    if (formData.contactId) {
      loadInteractions(formData.contactId)
    } else {
      setInteractions([])
    }
  }, [formData.contactId])

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("contacts")
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

  const loadInteractions = async (contactId: string) => {
    try {
      const { data, error } = await supabase
        .from("interactions")
        .select("id, interaction_type, interaction_date")
        .eq("user_id", userId)
        .eq("contact_id", contactId)
        .order("interaction_date", { ascending: false })

      if (error) {
        console.error("Error loading interactions:", error)
      } else {
        setInteractions(data || [])
      }
    } catch (error) {
      console.error("Error loading interactions:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      const allowedTypes = ["audio/mp3", "audio/wav", "audio/m4a", "audio/mpeg"]
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid audio file (MP3, WAV, M4A)")
        return
      }

      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB")
        return
      }

      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !formData.contactId) return

    setLoading(true)

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `audio-recordings/${userId}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("audio-recordings")
        .upload(filePath, selectedFile)

      if (uploadError) {
        console.error("Error uploading file:", uploadError)
        alert("Error uploading file. Please try again.")
        return
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("audio-recordings").getPublicUrl(filePath)

      // Get audio duration (approximate)
      const audio = new Audio(URL.createObjectURL(selectedFile))
      await new Promise((resolve) => {
        audio.addEventListener("loadedmetadata", resolve)
      })
      const durationSeconds = Math.round(audio.duration)

      // Save record to database
      const { error: dbError } = await supabase.from("audio_recordings").insert({
        user_id: userId,
        contact_id: formData.contactId,
        interaction_id: formData.interactionId || null,
        file_name: selectedFile.name,
        file_url: publicUrl,
        file_size: selectedFile.size,
        duration_seconds: durationSeconds,
      })

      if (dbError) {
        console.error("Error saving record:", dbError)
        alert("Error saving record. Please try again.")
        return
      }

      // Reset form
      setSelectedFile(null)
      setFormData({
        contactId: "",
        interactionId: "",
      })
      onAudioUploaded()
      onOpenChange(false)

      alert("Audio file uploaded successfully! AI processing will begin shortly.")
    } catch (error) {
      console.error("Error uploading audio:", error)
      alert("Error uploading audio. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Audio Recording</DialogTitle>
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

          {/* Interaction Selection (Optional) */}
          {interactions.length > 0 && (
            <div>
              <Label htmlFor="interactionId">Related Interaction (Optional)</Label>
              <Select
                value={formData.interactionId}
                onValueChange={(value) => handleInputChange("interactionId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an interaction" />
                </SelectTrigger>
                <SelectContent>
                  {interactions.map((interaction) => (
                    <SelectItem key={interaction.id} value={interaction.id}>
                      {interaction.interaction_type.replace("_", " ")} -{" "}
                      {new Date(interaction.interaction_date).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* File Upload */}
          <div>
            <Label htmlFor="audioFile">Audio File *</Label>
            <div className="mt-2">
              <input id="audioFile" type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
              <label
                htmlFor="audioFile"
                className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors"
              >
                <div className="text-center">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileAudio className="h-8 w-8 mx-auto text-green-600" />
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload audio file</p>
                      <p className="text-xs text-gray-500">MP3, WAV, M4A (max 50MB)</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">AI Processing:</p>
            <p>Your audio will be automatically transcribed and analyzed for readiness scoring once uploaded.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedFile || !formData.contactId}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Upload & Process
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
