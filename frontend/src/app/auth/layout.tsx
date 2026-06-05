import Link from 'next/link'
import { Shield } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      {/* Header */}
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-logo text-lg font-bold tracking-tight text-white">
            Veri<span className="text-cyan-400">qo</span>
          </span>
        </Link>
      </header>

      {/* Background grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
        {children}
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-navy-500">
          © {new Date().getFullYear()} Veriqo · {' '}
          <Link href="/privacy" className="hover:text-navy-300 transition-colors">Privacy</Link>
          {' '} · {' '}
          <Link href="/terms" className="hover:text-navy-300 transition-colors">Terms</Link>
        </p>
      </footer>
    </div>
  )
}
