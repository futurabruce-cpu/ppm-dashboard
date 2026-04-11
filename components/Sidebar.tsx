'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'

interface Profile {
  role: 'superadmin' | 'admin' | 'engineer'
  full_name?: string | null
  companies?: { name: string } | null
}

export default function Sidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard/submissions', label: '📋 Worksheets', roles: ['superadmin','admin','engineer'] },
    { href: '/dashboard/scheduled-jobs', label: '📅 Scheduled Jobs', roles: ['superadmin','admin'] },
    { href: '/dashboard/follow-ups', label: '🔴 Follow Ups', roles: ['superadmin','admin','engineer'] },
    { href: '/dashboard/engineers', label: '👷 Engineers', roles: ['superadmin','admin'] },
    { href: '/dashboard/companies', label: '🏢 Companies', roles: ['superadmin'] },
  ]

  const role = profile?.role ?? 'engineer'
  const visibleNav = navItems.filter(item => item.roles.includes(role))

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex w-64 flex-shrink-0 flex-col" style={{ background: '#1a1a2e', minHeight: '100vh', zIndex: 40 }}>
        <Link href="/dashboard" className="px-6 py-5 border-b border-white/10 flex items-center gap-3 hover:bg-white/5 transition-colors">
          <img src="/gow-logo.webp" alt="GOW Systems" className="w-10 h-10 object-contain rounded-lg bg-white p-0.5" />
          <div>
            <div className="text-white font-black text-xl tracking-wide">Worksheets</div>
            <div className="text-white/50 text-xs mt-0.5">{profile?.companies?.name ?? 'Fire Alarm Services'}</div>
          </div>
        </Link>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                  active ? 'text-black' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
                style={active ? { background: '#F5A800', color: '#000' } : {}}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-4 py-4 border-t border-white/10">
          <div className="text-white/60 text-xs mb-1">{profile?.full_name ?? 'User'}</div>
          <div className="text-white/30 text-xs mb-3 capitalize">{role}</div>
          <form action={logout}>
            <button type="submit" className="w-full text-left text-white/50 hover:text-white text-xs py-1 transition-colors">
              → Sign out
            </button>
          </form>
        </div>
      </div>

      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3" style={{ background: '#1a1a2e' }}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src="/gow-logo.webp" alt="GOW" className="w-8 h-8 object-contain rounded bg-white p-0.5" />
          <div>
            <div className="text-white font-black text-base tracking-wide">Worksheets</div>
            <div className="text-white/50 text-xs">{profile?.companies?.name ?? ''}</div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-xs">{profile?.full_name ?? ''}</span>
          <form action={logout}>
            <button type="submit" className="text-white/70 text-xs border border-white/20 rounded-lg px-3 py-1.5">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t border-white/10" style={{ background: '#1a1a2e' }}>
        {visibleNav.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center py-3 text-xs font-bold transition-all"
              style={active ? { color: '#F5A800' } : { color: 'rgba(255,255,255,0.5)' }}
            >
              <span className="text-xl mb-0.5">{item.label.split(' ')[0]}</span>
              <span>{item.label.split(' ').slice(1).join(' ')}</span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
