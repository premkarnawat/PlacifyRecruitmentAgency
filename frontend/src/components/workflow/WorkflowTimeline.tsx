'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Circle, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { WorkflowState, WorkflowTimelineEntry } from '@/types/phase1.5'
import { WORKFLOW_STATE_LABELS, WORKFLOW_STATE_COLORS } from '@/types/phase1.5'
import { formatDistanceToNow } from 'date-fns'

interface WorkflowTimelineProps {
  currentState: WorkflowState
  timeline: WorkflowTimelineEntry[]
  validTransitions: WorkflowState[]
  onTransition?: (toState: WorkflowState, notes?: string) => void
  isLoading?: boolean
}

// All states in order
const STATE_ORDER: WorkflowState[] = [
  'job_created', 'agency_review', 'ats_matching', 'candidate_interest_check',
  'verification_pending', 'verification_complete', 'company_review',
  'interview_scheduled', 'interview_completed', 'offer_released',
  'offer_accepted', 'joined', 'invoice_generated',
]

export function WorkflowTimeline({
  currentState,
  timeline,
  validTransitions,
  onTransition,
  isLoading,
}: WorkflowTimelineProps) {
  const currentIndex = STATE_ORDER.indexOf(currentState)

  return (
    <div className="space-y-6">
      {/* Visual progress stepper */}
      <div className="relative">
        <div className="flex items-center gap-0 overflow-x-auto pb-2">
          {STATE_ORDER.map((state, idx) => {
            const isPast = idx < currentIndex
            const isCurrent = idx === currentIndex
            const isFuture = idx > currentIndex

            return (
              <div key={state} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                      ${isPast ? 'bg-indigo-500 border-indigo-500' : ''}
                      ${isCurrent ? 'bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/30' : ''}
                      ${isFuture ? 'bg-zinc-800 border-zinc-700' : ''}
                    `}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : isCurrent ? (
                      <Clock className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Circle className="w-3 h-3 text-zinc-600" />
                    )}
                  </motion.div>
                  <span className={`
                    text-[10px] font-medium text-center max-w-[64px] leading-tight
                    ${isCurrent ? 'text-indigo-400' : isPast ? 'text-zinc-400' : 'text-zinc-600'}
                  `}>
                    {WORKFLOW_STATE_LABELS[state]}
                  </span>
                </div>
                {idx < STATE_ORDER.length - 1 && (
                  <div className={`
                    w-8 h-0.5 flex-shrink-0 mb-5 mx-1
                    ${idx < currentIndex ? 'bg-indigo-500' : 'bg-zinc-700'}
                  `} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Valid next transitions */}
      {validTransitions.length > 0 && onTransition && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-zinc-500 self-center">Move to:</span>
          {validTransitions.map((state) => (
            <button
              key={state}
              onClick={() => onTransition(state)}
              disabled={isLoading}
              className={`
                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                border transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                ${WORKFLOW_STATE_COLORS[state]} border-current/20
              `}
            >
              <ArrowRight className="w-3 h-3" />
              {WORKFLOW_STATE_LABELS[state]}
            </button>
          ))}
        </div>
      )}

      {/* Timeline audit log */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-300">Activity Timeline</h3>
        <div className="space-y-2">
          {[...timeline].reverse().map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800"
            >
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {entry.from_state && (
                    <>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-2 py-0 ${WORKFLOW_STATE_COLORS[entry.from_state]}`}
                      >
                        {WORKFLOW_STATE_LABELS[entry.from_state]}
                      </Badge>
                      <ArrowRight className="w-3 h-3 text-zinc-600" />
                    </>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0 ${WORKFLOW_STATE_COLORS[entry.to_state]}`}
                  >
                    {WORKFLOW_STATE_LABELS[entry.to_state]}
                  </Badge>
                  <span className="text-[10px] text-zinc-600 capitalize ml-auto">
                    via {entry.actor_role}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-xs text-zinc-500 mt-1">{entry.notes}</p>
                )}
                <p className="text-[10px] text-zinc-600 mt-1">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
