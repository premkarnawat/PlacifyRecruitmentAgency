'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, User, Briefcase, Calendar, Shield, TrendingUp,
  MessageSquare, Send,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { WorkflowTimeline } from '@/components/workflow/WorkflowTimeline'
import type { HiringWorkflow, WorkflowState } from '@/types/phase1.5'
import { WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS } from '@/types/phase1.5'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL

async function fetchWorkflow(id: string) {
  const [wfResp, timelineResp] = await Promise.all([
    axios.get(`${API}/api/v1/workflow/${id}`, { withCredentials: true }),
    axios.get(`${API}/api/v1/workflow/${id}/timeline`, { withCredentials: true }),
  ])
  return { workflow: wfResp.data.workflow, validTransitions: wfResp.data.valid_transitions, timeline: timelineResp.data.timeline }
}

export default function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [transitionNotes, setTransitionNotes] = useState('')

  const query = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => fetchWorkflow(id),
  })

  const transitionMutation = useMutation({
    mutationFn: async ({ toState, notes }: { toState: WorkflowState; notes?: string }) => {
      const resp = await axios.post(`${API}/api/v1/workflow/${id}/transition`, {
        to_state: toState,
        notes,
      }, { withCredentials: true })
      return resp.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workflow', id] })
      setTransitionNotes('')
      toast.success('Workflow updated')
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Transition failed'),
  })

  if (query.isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-zinc-800 rounded-lg" />
        <div className="h-64 bg-zinc-900 rounded-2xl" />
      </div>
    )
  }

  const { workflow, validTransitions, timeline } = query.data!
  const candidate = workflow.candidate_profiles
  const job = workflow.jobs

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link href="/employer/pipeline" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Pipeline
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {candidate?.full_name?.charAt(0) || '?'}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{candidate?.full_name || 'Candidate'}</h1>
            <p className="text-sm text-zinc-400">{job?.title || 'Role'}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-sm px-3 py-1 ${WORKFLOW_STATE_COLORS[workflow.state as WorkflowState]}`}
        >
          {WORKFLOW_STATE_LABELS[workflow.state as WorkflowState]}
        </Badge>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'ATS Score', value: candidate?.ats_score, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Trust Score', value: candidate?.trust_score, icon: Shield, color: 'text-green-400' },
          { label: 'Application', value: workflow.applications?.[0]?.ats_score, icon: Briefcase, color: 'text-purple-400' },
          { label: 'Priority', value: workflow.priority, icon: User, color: 'text-orange-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${color}`}>
              {value != null ? Math.round(value) : '—'}
              {value != null && value <= 100 && '%' !== '' && <span className="text-sm font-normal text-zinc-600"></span>}
            </p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="workflow" className="space-y-4">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="workflow" className="data-[state=active]:bg-zinc-800">
            Workflow
          </TabsTrigger>
          <TabsTrigger value="details" className="data-[state=active]:bg-zinc-800">
            Details
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow" className="space-y-4">
          {/* Notes input for transition */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Add a note for this transition (optional)..."
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-200"
              />
            </div>
          </div>

          <WorkflowTimeline
            currentState={workflow.state}
            timeline={timeline}
            validTransitions={validTransitions}
            onTransition={(toState) =>
              transitionMutation.mutate({ toState, notes: transitionNotes || undefined })
            }
            isLoading={transitionMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="details">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <DetailRow label="Workflow ID" value={workflow.id} mono />
            <DetailRow label="Application ID" value={workflow.application_id} mono />
            <DetailRow label="Created" value={new Date(workflow.created_at).toLocaleString()} />
            <DetailRow label="Last Updated" value={new Date(workflow.updated_at).toLocaleString()} />
            {workflow.notes && <DetailRow label="Notes" value={workflow.notes} />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-800 last:border-0">
      <span className="text-xs text-zinc-500 flex-shrink-0">{label}</span>
      <span className={`text-xs text-zinc-300 text-right ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
