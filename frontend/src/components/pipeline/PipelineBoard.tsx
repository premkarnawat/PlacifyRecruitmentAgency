'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MoreHorizontal, User, MapPin, Briefcase, Shield } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { PipelineBoard as PipelineBoardType, PipelineCandidate, PipelineStatus } from '@/types/phase1.5'
import { PIPELINE_STATUS_LABELS } from '@/types/phase1.5'

const COLUMN_COLORS: Record<PipelineStatus, string> = {
  new:                  'border-zinc-700',
  ats_matched:          'border-blue-500/40',
  interested:           'border-purple-500/40',
  verification_pending: 'border-orange-500/40',
  verified:             'border-green-500/40',
  interview_scheduled:  'border-indigo-500/40',
  offer:                'border-pink-500/40',
  joined:               'border-emerald-500/40',
  rejected:             'border-red-500/40',
}

const COLUMN_HEADER_COLORS: Record<PipelineStatus, string> = {
  new:                  'text-zinc-400 bg-zinc-400/10',
  ats_matched:          'text-blue-400 bg-blue-400/10',
  interested:           'text-purple-400 bg-purple-400/10',
  verification_pending: 'text-orange-400 bg-orange-400/10',
  verified:             'text-green-400 bg-green-400/10',
  interview_scheduled:  'text-indigo-400 bg-indigo-400/10',
  offer:                'text-pink-400 bg-pink-400/10',
  joined:               'text-emerald-400 bg-emerald-400/10',
  rejected:             'text-red-400 bg-red-400/10',
}

interface PipelineBoardProps {
  board: PipelineBoardType
  onStatusChange: (pipelineId: string, toStatus: PipelineStatus) => Promise<void>
  onCandidateClick?: (candidate: PipelineCandidate) => void
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

export function PipelineBoard({
  board,
  onStatusChange,
  onCandidateClick,
  selectedIds = new Set(),
  onToggleSelect,
}: PipelineBoardProps) {
  const [dragging, setDragging] = useState<PipelineCandidate | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<PipelineStatus | null>(null)

  const handleDragStart = useCallback((candidate: PipelineCandidate) => {
    setDragging(candidate)
  }, [])

  const handleDrop = useCallback((toStatus: PipelineStatus) => {
    if (dragging && dragging.pipeline_status !== toStatus) {
      onStatusChange(dragging.id, toStatus)
    }
    setDragging(null)
    setDragOverColumn(null)
  }, [dragging, onStatusChange])

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 min-h-[600px]">
      {board.columns.map((column) => (
        <div
          key={column.id}
          className={`
            flex-shrink-0 w-60 rounded-xl border bg-zinc-900/60
            transition-all duration-200
            ${COLUMN_COLORS[column.id]}
            ${dragOverColumn === column.id ? 'ring-2 ring-indigo-500/50 bg-indigo-500/5' : ''}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOverColumn(column.id) }}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={() => handleDrop(column.id)}
        >
          {/* Column header */}
          <div className="p-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={`text-xs font-semibold ${COLUMN_HEADER_COLORS[column.id]}`}
              >
                {PIPELINE_STATUS_LABELS[column.id]}
              </Badge>
              <span className="text-xs text-zinc-500 font-mono">
                {column.candidates.length}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 min-h-[200px]">
            <AnimatePresence>
              {column.candidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedIds.has(candidate.id)}
                  onDragStart={() => handleDragStart(candidate)}
                  onClick={() => onCandidateClick?.(candidate)}
                  onToggleSelect={() => onToggleSelect?.(candidate.id)}
                  onStatusChange={(status) => onStatusChange(candidate.id, status)}
                />
              ))}
            </AnimatePresence>

            {column.candidates.length === 0 && (
              <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-zinc-800">
                <p className="text-xs text-zinc-700">Drop here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function CandidateCard({
  candidate,
  isSelected,
  onDragStart,
  onClick,
  onToggleSelect,
  onStatusChange,
}: {
  candidate: PipelineCandidate
  isSelected: boolean
  onDragStart: () => void
  onClick: () => void
  onToggleSelect: () => void
  onStatusChange: (status: PipelineStatus) => void
}) {
  const profile = candidate.candidate_profiles
  const nextStatuses: PipelineStatus[] = ['ats_matched', 'interested', 'verified', 'interview_scheduled', 'offer', 'joined', 'rejected']

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={onDragStart}
      className={`
        group rounded-lg border bg-zinc-900 p-3 cursor-grab active:cursor-grabbing
        transition-all hover:border-zinc-600 hover:bg-zinc-800/80
        ${isSelected ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-zinc-800'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="mt-0.5 rounded border-zinc-700 bg-zinc-800 accent-indigo-500 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Avatar */}
        <div
          className="flex-1 flex items-start gap-2 cursor-pointer min-w-0"
          onClick={onClick}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
            ) : (
              <span className="text-xs font-bold text-white">
                {profile?.full_name?.charAt(0) || '?'}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-zinc-200 truncate">
              {profile?.full_name || 'Unknown'}
            </p>
            {profile?.headline && (
              <p className="text-[10px] text-zinc-500 truncate">{profile.headline}</p>
            )}
          </div>
        </div>

        {/* Star + Menu */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {candidate.starred && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-zinc-500"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs w-44"
            >
              {nextStatuses.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() => onStatusChange(status)}
                  className="text-xs cursor-pointer"
                >
                  Move to {PIPELINE_STATUS_LABELS[status]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scores row */}
      <div className="flex items-center gap-2 mt-2">
        {candidate.ats_score != null && (
          <ScorePill label="ATS" value={candidate.ats_score} />
        )}
        {candidate.trust_score != null && (
          <ScorePill label="Trust" value={candidate.trust_score} />
        )}
        {profile?.years_of_experience != null && (
          <span className="text-[10px] text-zinc-600 flex items-center gap-0.5">
            <Briefcase className="w-2.5 h-2.5" />
            {profile.years_of_experience}y
          </span>
        )}
      </div>

      {/* Skills */}
      {profile?.skills && profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {profile.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
            >
              {skill}
            </span>
          ))}
          {profile.skills.length > 3 && (
            <span className="text-[10px] text-zinc-600">+{profile.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Tags */}
      {candidate.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {candidate.tags.map((tag) => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'text-green-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400'
  return (
    <span className={`text-[10px] font-mono font-bold ${color}`}>
      {label} {Math.round(value)}
    </span>
  )
}
