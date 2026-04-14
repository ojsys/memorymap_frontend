import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useContent } from '../context/ContentContext'

// ── Constants ──────────────────────────────────────────────────────────

const GENDER_LABELS = { M: 'Male', F: 'Female', NR: 'Not recorded' }

const YEAR_RANGES = [
  { label: '2001',      years: [2001] },
  { label: '2008–2010', years: [2008, 2009, 2010] },
  { label: '2011–2020', years: Array.from({ length: 10 }, (_, i) => 2011 + i) },
  { label: '2021–2024', years: [2021, 2022, 2023, 2024] },
]

const SORT_OPTIONS = [
  { value: '-year_of_death', label: 'Most recent' },
  { value: 'year_of_death',  label: 'Oldest first' },
  { value: 'full_name',      label: 'Name A–Z' },
  { value: '-full_name',     label: 'Name Z–A' },
]

// Avatar colour palette — deterministic by victim id
const AVATAR_PALETTE = [
  '#6366f1', '#8b5cf6', '#14b8a6', '#10b981',
  '#3b82f6', '#f59e0b', '#ec4899', '#ef4444',
]
const avatarColor   = (id) => AVATAR_PALETTE[id % AVATAR_PALETTE.length]
const initials      = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

// ── Sub-components ──────────────────────────────────────────────────────

function Tag({ color, children }) {
  const styles = {
    blue:  { border: '1px solid rgba(96,165,250,0.4)',  color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
    teal:  { border: '1px solid rgba(45,212,191,0.4)',  color: '#2dd4bf', bg: 'rgba(45,212,191,0.08)' },
    green: { border: '1px solid rgba(52,211,153,0.4)',  color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
    slate: { border: '1px solid rgba(148,163,184,0.3)', color: '#94a3b8', bg: 'rgba(148,163,184,0.06)' },
  }
  const s = styles[color] || styles.slate
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ border: s.border, color: s.color, backgroundColor: s.bg }}
    >
      {children}
    </span>
  )
}

function FilterSection({ title, children }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-bold tracking-widest mb-3 dark:text-slate-600 text-slate-400"
        style={{ letterSpacing: '0.1em' }}>
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function FilterCheckbox({ label, count, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <div className="flex items-center gap-2.5">
        <div
          onClick={onChange}
          className="w-4 h-4 rounded flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          style={{
            backgroundColor: checked ? '#3b82f6' : 'transparent',
            border: checked ? '1px solid #3b82f6' : '1px solid var(--border-strong)',
          }}
        >
          {checked && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
            </svg>
          )}
        </div>
        <span className="text-sm dark:text-slate-300 text-slate-600 dark:group-hover:text-white group-hover:text-slate-900 transition-colors">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-xs dark:text-slate-500 text-slate-400">{count.toLocaleString()}</span>
      )}
    </label>
  )
}

// ── Main component ──────────────────────────────────────────────────────

