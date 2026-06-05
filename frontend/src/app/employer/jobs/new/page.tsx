'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { X, Plus, ArrowLeft, Sparkles, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { jobSchema, type JobInput } from '@/lib/validations'
import { EXPERT_DOMAINS } from '@/lib/constants'
import Link from 'next/link'

export default function NewJobPage() {
  const router = useRouter()
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [requirements, setRequirements] = useState<string[]>([''])
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<JobInput>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      job_type: 'full_time',
      work_mode: 'hybrid',
      skills_required: [],
      requirements: [],
    },
  })

  const addSkill = (skill: string) => {
    const s = skill.trim()
    if (s && !skills.includes(s)) {
      const updated = [...skills, s]
      setSkills(updated)
      setValue('skills_required', updated)
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    const updated = skills.filter((s) => s !== skill)
    setSkills(updated)
    setValue('skills_required', updated)
  }

  const updateRequirement = (i: number, val: string) => {
    const updated = [...requirements]
    updated[i] = val
    setRequirements(updated)
    setValue('requirements', updated.filter(Boolean))
  }

  const onSubmit = async (data: JobInput) => {
    setIsSaving(true)
    await new Promise((r) => setTimeout(r, 1000)) // replace with API call
    toast.success('Job posted successfully!')
    router.push('/employer/jobs')
    setIsSaving(false)
  }

  return (
    <div className="max-w-[800px] space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link href="/employer/jobs">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">Post New Job</h1>
          <p className="text-sm text-muted-foreground">Create a job and start receiving verified candidates</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Basic info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Input
                  placeholder="e.g. Senior React Developer"
                  error={errors.title?.message}
                  {...register('title')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Job Type *</Label>
                  <Select defaultValue="full_time" onValueChange={(v) => setValue('job_type', v as JobInput['job_type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Work Mode *</Label>
                  <Select defaultValue="hybrid" onValueChange={(v) => setValue('work_mode', v as JobInput['work_mode'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input placeholder="e.g. Bangalore, Karnataka" {...register('location')} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Compensation + Experience */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Compensation & Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Min Salary (₹/year)</Label>
                  <Input type="number" placeholder="1200000" {...register('salary_min', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Salary (₹/year)</Label>
                  <Input type="number" placeholder="2400000" {...register('salary_max', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Min Experience (years)</Label>
                  <Input type="number" placeholder="3" {...register('experience_min', { valueAsNumber: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Max Experience (years)</Label>
                  <Input type="number" placeholder="7" {...register('experience_max', { valueAsNumber: true })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Required Skills *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill (e.g. React, Python...)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => addSkill(skillInput)}>
                  <Plus size={14} />
                </Button>
              </div>
              {/* Quick add from domains */}
              <div className="flex flex-wrap gap-1.5">
                {EXPERT_DOMAINS.slice(0, 10).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => addSkill(d)}
                    className="rounded-md border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors"
                  >
                    + {d}
                  </button>
                ))}
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-md bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-400 transition-colors">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.skills_required && (
                <p className="text-xs text-red-500">{errors.skills_required.message}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Description */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Job Description *</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <textarea
                  rows={6}
                  placeholder="Describe the role, responsibilities, team culture..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-xs text-red-500">{errors.description.message}</p>
                )}
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label>Requirements</Label>
                {requirements.map((req, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Requirement ${i + 1}`}
                      value={req}
                      onChange={(e) => updateRequirement(i, e.target.value)}
                      className="flex-1"
                    />
                    {requirements.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setRequirements(requirements.filter((_, idx) => idx !== i))}
                      >
                        <X size={13} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground"
                  onClick={() => setRequirements([...requirements, ''])}
                >
                  <Plus size={12} /> Add requirement
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 justify-end pb-8"
        >
          <Link href="/employer/jobs">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" variant="outline" className="gap-2" disabled={isSaving}>
            <Save size={14} />Save as Draft
          </Button>
          <Button type="submit" variant="glow" className="gap-2" loading={isSaving}>
            <Sparkles size={14} />Post Job & Start Matching
          </Button>
        </motion.div>
      </form>
    </div>
  )
}
