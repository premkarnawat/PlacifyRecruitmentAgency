'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, DollarSign, Clock, MapPin, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import axios from 'axios'

const API = process.env.NEXT_PUBLIC_API_URL

export default function InterestConfirmationPage() {
  const { applicationId } = useParams<{ applicationId: string }>()
  const router = useRouter()

  const [form, setForm] = useState({
    interested: true,
    current_salary: '',
    expected_salary: '',
    notice_period_days: '30',
    open_to_relocation: false,
    has_other_offers: false,
    other_offers_details: '',
    available_for_interview: '',
  })

  // Fetch application details to show job info
  const appQuery = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      const resp = await axios.get(`${API}/api/v1/candidates/application/${applicationId}`, {
        withCredentials: true,
      })
      return resp.data
    },
  })

  const submitMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      await axios.post(`${API}/api/v1/interest/${applicationId}`, {
        ...data,
        current_salary: data.current_salary ? parseInt(data.current_salary) : null,
        expected_salary: data.expected_salary ? parseInt(data.expected_salary) : null,
        notice_period_days: parseInt(data.notice_period_days),
      }, { withCredentials: true })
    },
    onSuccess: () => {
      toast.success(form.interested ? 'Great! Your interest has been confirmed.' : 'Response recorded.')
      router.push('/candidate/dashboard')
    },
    onError: () => toast.error('Failed to submit. Please try again.'),
  })

  const job = appQuery.data?.job

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        {/* Job card */}
        {job && (
          <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{job.title}</h3>
                <p className="text-sm text-zinc-400">{job.company_name}</p>
                {job.location && (
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />{job.location}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-white">Are you interested?</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Your response helps us move forward efficiently. All information is kept confidential.
            </p>
          </div>

          {/* Interested toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div>
              <p className="font-medium text-zinc-200">I&apos;m interested in this role</p>
              <p className="text-xs text-zinc-500 mt-0.5">Toggle off to decline</p>
            </div>
            <Switch
              checked={form.interested}
              onCheckedChange={(v) => setForm((f) => ({ ...f, interested: v }))}
            />
          </div>

          {form.interested && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              {/* Salary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Current CTC (₹/year)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <Input
                      type="number"
                      placeholder="1500000"
                      value={form.current_salary}
                      onChange={(e) => setForm((f) => ({ ...f, current_salary: e.target.value }))}
                      className="pl-8 bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Expected CTC (₹/year)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <Input
                      type="number"
                      placeholder="2000000"
                      value={form.expected_salary}
                      onChange={(e) => setForm((f) => ({ ...f, expected_salary: e.target.value }))}
                      className="pl-8 bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notice period */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Notice Period (days)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                  <Input
                    type="number"
                    placeholder="30"
                    value={form.notice_period_days}
                    onChange={(e) => setForm((f) => ({ ...f, notice_period_days: e.target.value }))}
                    className="pl-8 bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-zinc-300">Open to relocation</Label>
                    <p className="text-xs text-zinc-600">If the role requires it</p>
                  </div>
                  <Switch
                    checked={form.open_to_relocation}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, open_to_relocation: v }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm text-zinc-300">I have other offers</Label>
                    <p className="text-xs text-zinc-600">Helps us prioritise your application</p>
                  </div>
                  <Switch
                    checked={form.has_other_offers}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, has_other_offers: v }))}
                  />
                </div>
              </div>

              {form.has_other_offers && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Other offer details (optional)</Label>
                  <Input
                    placeholder="e.g. Offer from XYZ Corp, joining in 2 weeks"
                    value={form.other_offers_details}
                    onChange={(e) => setForm((f) => ({ ...f, other_offers_details: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                  />
                </div>
              )}

              {/* Interview availability */}
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Available for interview from</Label>
                <Input
                  type="date"
                  value={form.available_for_interview}
                  onChange={(e) => setForm((f) => ({ ...f, available_for_interview: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 text-sm"
                />
              </div>
            </motion.div>
          )}

          {/* Submit buttons */}
          <div className="flex gap-3 pt-2">
            {form.interested ? (
              <Button
                onClick={() => submitMutation.mutate(form)}
                disabled={submitMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {submitMutation.isPending ? 'Submitting...' : 'Confirm Interest'}
              </Button>
            ) : (
              <Button
                onClick={() => submitMutation.mutate(form)}
                disabled={submitMutation.isPending}
                variant="outline"
                className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {submitMutation.isPending ? 'Submitting...' : 'Decline this role'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