export default function RegisterPage() {
  const navigate = useNavigate()

  const registerIntro        = useContent('register_intro',          'A record of individuals killed during ethno-religious and communal conflicts. All records are published with the consent of families or community representatives.')
  const registerYearsCovered = useContent('register_years_covered',  '2001–2024')
  const pilotLocation        = useContent('register_pilot_location',  'Phase 1')
  const pilotLabel           = useContent('register_pilot_label',     'CURRENT\nPHASE')

  // Server-side data
  const [victims, setVictims]     = useState([])
  const [totalCount, setTotal]    = useState(0)
  const [stats, setStats]         = useState(null)

  // Filter state
  const [genders, setGenders]             = useState(['M', 'F', 'NR'])
  const [yearRanges, setYearRanges]       = useState([])          // labels e.g. '2001'
  const [selectedWards, setSelectedWards] = useState([])
  const [hasOralHistory, setHasOralHistory] = useState(false)
  const [locationMapped, setLocationMapped] = useState(false)
  const [consentTypes, setConsentTypes]   = useState([])          // CONSENTED, ANONYMOUS

  // Controls
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState('-year_of_death')
  const [page, setPage]       = useState(1)
  const PAGE_SIZE = 25

  // ── Fetch stats once on mount ──────────────────────────────────────
  useEffect(() => {
    axios.get('/api/victims/stats/').then(res => setStats(res.data))
  }, [])

  // ── Fetch victim list whenever filters change ──────────────────────
  const fetchVictims = useCallback(() => {
    const params = new URLSearchParams()
    params.set('page', page)
    params.set('page_size', PAGE_SIZE)
    params.set('ordering', sort)
    if (search)        params.set('search', search)
    if (genders.length && genders.length < 3)
                       params.set('genders', genders.join(','))
    if (yearRanges.length) {
      const years = yearRanges.flatMap(
        label => YEAR_RANGES.find(r => r.label === label)?.years ?? []
      )
      params.set('years', years.join(','))
    }
    if (selectedWards.length)    params.set('wards', selectedWards.join(','))
    if (hasOralHistory)          params.set('has_oral_history', 'true')
    if (locationMapped)          params.set('location_mapped', 'true')
    if (consentTypes.length && consentTypes.length < 2)
                                 params.set('consent_types', consentTypes.join(','))

    axios.get(`/api/victims/?${params}`).then(res => {
      setVictims(res.data.results ?? [])
      setTotal(res.data.count ?? 0)
    })
  }, [page, sort, search, genders, yearRanges, selectedWards, hasOralHistory, locationMapped, consentTypes])

  useEffect(() => { fetchVictims() }, [fetchVictims])
  useEffect(() => { setPage(1) }, [sort, search, genders, yearRanges, selectedWards, hasOralHistory, locationMapped, consentTypes])

  // ── Filter helpers ─────────────────────────────────────────────────
  const toggleGender = (g) =>
    setGenders(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const toggleYearRange = (label) =>
    setYearRanges(prev => prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label])

  const toggleWard = (ward) =>
    setSelectedWards(prev => prev.includes(ward) ? prev.filter(x => x !== ward) : [...prev, ward])

  const toggleConsentType = (type) =>
    setConsentTypes(prev => prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type])

  const clearAll = () => {
    setGenders(['M', 'F', 'NR'])
    setYearRanges([])
    setSelectedWards([])
    setHasOralHistory(false)
    setLocationMapped(false)
    setConsentTypes([])
    setSearch('')
  }

  // ── Active filter pills ────────────────────────────────────────────
  const activePills = []
  const genderLabels = genders.map(g => GENDER_LABELS[g])
  if (genders.length < 3 && genders.length > 0)
    activePills.push({ label: genderLabels.join(' + '), onRemove: () => setGenders(['M','F','NR']) })
  if (yearRanges.length > 0)
    activePills.push({ label: yearRanges.join(' · '), onRemove: () => setYearRanges([]) })
  if (selectedWards.length > 0)
    activePills.push({ label: selectedWards.slice(0, 2).join(' · ') + (selectedWards.length > 2 ? ` +${selectedWards.length - 2}` : ''), onRemove: () => setSelectedWards([]) })
  if (hasOralHistory)
    activePills.push({ label: 'Has oral history', onRemove: () => setHasOralHistory(false) })
  if (locationMapped)
    activePills.push({ label: 'Location mapped', onRemove: () => setLocationMapped(false) })
  if (consentTypes.length > 0)
    activePills.push({ label: consentTypes.join(' + '), onRemove: () => setConsentTypes([]) })

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Top wards from stats (top 4 + Other)
  const topWards = stats?.top_wards?.slice(0, 4) ?? []

  // ── Export CSV (admin only — just opens the filtered URL) ─────────
  const handleExport = () => {
    alert('CSV export is available to administrators only via the admin panel.')
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-full">

      {/* ── Left sidebar ── */}
      <aside
        className="w-56 shrink-0 border-r px-5 py-8 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-surface)' }}
      >
        <FilterSection title="GENDER">
          {['M', 'F', 'NR'].map(g => (
            <FilterCheckbox
              key={g}
              label={GENDER_LABELS[g]}
              count={stats?.gender_counts?.[g]}
              checked={genders.includes(g)}
              onChange={() => toggleGender(g)}
            />
          ))}
        </FilterSection>

        <FilterSection title="YEAR OF DEATH">
          {YEAR_RANGES.map(r => (
            <FilterCheckbox
              key={r.label}
              label={r.label}
              count={stats?.year_range_counts?.[r.label.replace('–', '-')]}
              checked={yearRanges.includes(r.label)}
              onChange={() => toggleYearRange(r.label)}
            />
          ))}
        </FilterSection>

        <FilterSection title="WARD">
          {topWards.map(w => (
            <FilterCheckbox
              key={w.community_ward}
              label={w.community_ward}
              count={w.n}
              checked={selectedWards.includes(w.community_ward)}
              onChange={() => toggleWard(w.community_ward)}
            />
          ))}
          <FilterCheckbox
            label="Other / unknown"
            checked={false}
            onChange={() => {}}
          />
        </FilterSection>

        <FilterSection title="RECORD TYPE">
          <FilterCheckbox
            label="Has oral history"
            count={stats?.record_type_counts?.has_oral_history}
            checked={hasOralHistory}
            onChange={() => setHasOralHistory(v => !v)}
          />
          <FilterCheckbox
            label="Location mapped"
            count={stats?.record_type_counts?.location_mapped}
            checked={locationMapped}
            onChange={() => setLocationMapped(v => !v)}
          />
          <FilterCheckbox
            label="Named (consented)"
            count={stats?.record_type_counts?.named_consented}
            checked={consentTypes.includes('CONSENTED')}
            onChange={() => toggleConsentType('CONSENTED')}
          />
          <FilterCheckbox
            label="Anonymous only"
            count={stats?.record_type_counts?.anonymous}
            checked={consentTypes.includes('ANONYMOUS')}
            onChange={() => toggleConsentType('ANONYMOUS')}
          />
        </FilterSection>

        <button
          onClick={clearAll}
          className="w-full text-sm dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 border rounded-lg py-2 mt-2 transition-colors"
          style={{ borderColor: 'var(--border-strong)' }}
        >
          Clear all filters
        </button>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 px-8 py-8 min-w-0">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs dark:text-slate-500 text-slate-400 mb-6">
          <Link to="/" className="dark:hover:text-slate-300 hover:text-slate-600 transition-colors">Home</Link>
          <span>›</span>
          <span className="dark:text-slate-300 text-slate-600">Memorial register</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-2">Memorial register</h1>
            <p className="dark:text-slate-400 text-slate-500 text-sm leading-relaxed max-w-lg">
              {registerIntro}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="flex items-center gap-1.5 text-sm dark:text-slate-300 text-slate-600 border rounded-lg px-4 py-2 dark:hover:text-white hover:text-slate-900 transition-colors"
              style={{ borderColor: 'var(--border-strong)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Cite this register
            </button>
            <button
              className="flex items-center gap-1.5 text-sm font-medium text-white rounded-lg px-4 py-2"
              style={{ backgroundColor: '#3b82f6' }}
            >
              Request record
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-5 rounded-xl mb-8 overflow-hidden border"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}
        >
          {[
            { value: stats?.total?.toLocaleString() ?? '—', label: 'NAMES\nRECORDED' },
            { value: stats?.oral_histories?.toLocaleString() ?? '—', label: 'ORAL\nHISTORIES' },
            { value: stats?.locations_mapped?.toLocaleString() ?? '—', label: 'LOCATIONS\nMAPPED' },
            { value: registerYearsCovered, label: 'YEARS\nCOVERED' },
          ].map((s, i) => (
            <div
              key={i}
              className="px-5 py-4 border-r"
              style={{ borderColor: 'var(--border)' }}
            >
              <p className="text-2xl font-bold dark:text-white text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs mt-1 whitespace-pre-line leading-relaxed dark:text-slate-600 text-slate-400"
                style={{ letterSpacing: '0.06em' }}>
                {s.label}
              </p>
            </div>
          ))}
          {/* Highlighted community card */}
          <div
            className="px-5 py-4"
            style={{ backgroundColor: 'rgba(96,165,250,0.12)' }}
          >
            <p className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{pilotLocation}</p>
            <p className="text-xs mt-1 leading-relaxed whitespace-pre-line"
              style={{ color: 'rgba(96,165,250,0.6)', letterSpacing: '0.06em' }}>
              {pilotLabel}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48 max-w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search names…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm dark:text-white text-slate-900 dark:placeholder-slate-500 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-sm dark:text-slate-300 text-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)' }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>Sort: {o.label}</option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-sm dark:text-slate-300 text-slate-600 dark:hover:text-white hover:text-slate-900 border rounded-lg px-3 py-2 transition-colors ml-auto"
            style={{ borderColor: 'var(--border-strong)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Active filter pills */}
        {activePills.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {activePills.map((pill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs dark:text-slate-300 text-slate-600 rounded-full px-3 py-1"
                style={{ border: '1px solid var(--border-strong)', backgroundColor: 'var(--bg-subtle)' }}
              >
                {pill.label}
                <button onClick={pill.onRemove} className="dark:text-slate-500 text-slate-400 dark:hover:text-white hover:text-slate-900 ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}

        {/* Record count line */}
        <p className="text-xs dark:text-slate-500 text-slate-400 mb-4">
          Showing <span className="dark:text-slate-300 text-slate-700 font-medium">{totalCount.toLocaleString()}</span> records
          &nbsp;·&nbsp; filtered by: all consented &amp; anonymous
        </p>

        {/* Table */}
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          {/* Table header */}
          <div
            className="grid text-xs font-medium dark:text-slate-500 text-slate-400 px-4 py-3 border-b"
            style={{ gridTemplateColumns: '2fr 80px 140px 1fr 40px', backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)' }}
          >
            <span className="flex items-center gap-1">
              NAME &amp; LOCATION
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
            <span>YEAR</span>
            <span>AGE · GENDER</span>
            <span>RECORD DETAILS</span>
            <span />
          </div>

          {/* Rows */}
          {victims.length === 0 && (
            <div className="px-4 py-12 text-center dark:text-slate-500 text-slate-400 text-sm">
              No records match your filters.
            </div>
          )}

          {victims.map(v => {
            const isAnon = v.consent_status === 'ANONYMOUS'
            const bgColor = isAnon ? '#64748b' : avatarColor(v.id)
            const inits = initials(v.display_name)

            return (
              <div
                key={v.id}
                className="grid items-center px-4 py-3.5 border-b cursor-pointer transition-colors dark:hover:bg-white/[0.03] hover:bg-black/[0.03]"
                style={{
                  gridTemplateColumns: '2fr 80px 140px 1fr 40px',
                  borderColor: 'var(--border)',
                }}
                onClick={() => navigate(`/victims/${v.id}`)}
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: bgColor }}
                  >
                    {inits}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium dark:text-white text-slate-900 truncate">{v.display_name}</p>
                    <p className="text-xs dark:text-slate-500 text-slate-400 truncate">{v.community_ward}</p>
                  </div>
                </div>

                {/* Year */}
                <span className="text-sm dark:text-slate-300 text-slate-600">{v.effective_year ?? '—'}</span>

                {/* Age · Gender */}
                <span className="text-sm dark:text-slate-400 text-slate-500">
                  {v.age_at_death != null
                    ? `${isAnon ? '~' : ''}${v.age_at_death} yrs`
                    : '— yrs'}
                  {' · '}
                  {GENDER_LABELS[v.gender] ?? '—'}
                </span>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {v.has_oral_history && <Tag color="blue">Oral history</Tag>}
                  {v.is_mapped        && <Tag color="teal">Mapped</Tag>}
                  {v.consent_status === 'CONSENTED' && <Tag color="green">Consented</Tag>}
                  {v.consent_status === 'ANONYMOUS' && <Tag color="slate">Anonymous</Tag>}
                </div>

                {/* Arrow */}
                <div className="flex justify-end">
                  <svg className="w-4 h-4 dark:text-slate-600 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 text-sm">
            <span className="dark:text-slate-500 text-slate-400">
              Page {page} of {totalPages.toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-1.5 rounded-lg dark:text-slate-300 text-slate-600 disabled:opacity-30 dark:hover:text-white hover:text-slate-900 transition-colors"
                style={{ border: '1px solid var(--border-strong)' }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-1.5 rounded-lg dark:text-slate-300 text-slate-600 disabled:opacity-30 dark:hover:text-white hover:text-slate-900 transition-colors"
                style={{ border: '1px solid var(--border-strong)' }}
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
