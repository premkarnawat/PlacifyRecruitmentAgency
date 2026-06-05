import Link from 'next/link'
import { Shield, Twitter, Linkedin, Github, Mail } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const FOOTER_LINKS = {
  Platform: [
    { label: 'ATS Engine', href: '/platform/ats' },
    { label: 'Trust Score', href: '/platform/trust-score' },
    { label: 'Candidate Passport', href: '/platform/passport' },
    { label: 'Fraud Detection', href: '/platform/fraud' },
    { label: 'Expert Network', href: '/platform/experts' },
  ],
  Company: [
    { label: 'About', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
    { label: 'Contact', href: '/contact' },
  ],
  Solutions: [
    { label: 'For Employers', href: '/employers' },
    { label: 'For Candidates', href: '/candidates' },
    { label: 'For Experts', href: '/experts' },
    { label: 'Industries', href: '/industries' },
    { label: 'Enterprise', href: '/enterprise' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: 'https://status.veriqo.io' },
    { label: 'Security', href: '/security' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <span className="font-logo text-lg font-bold tracking-tight text-white">
                Veri<span className="text-cyan-400">qo</span>
              </span>
            </Link>
            <p className="text-sm text-navy-400 leading-relaxed mb-6 max-w-xs">
              Verified Hiring Intelligence Platform. Reduce hiring risk by delivering technically validated candidates instead of resume databases.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, href: 'https://twitter.com/veriqo', label: 'Twitter' },
                { icon: Linkedin, href: 'https://linkedin.com/company/veriqo', label: 'LinkedIn' },
                { icon: Github, href: 'https://github.com/veriqo', label: 'GitHub' },
                { icon: Mail, href: 'mailto:hello@veriqo.io', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="h-9 w-9 rounded-lg border border-navy-700 flex items-center justify-center text-navy-400 hover:text-white hover:border-navy-500 transition-colors"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-navy-400 mb-4">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-navy-400 hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-navy-800" />

        {/* Bottom Bar */}
        <div className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-navy-500">
            © {new Date().getFullYear()} Veriqo Technologies Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
              { label: 'Cookie Policy', href: '/cookies' },
              { label: 'GDPR', href: '/gdpr' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-navy-500 hover:text-navy-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
