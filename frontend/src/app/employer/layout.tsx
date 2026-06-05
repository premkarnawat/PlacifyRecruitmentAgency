import {
  LayoutDashboard, Briefcase, Users, GitMerge,
  BarChart3, CreditCard, Settings, HelpCircle, Upload
} from 'lucide-react'
import { PortalSidebar } from '@/components/layout/PortalSidebar'
import { PortalHeader } from '@/components/layout/PortalHeader'
import { useUIStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'

const EMPLOYER_NAV = [
  { label: 'Dashboard', href: '/employer/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/employer/jobs', icon: Briefcase },
  { label: 'Candidates', href: '/employer/candidates', icon: Users, badge: 12 },
  { label: 'Pipeline', href: '/employer/pipeline', icon: GitMerge },
  { label: 'Upload Candidates', href: '/employer/upload', icon: Upload },
  { label: 'Reports', href: '/employer/reports', icon: BarChart3 },
  { label: 'Billing', href: '/employer/billing', icon: CreditCard },
  { label: 'Settings', href: '/employer/settings', icon: Settings },
  { label: 'Support', href: '/employer/support', icon: HelpCircle },
]

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PortalSidebar navItems={EMPLOYER_NAV} portalName="Employer Portal" />
      <PortalHeader searchPlaceholder="Search candidates, jobs..." />
      <main className="pt-16 transition-all duration-250 employer-main">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
