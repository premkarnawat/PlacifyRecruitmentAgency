'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Filter, Sparkles, Hash, Binary,
  Shield, TrendingUp, MapPin, Briefcase, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import axios from 'axios'
import type { CandidateProfile } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL

const SEARCH_TYPES = [
  { id: 'semantic', label: 'Semantic', icon: Sparkles, description: 'AI-powered meaning search' },
  { id: 'keyword', label: 'Keyword', icon: Hash, description: 'Exact skill matching' },
  { id: 'boolean', label: 'Boolean', icon: Binary, description: 'AND / OR / NOT operators' },
] as const

type SearchType = 'semantic' | 'keyword' | 'boolean'

interface SearchFilters {
  ats_score_min?: number
  trust_score_min?: number
  experience_min?: number
  experience_max?: number
  salary_max?: number
  location?: string
  notice_period_max?: number
  open_to_relocation?: boolean
  verification_status?: string
}

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState<SearchType>('semantic')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})

  const searchMutation = useMutation({
    mutationFn: async () => {
      const resp = await axios.post(
        `${API}/api/v1/search/candidates`,
        { query, search_type: searchType, filters, limit: 30 },
        { withCredentials: true }
      )
      return resp.data
    },
  })

  const results = searchMutation.data?.candidates || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Advanced Candidate Search</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Semantic AI search, keyword matching, or boolean operators like <code className="text-indigo-400">React AND AWS NOT PHP</code>
        </p>
      </div>

      {/* Search type selector */}
      <div className="grid grid-cols-3 gap-2">
        {SEARCH_TYPES.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => setSearchType(id)}
            className={`
              p-3 rounded-xl border text-left transition-all
              ${searchType === id
                ? 'border-indigo-500 bg-indigo-500/10 text-white'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-600'}
            `}
          >
            <Icon className={`w-4 h-4 mb-1 ${searchType === id ? 'text-indigo-400' : ''}`} />
            <p className="text-sm font-medium">{label}</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{description}</p>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            placeholder={
              searchType === 'boolean'
                ? 'e.g. React AND TypeScript NOT Angular'
                : searchType === 'keyword'
                ? 'e.g. python, fastapi, postgres'
                : 'e.g. senior backend engineer with microservices experience'
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchMutation.mutate()}
            className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-200 h-11"
          />
        </div>
        <Button
          onClick={() => setShowFilters((v) => !v)}
          variant="outline"
          className="border-zinc-700 text-zinc-400 gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
        <Button
          onClick={() => searchMutation.mutate()}
          disabled={!query.trim() || searchMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-500 px-6"
        >
          {searchMutation.isPending ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Min ATS Score</Label>
                <Input
                  type="number" min={0} max={100}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                  onChange={(e) => setFilters((f) => ({ ...f, ats_score_min: +e.target.value || undefined }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Min Trust Score</Label>
                <Input
                  type="number" min={0} max={100}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                  onChange={(e) => setFilters((f) => ({ ...f, trust_score_min: +e.target.value || undefined }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Min Experience (years)</Label>
                <Input
                  type="number" min={0}
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                  onChange={(e) => setFilters((f) => ({ ...f, experience_min: +e.target.value || undefined }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Max Notice (days)</Label>
                <Input
                  type="number" min={0}
                  placeholder="90"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                  onChange={(e) => setFilters((f) => ({ ...f, notice_period_max: +e.target.value || undefined }))}
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-zinc-400">Location</Label>
                <Input
                  placeholder="Bangalore, Mumbai, Remote..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                  onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value || undefined }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Verification Status</Label>
                <select
                  className="w-full h-9 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-200 text-sm px-3"
                  onChange={(e) => setFilters((f) => ({ ...f, verification_status: e.target.value || undefined }))}
                >
                  <option value="">Any</option>
                  <option value="verified">Verified</option>
                  <option value="in_progress">In Progress</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {searchMutation.isSuccess && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-300">
              {results.length} results
            </h2>
            {searchMutation.data?.query && (
              <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-xs">
                &ldquo;{searchMutation.data.query}&rdquo;
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {results.map((candidate: any, i: number) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">
                    {candidate.full_name?.charAt(0) || '?'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-200">{candidate.full_name}</p>
                  <p className="text-sm text-zinc-500 truncate">{candidate.headline}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {candidate.location && (
                      <span className="text-xs text-zinc-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{candidate.location}
                      </span>
                    )}
                    {candidate.years_of_experience != null && (
                      <span className="text-xs text-zinc-600 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />{candidate.years_of_experience}y exp
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {candidate.ats_score != null && (
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-600">ATS</p>
                      <p className="text-sm font-bold text-blue-400">{Math.round(candidate.ats_score)}</p>
                    </div>
                  )}
                  {candidate.trust_score != null && (
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-600">Trust</p>
                      <p className="text-sm font-bold text-green-400">{Math.round(candidate.trust_score)}</p>
                    </div>
                  )}
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      candidate.verification_status === 'verified'
                        ? 'border-green-500/30 text-green-400'
                        : 'border-zinc-700 text-zinc-500'
                    }`}
                  >
                    <Shield className="w-2.5 h-2.5 mr-1" />
                    {candidate.verification_status}
                  </Badge>
                </div>
              </motion.div>
            ))}

            {results.length === 0 && (
              <div className="text-center py-12 text-zinc-600">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No candidates matched your search.</p>
                <p className="text-sm mt-1">Try broadening your query or adjusting filters.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
