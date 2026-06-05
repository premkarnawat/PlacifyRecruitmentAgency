import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans, Sora, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/shared/QueryProvider'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Veriqo — Verified Hiring Intelligence Platform',
    template: '%s | Veriqo',
  },
  description:
    'Reduce hiring risk with verified, technically validated candidates. Veriqo delivers Candidate Passports instead of resume databases.',
  keywords: [
    'verified hiring',
    'candidate verification',
    'hiring intelligence',
    'ATS screening',
    'talent verification',
    'hiring risk reduction',
    'candidate passport',
  ],
  authors: [{ name: 'Veriqo' }],
  creator: 'Veriqo',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://veriqo.io',
    siteName: 'Veriqo',
    title: 'Veriqo — Verified Hiring Intelligence Platform',
    description:
      'Receive technically validated and verified candidates instead of thousands of resumes.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Veriqo — Verified Hiring Intelligence Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veriqo — Verified Hiring Intelligence Platform',
    description: 'Receive technically validated and verified candidates instead of thousands of resumes.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  metadataBase: new URL('https://veriqo.io'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable} ${sora.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: 'glass border border-white/10 text-foreground',
                  success: '!border-trust-500/30',
                  error: '!border-red-500/30',
                },
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
