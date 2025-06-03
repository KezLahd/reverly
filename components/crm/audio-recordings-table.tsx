"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileAudio, Play, Download, Calendar, Clock, TrendingUp, MoreHorizontal, Bot } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface AudioRecording {
  id: string
  contact_id: string
  file_name: string
  file_url: string
  duration_seconds: number
  transcription: string
  ai_analysis: any
  readiness_score: number
  processed_at: string
  created_at: string
  contacts: {
    first_name: string
    last_name: string
  }
}

interface AudioRecordingsTableProps {
  userId: string
  searchTerm: string
}

export function AudioRecordingsTable({ userId, searchTerm }: AudioRecordingsTableProps) {
  const [recordings, setRecordings] = useState<AudioRecording[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecordings()
  }, [userId, searchTerm])

  const loadRecordings = async () => {
    try {
      const query = supabase
        .from("audio_recordings")
        .select(`
          *,
          contacts (
            first_name,
            last_name
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error loading recordings:", error)
      } else {
        setRecordings(data || [])
      }
    } catch (error) {
      console.error("Error loading recordings:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getProcessingStatus = (recording: AudioRecording) => {
    if (recording.processed_at && recording.transcription) {
      return { status: "completed", color: "bg-green-500" }
    } else if (recording.transcription) {
      return { status: "transcribed", color: "bg-blue-500" }
    } else {
      return { status: "processing", color: "bg-yellow-500" }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading recordings...</p>
        </CardContent>
      </Card>
    )
  }

  if (recordings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No recordings found</h3>
          <p className="text-gray-600">Upload your first audio recording to get AI-powered insights.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Recordings ({recordings.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contact</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Processing Status</TableHead>
              <TableHead>AI Score</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordings.map((recording) => {
              const status = getProcessingStatus(recording)
              return (
                <TableRow key={recording.id}>
                  <TableCell>
                    <div className="font-medium">
                      {recording.contacts?.first_name} {recording.contacts?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">ID: {recording.contact_id.slice(0, 8)}...</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <FileAudio className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">{recording.file_name}</div>
                        <div className="text-xs text-gray-500">{recording.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDuration(recording.duration_seconds || 0)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${status.color} text-white`}>
                      {status.status === "processing" && <Bot className="h-3 w-3 mr-1 animate-spin" />}
                      {status.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {recording.readiness_score ? (
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-medium">{recording.readiness_score}/100</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(recording.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
                        <Play className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>View Transcription</DropdownMenuItem>
                          <DropdownMenuItem>View AI Analysis</DropdownMenuItem>
                          <DropdownMenuItem>Reprocess</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
