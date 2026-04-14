import { NavLink, Link } from 'react-router-dom'
import { useContent } from '../context/ContentContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const siteName    = useContent('site_name',    'Mapping Memory')
  const siteTagline = useContent('site_tagline', 'Nigeria')
  const navCta      = useContent('site_nav_cta', 'Submit a record')
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const linkClass = ({ isActive }) =>
    `text-sm transition-colors ${isActive
      ? 'font-medium dark:text-white text-slate-900'
      : 'dark:text-slate-400 text-slate-500 dark:hover:text-white hover:text-slate-900'}`

  return (
    <header
      className="sticky top-0 z-50 border-b px-4 md:px-8 h-14 flex items-center"
      style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--border)' }}
    >
      <div className="w-full flex items-center justify-between gap-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center border"
            style={{ borderColor: 'rgba(96,165,250,0.4)', backgroundColor: 'rgba(96,165,250,0.1)' }}
          >
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              <path d="M2 12h20" />
            </svg>
          </div>
          <div className="leading-none">
            <p className="font-semibold text-sm dark:text-white text-slate-900">{siteName}</p>
            <p className="text-xs mt-0.5 dark:text-slate-500 text-slate-400">{siteTagline}</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/register" className={linkClass}>Register</NavLink>
          <NavLink to="/map" className={linkClass}>Map</NavLink>
          <NavLink to="/initiatives" className={linkClass}>Community</NavLink>
          <NavLink to="/about" className={linkClass}>About</NavLink>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors dark:hover:bg-white/10 hover:bg-black/8"
            style={{ color: isDark ? '#94a3b8' : '#64748b' }}
          >
            {isDark ? (
              /* Sun icon */
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="5" />
                <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              /* Moon icon */
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          <NavLink
            to="/submit"
            className="text-sm font-medium text-white rounded-full px-4 py-1.5 transition-colors"
            style={{ backgroundColor: '#b8860b' }}
          >
            {navCta}
          </NavLink>

          <Link
            to="/admin-panel"
            className="text-sm rounded-full px-4 py-1.5 transition-colors border dark:text-slate-400 dark:hover:text-white dark:border-white/15 text-slate-500 hover:text-slate-900 border-black/15"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  )
}
