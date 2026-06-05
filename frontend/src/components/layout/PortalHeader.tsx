'use client'

import { Bell, Search, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/ui.store'

interface PortalHeaderProps {
  title?: string
  searchPlaceholder?: string
}

export function PortalHeader({ title, searchPlaceholder = 'Search...' }: PortalHeaderProps) {
  const { sidebarCollapsed } = useUIStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center gap-4 px-6 transition-all duration-250',
        sidebarCollapsed ? 'left-[68px]' : 'left-[240px]'
      )}
    >
      {title && (
        <h1 className="font-heading text-base font-semibold mr-2 hidden sm:block">{title}</h1>
      )}

      <div className="flex-1 max-w-sm">
        <Input
          placeholder={searchPlaceholder}
          leftIcon={<Search size={14} />}
          className="h-8 text-sm bg-muted border-transparent focus-visible:bg-background"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Notifications */}
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        {/* Theme */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
        )}
      </div>
    </header>
  )
}
