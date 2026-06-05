'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, Filter, Upload, Users, RefreshCw, CheckSquare, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { PipelineBoard } from '@/components/pipeline/PipelineBoard'
import type { PipelineBoard as PipelineBoardType, PipelineStatus } from '@/types/phase1.5'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL

async function fetchJobs(): Promise<{ id: string; title: string }[]> {
  const resp = await axios.get(`${API}/api/v1/jobs`, { withCredentials: true })
  return resp.data.jobs || []
}

async function fetchPipeline(jobId: string): Promise<PipelineBoardType> {
  const resp = await axios.get(`${API}/api/v1/pipeline/${jobId}`, { withCredentials: true })
  return resp.data
}

async function updateStatus(pipelineId: string, toStatus: PipelineStatus, jobId: string) {
  await axios.patch(
    `${API}/api/v1/pipeline/candidate/${pipelineId}/status`,
    { pipeline_status: toStatus },
    { withCredentials: true }
  )
}

async function bulkAction(data: {
  candidate_ids: string[]
  action: string
  pipeline_status?: PipelineStatus
}) {
  await axios.post(`${API}/api/v1/pipeline/bulk-action`, data, { withCredentials: true })
}

export default function PipelinePage() {
  const qc = useQueryClient()
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const jobsQuery = useQuery({ queryKey: ['jobs'], queryFn: fetchJobs })
  const pipelineQuery = useQuery({
    queryKey: ['pipeline', selectedJobId],
    queryFn: () => fetchPipeline(selectedJobId),
    enabled: !!selectedJobId,
  })

  const statusMutation = useMutation({
    mutationFn: ({ pipelineId, toStatus }: { pipelineId: string; toStatus: PipelineStatus }) =>
      updateStatus(pipelineId, toStatus, selectedJobId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline', selectedJobId] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

  const bulkMutation = useMutation({
    mutationFn: bulkAction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipeline', selectedJobId] })
      setSelectedIds(new Set())
      toast.success('Bulk action completed')
    },
  })

  const handleStatusChange = useCallback(async (pipelineId: string, toStatus: PipelineStatus) => {
    statusMutation.mutate({ pipelineId, toStatus })
  }, [statusMutation])

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const board = pipelineQuery.data

  // Filter candidates by search query across all columns
  const filteredBoard: PipelineBoardType | undefined = board && searchQuery
    ? {
        ...board,
        columns: board.columns.map((col) => ({
          ...col,
          candidates: col.candidates.filter((c) => {
            const p = c.candidate_profiles
            const q = searchQuery.toLowerCase()
            return (
              p?.full_name?.toLowerCase().includes(q) ||
              p?.headline?.toLowerCase().includes(q) ||
              p?.skills?.some((s) => s.toLowerCase().includes(q)) ||
              c.tags?.some((t) => t.toLowerCase().includes(q))
            )
          }),
        })),
      }
    : board

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Candidate Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Drag candidates across stages or use bulk actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-400">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => qc.invalidateQueries({ queryKey: ['pipeline', selectedJobId] })}
            className="text-zinc-400"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Job selector + search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger className="w-64 bg-zinc-900 border-zinc-700 text-zinc-200">
            <SelectValue placeholder="Select a job..." />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {(jobsQuery.data || []).map((job) => (
              <SelectItem key={job.id} value={job.id} className="text-zinc-200">
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder="Search candidates, skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-zinc-900 border-zinc-700 text-zinc-200"
          />
        </div>

        {board && (
          <Badge variant="outline" className="text-zinc-400 border-zinc-700">
            <Users className="w-3 h-3 mr-1" />
            {board.total} candidates
          </Badge>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30"
        >
          <CheckSquare className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-indigo-300 font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkMutation.mutate({
                candidate_ids: Array.from(selectedIds),
                action: 'star',
              })}
              className="border-indigo-500/30 text-indigo-400 text-xs"
            >
              ★ Star
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => bulkMutation.mutate({
                candidate_ids: Array.from(selectedIds),
                action: 'reject',
              })}
              className="border-red-500/30 text-red-400 text-xs"
            >
              Reject All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
              className="text-zinc-500"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Pipeline board */}
      {!selectedJobId ? (
        <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-zinc-800">
          <div className="text-center">
            <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Select a job to view its pipeline</p>
          </div>
        </div>
      ) : pipelineQuery.isLoading ? (
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-zinc-900 animate-pulse border border-zinc-800" />
          ))}
        </div>
      ) : filteredBoard ? (
        <PipelineBoard
          board={filteredBoard}
          onStatusChange={handleStatusChange}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />
      ) : null}
    </div>
  )
}
