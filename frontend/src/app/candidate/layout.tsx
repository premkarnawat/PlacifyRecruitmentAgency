import {
  LayoutDashboard, FileText, FolderOpen, Shield,
  Send, CalendarCheck, Award, Settings, TrendingUp
} from 'lucide-react'
import { PortalSidebar } from '@/components/layout/PortalSidebar'
import { PortalHeader } from '@/components/layout/PortalHeader'

const CANDIDATE_NAV = [
  { label: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
  { label: 'My Resume', href: '/candidate/resume', icon: FileText },
  { label: 'Portfolio', href: '/candidate/portfolio', icon: FolderOpen },
  { label: 'Trust Score', href: '/candidate/trust-score', icon: TrendingUp },
  { label: 'Applications', href: '/candidate/applications', icon: Send },
  { label: 'Interviews', href: '/candidate/interviews', icon: CalendarCheck },
  { label: 'My Passport', href: '/candidate/passport', icon: Award },
  { label: 'Settings', href: '/candidate/settings', icon: Settings },
]

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PortalSidebar navItems={CANDIDATE_NAV} portalName="Candidate Portal" />
      <PortalHeader searchPlaceholder="Search jobs, companies..." />
      <main className="pt-16 transition-all duration-250">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
