import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import api from '../api'

const Icon = ({ d }) => (
  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

const ICONS = {
  home:     'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  victims:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  oral:     'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
  globe:    'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9',
  upload:   'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  text:     'M4 6h16M4 12h16M4 18h7',
  pencil:   'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  shield:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  users:    'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
  user:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  external: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  logout:   'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  plus:     'M12 4v16m8-8H4',
  menu:     'M4 6h16M4 12h16M4 18h16',
}

// Sidebar groups, WordPress-style. `superuser` items are hidden from other roles.
const NAV = [
  { items: [
    { to: '/admin-panel', end: true, label: 'Dashboard', icon: 'home' },
  ]},
  { heading: 'Memorial records', items: [
    { to: '/admin-panel/victims',        label: 'Victims',        icon: 'victims' },
    { to: '/admin-panel/oral-histories', label: 'Oral Histories', icon: 'oral' },
    { to: '/admin-panel/imports',        label: 'Bulk Import',    icon: 'upload' },
  ]},
  { heading: 'Review', items: [
    { to: '/admin-panel/submissions', label: 'Submissions',   icon: 'pencil', badge: 'submissions', badgeColor: 'blue' },
    { to: '/admin-panel/consent',     label: 'Consent Queue', icon: 'shield', badge: 'pending',     badgeColor: 'amber' },
  ]},
  { heading: 'Website', items: [
    { to: '/admin-panel/content',     label: 'Pages & Text', icon: 'text' },
    { to: '/admin-panel/initiatives', label: 'Initiatives',  icon: 'globe' },
  ]},
  { heading: 'People', items: [
    { to: '/admin-panel/users',   label: 'Staff Accounts', icon: 'users', superuser: true },
    { to: '/admin-panel/profile', label: 'My Profile',     icon: 'user' },
  ]},
]

const NEW_ITEMS = [
  { to: '/admin-panel/victims/new',        label: 'Victim record' },
  { to: '/admin-panel/oral-histories/new', label: 'Oral history' },
  { to: '/admin-panel/initiatives/new',    label: 'Initiative' },
  { to: '/admin-panel/users/new',          label: 'Staff account', superuser: true },
]

const ROLE_LABELS = { administrator: 'Administrator', editor: 'Editor', verifier: 'Verifier' }

const BADGE_STYLES = {
  amber: 'bg-amber-500/20 text-amber-400',
  blue:  'bg-blue-500/20 text-blue-400',
}

function useOutsideClose(open, setOpen) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open, setOpen])
  return ref
}

export default function AdminLayout({ children }) {
  const { logout, user, isSuperuser } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [counts, setCounts]     = useState({ pending: 0, submissions: 0 })
  const [drawer, setDrawer]     = useState(false)
  const [newOpen, setNewOpen]   = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const newRef  = useOutsideClose(newOpen, setNewOpen)
  const userRef = useOutsideClose(userOpen, setUserOpen)

  // Badge counts — page_size=1 keeps these requests tiny on slow connections
  useEffect(() => {
    api.get('/victims/?consent_status=PENDING&page_size=1')
      .then(r => setCounts(c => ({ ...c, pending: r.data.count ?? 0 }))).catch(() => {})
    api.get('/submissions/?status=SUBMITTED&page_size=1')
      .then(r => setCounts(c => ({ ...c, submissions: r.data.count ?? 0 }))).catch(() => {})
  }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/admin-panel/login')
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-blue-500/15 text-blue-400 font-medium'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`

  const displayName = user?.full_name || user?.username || ''

  const sidebar = (
    <aside
      className="w-60 shrink-0 flex flex-col border-r h-full"
      style={{ backgroundColor: '#0d1117', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <Link to="/admin-panel" className="block px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <p className="font-semibold text-white text-sm">Mapping Memory</p>
        <p className="text-xs text-slate-500 mt-0.5">Staff Admin</p>
      </Link>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {NAV.map((group, gi) => {
          const items = group.items.filter(i => !i.superuser || isSuperuser)
          if (!items.length) return null
          return (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              {group.heading && (
                <p className="px-3 mb-1.5 text-[10px] font-bold tracking-widest uppercase text-slate-600">{group.heading}</p>
              )}
              <div className="space-y-0.5">
                {items.map(item => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                    <Icon d={ICONS[item.icon]} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && counts[item.badge] > 0 && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${BADGE_STYLES[item.badgeColor]}`}>
                        {counts[item.badge]}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="px-3 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-colors"
        >
          <Icon d={ICONS.logout} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0a0f1e' }}>

      {/* Sidebar — fixed on desktop, drawer on mobile */}
      <div className="hidden md:flex">{sidebar}</div>
      {drawer && (
        // Any click — a link or the backdrop — closes the drawer
        <div className="md:hidden fixed inset-0 z-40 flex" onClick={() => setDrawer(false)} style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          {sidebar}
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="h-12 shrink-0 flex items-center gap-2 px-3 md:px-5 border-b"
          style={{ backgroundColor: '#0d1117', borderColor: 'rgba(255,255,255,0.07)' }}
        >
          <button onClick={() => setDrawer(true)} className="md:hidden p-1.5 text-slate-400 hover:text-white" aria-label="Open menu">
            <Icon d={ICONS.menu} />
          </button>

          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5">
            <Icon d={ICONS.external} />
            <span className="hidden sm:inline">View site</span>
          </a>

          <div className="relative" ref={newRef}>
            <button onClick={() => setNewOpen(o => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5">
              <Icon d={ICONS.plus} />
              New
            </button>
            {newOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 rounded-xl py-1 z-50 shadow-xl"
                style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.1)' }}>
                {NEW_ITEMS.filter(i => !i.superuser || isSuperuser).map(i => (
                  <Link key={i.to} to={i.to} onClick={() => setNewOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5">
                    {i.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="relative" ref={userRef}>
            <button onClick={() => setUserOpen(o => !o)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5">
              <span className="hidden sm:inline">Signed in as <span className="text-slate-200 font-medium">{displayName}</span></span>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-blue-300"
                style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}>
                {displayName.charAt(0).toUpperCase() || '?'}
              </span>
            </button>
            {userOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-xl py-1 z-50 shadow-xl"
                style={{ backgroundColor: '#141929', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="px-4 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                  <p className="text-sm text-white font-medium truncate">{displayName}</p>
                  <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] ?? ''}</p>
                </div>
                <Link to="/admin-panel/profile" onClick={() => setUserOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5">
                  Edit profile & password
                </Link>
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:text-red-400 hover:bg-white/5">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
