"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ClipboardList, Plus, Edit, Trash2, Send } from "lucide-react"

interface QuestionnairesManagerProps {
  userId: string
}

export function QuestionnairesManager({ userId }: QuestionnairesManagerProps) {
  const [questionnaires, setQuestionnaires] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      // Load questionnaires
      const { data: questionnairesData } = await supabase
        .from("reverly_questionnaires")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      // Load responses
      const { data: responsesData } = await supabase
        .from("questionnaire_responses")
        .select(`
          *,
          contacts (
            first_name,
            last_name
          ),
          questionnaires (
            title
          )
        `)
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })

      setQuestionnaires(questionnairesData || [])
      setResponses(responsesData || [])
    } catch (error) {
      console.error("Error loading questionnaires data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading questionnaires...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Questionnaires</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Questionnaire
        </Button>
      </div>

      <Tabs defaultValue="questionnaires" className="space-y-6">
        <TabsList>
          <TabsTrigger value="questionnaires">My Questionnaires</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
        </TabsList>

        <TabsContent value="questionnaires" className="space-y-4">
          {questionnaires.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No questionnaires yet</h3>
                <p className="text-gray-600 mb-4">
                  Create custom questionnaires to gather information from your contacts and get AI-powered readiness
                  scores.
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Questionnaire
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionnaires.map((questionnaire) => (
                <Card key={questionnaire.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{questionnaire.title}</CardTitle>
                      <Badge variant={questionnaire.is_active ? "default" : "secondary"}>
                        {questionnaire.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm mb-4">{questionnaire.description}</p>
                    <div className="text-sm text-gray-500 mb-4">{questionnaire.questions?.length || 0} questions</div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <Send className="h-3 w-3 mr-1" />
                        Send
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          {responses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No responses yet</h3>
                <p className="text-gray-600">Questionnaire responses from your contacts will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {responses.map((response) => (
                <Card key={response.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">
                          {response.contacts?.first_name} {response.contacts?.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{response.questionnaires?.title}</p>
                      </div>
                      <div className="text-right">
                        {response.readiness_score && (
                          <div className="text-2xl font-bold text-primary">{response.readiness_score}/100</div>
                        )}
                        <div className="text-sm text-gray-500">
                          {new Date(response.completed_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
