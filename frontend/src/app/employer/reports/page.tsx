'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { Download, TrendingUp, Users, Clock, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/shared/StatCard'

const MONTHLY_DATA = [
  { month: 'Aug', applicants: 142, verified: 28, hired: 4, time_to_hire: 22 },
  { month: 'Sep', applicants: 178, verified: 35, hired: 6, time_to_hire: 19 },
  { month: 'Oct', applicants: 210, verified: 44, hired: 7, time_to_hire: 17 },
  { month: 'Nov', applicants: 189, verified: 38, hired: 5, time_to_hire: 16 },
  { month: 'Dec', applicants: 156, verified: 31, hired: 4, time_to_hire: 14 },
  { month: 'Jan', applicants: 248, verified: 56, hired: 9, time_to_hire: 12 },
]

const QUALITY_DISTRIBUTION = [
  { name: '90-100 (Excellent)', value: 23, color: '#10B981' },
  { name: '75-89 (Good)',       value: 41, color: '#2563EB' },
  { name: '60-74 (Average)',    value: 28, color: '#F59E0B' },
  { name: 'Below 60 (Low)',     value: 8,  color: '#EF4444' },
]

const DEPARTMENT_DATA = [
  { dept: 'Engineering',  hired: 14, open: 3 },
  { dept: 'Design',       hired: 5,  open: 2 },
  { dept: 'Product',      hired: 3,  open: 1 },
  { dept: 'Data',         hired: 6,  open: 2 },
  { dept: 'DevOps',       hired: 4,  open: 1 },
]

const OFFER_FUNNEL = [
  { stage: 'Verified',   count: 56 },
  { stage: 'Shortlisted',count: 24 },
  { stage: 'Interviewed', count: 16 },
  { stage: 'Offered',    count: 11 },
  { stage: 'Hired',      count: 9  },
]

export default function EmployerReportsPage() {
  const ref   = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <div ref={ref} className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-heading text-2xl font-bold">Hiring Analytics</h1>
          <p className="text-sm text-muted-foreground">Jan 2024 — Full hiring intelligence report</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download size={13} />Export PDF
        </Button>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Hired (YTD)',     value: 35,   suffix: '',  change: 40, icon: Users,     iconColor: 'text-trust-400', iconBg: 'bg-trust-500/10' },
          { title: 'Avg Time to Hire',      value: 14,   suffix: 'd', change: -36, icon: Clock,    iconColor: 'text-primary-400', iconBg: 'bg-primary/10' },
          { title: 'Offer Acceptance Rate', value: 94,   suffix: '%', change: 54, icon: TrendingUp, iconColor: 'text-cyan-400', iconBg: 'bg-cyan/10' },
          { title: 'Avg Trust Score',       value: 87,   suffix: '',  change: 12, icon: Award,     iconColor: 'text-indigo-400', iconBg: 'bg-indigo/10' },
        ].map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.08 }}
          >
            <StatCard {...s} changeLabel="vs last year" />
          </motion.div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly trend */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Monthly Hiring Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={MONTHLY_DATA} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="applicants" fill="#1E293B" name="Applicants" radius={[3,3,0,0]} />
                  <Bar dataKey="verified"   fill="#2563EB" name="Verified"   radius={[3,3,0,0]} />
                  <Bar dataKey="hired"      fill="#10B981" name="Hired"      radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quality distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Trust Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={QUALITY_DISTRIBUTION}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {QUALITY_DISTRIBUTION.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {QUALITY_DISTRIBUTION.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[10px]">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-muted-foreground flex-1 truncate">{d.name}</span>
                    <span className="font-semibold">{d.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Time to hire trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Time to Hire (Days) — Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={MONTHLY_DATA}>
                  <defs>
                    <linearGradient id="timeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey="time_to_hire" stroke="#2563EB" strokeWidth={2} fill="url(#timeGrad)" name="Days" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Offer funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.45 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Offer Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 pt-2">
                {OFFER_FUNNEL.map((stage, i) => {
                  const pct = Math.round((stage.count / OFFER_FUNNEL[0].count) * 100)
                  return (
                    <div key={stage.stage}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">{stage.stage}</span>
                        <span className="text-xs font-semibold">{stage.count} ({pct}%)</span>
                      </div>
                      <div className="h-6 rounded-lg bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${pct}%` } : {}}
                          transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                          className="h-full rounded-lg"
                          style={{ background: `hsl(${217 - i * 20}, 80%, ${55 - i * 5}%)` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
