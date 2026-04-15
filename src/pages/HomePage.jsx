import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import axios from 'axios'
import { useContent } from '../context/ContentContext'

// ── Constants ────────────────────────────────────────────────────────────────

const JOS_CENTER = [9.917, 8.896]
const PREVIEW_MARKERS = [
  { center: [9.924, 8.891], color: '#60a5fa', r: 8 },
  { center: [9.912, 8.903], color: '#f87171', r: 6 },
  { center: [9.930, 8.910], color: '#34d399', r: 5 },
  { center: [9.908, 8.887], color: '#f87171', r: 9 },
  { center: [9.920, 8.895], color: '#60a5fa', r: 5 },
  { center: [9.916, 8.915], color: '#78716c', r: 6 },
  { center: [9.905, 8.900], color: '#34d399', r: 4 },
]

const AVATAR_PALETTE = [
  '#4b6bfb', '#8b5cf6', '#14b8a6', '#10b981',
  '#3b82f6', '#f59e0b', '#ec4899', '#ef4444',
]
const avatarColor = (id) => AVATAR_PALETTE[id % AVATAR_PALETTE.length]
const initials    = (name) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')

const GENDER_LABELS = { M: 'Male', F: 'Female', NR: 'Not recorded' }

// ── Decorative memorial illustration ────────────────────────────────────────

function MemorialIllustration() {
  return (
    <svg viewBox="0 0 380 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Soft background circles */}
      <circle cx="190" cy="170" r="155" fill="rgba(75,107,251,0.05)" />
      <circle cx="190" cy="170" r="110" fill="rgba(75,107,251,0.05)" />

      {/* Map grid lines */}
      {[60,100,140,180,220,260,300].map(x => (
        <line key={`v${x}`} x1={x} y1="60" x2={x} y2="290"
          stroke="rgba(75,107,251,0.08)" strokeWidth="1" />
      ))}
      {[80,120,160,200,240,280].map(y => (
        <line key={`h${y}`} x1="50" y1={y} x2="330" y2={y}
          stroke="rgba(75,107,251,0.08)" strokeWidth="1" />
      ))}

      {/* Central memorial stone */}
      <rect x="158" y="130" width="64" height="90" rx="32" fill="rgba(75,107,251,0.12)"
        stroke="rgba(75,107,251,0.3)" strokeWidth="1.5" />
      <rect x="144" y="218" width="92" height="12" rx="6" fill="rgba(75,107,251,0.18)"
        stroke="rgba(75,107,251,0.3)" strokeWidth="1.5" />

      {/* Cross on memorial */}
      <line x1="190" y1="148" x2="190" y2="200" stroke="rgba(75,107,251,0.5)" strokeWidth="2" strokeLinecap="round" />
      <line x1="174" y1="165" x2="206" y2="165" stroke="rgba(75,107,251,0.5)" strokeWidth="2" strokeLinecap="round" />

      {/* Left candle */}
      <rect x="122" y="185" width="14" height="36" rx="3" fill="rgba(251,191,36,0.25)"
        stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" />
      {/* Left flame */}
      <path d="M129 185 C125 178 124 170 129 165 C134 170 133 178 129 185Z"
        fill="rgba(251,191,36,0.7)" />
      <path d="M129 183 C127 178 126 173 129 169 C132 173 131 178 129 183Z"
        fill="rgba(255,237,153,0.9)" />

      {/* Right candle */}
      <rect x="244" y="185" width="14" height="36" rx="3" fill="rgba(251,191,36,0.25)"
        stroke="rgba(251,191,36,0.5)" strokeWidth="1.5" />
      {/* Right flame */}
      <path d="M251 185 C247 178 246 170 251 165 C256 170 255 178 251 185Z"
        fill="rgba(251,191,36,0.7)" />
      <path d="M251 183 C249 178 248 173 251 169 C254 173 253 178 251 183Z"
        fill="rgba(255,237,153,0.9)" />

      {/* Leaves / florals left */}
      <path d="M100 230 C85 215 80 200 95 195 C102 210 108 222 100 230Z"
        fill="rgba(52,211,153,0.3)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
      <path d="M108 235 C90 228 82 215 92 208 C104 218 112 230 108 235Z"
        fill="rgba(52,211,153,0.2)" stroke="rgba(52,211,153,0.4)" strokeWidth="1" />
      <path d="M115 240 C100 238 90 228 96 220 C110 225 118 236 115 240Z"
        fill="rgba(52,211,153,0.25)" stroke="rgba(52,211,153,0.4)" strokeWidth="1" />

      {/* Leaves / florals right */}
      <path d="M280 230 C295 215 300 200 285 195 C278 210 272 222 280 230Z"
        fill="rgba(52,211,153,0.3)" stroke="rgba(52,211,153,0.5)" strokeWidth="1" />
      <path d="M272 235 C290 228 298 215 288 208 C276 218 268 230 272 235Z"
        fill="rgba(52,211,153,0.2)" stroke="rgba(52,211,153,0.4)" strokeWidth="1" />
      <path d="M265 240 C280 238 290 228 284 220 C270 225 262 236 265 240Z"
        fill="rgba(52,211,153,0.25)" stroke="rgba(52,211,153,0.4)" strokeWidth="1" />

      {/* Small flowers */}
      {[[150, 255], [230, 258], [170, 268], [210, 265]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="5" fill="rgba(248,113,113,0.3)"
            stroke="rgba(248,113,113,0.5)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r="2" fill="rgba(248,113,113,0.6)" />
        </g>
      ))}

      {/* Map location pins */}
      {[[90, 120], [300, 140], [310, 250], [80, 260]].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r="6" fill={`rgba(75,107,251,${0.15 + i * 0.05})`}
            stroke="rgba(75,107,251,0.4)" strokeWidth="1.2" />
          <circle cx={cx} cy={cy} r="2.5" fill="rgba(75,107,251,0.7)" />
          <line x1={cx} y1={cy + 6} x2={cx} y2={cy + 14}
            stroke="rgba(75,107,251,0.35)" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      ))}

      {/* Connecting dotted lines between pins */}
      <path d="M90 120 Q140 100 190 130" stroke="rgba(75,107,251,0.2)" strokeWidth="1"
        strokeDasharray="3 4" fill="none" />
      <path d="M300 140 Q260 100 190 130" stroke="rgba(75,107,251,0.2)" strokeWidth="1"
        strokeDasharray="3 4" fill="none" />
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()

  const [stats,        setStats]        = useState(null)
  const [victims,      setVictims]      = useState([])
  const [oralHistory,  setOralHistory]  = useState(null)
  const [initiatives,  setInitiatives]  = useState([])

  // CMS — hero
  const heroBadge     = useContent('hero_badge',     'MIDDLE BELT, NIGERIA')
  const heroHeadline  = useContent('hero_headline',  'Remembering the names behind the numbers')
  const heroHighlight = useContent('hero_headline_highlight', 'names behind')
  const heroSubtitle  = useContent('hero_subtitle',
    'A memorial register and digital map preserving the identities, stories, and places of individuals killed in ethno-religious and communal conflicts across the Middle Belt region of Nigeria.')
  const heroQuote     = useContent('hero_quote', '"If we cannot stop the killings, we can stop the erasure."')
  const heroCtaMap    = useContent('hero_cta_map',      'Explore the map')
  const heroCtaReg    = useContent('hero_cta_register', 'Browse the register')
  const mapAreaLabel  = useContent('map_area_label',    'Jos, Plateau State')

  // CMS — stats
  const statsNamesLabel     = useContent('stats_names_label',        'NAMES\nRECORDED')
  const statsHistoriesLabel = useContent('stats_histories_label',    'ORAL\nHISTORIES')
  const statsCommunityValue = useContent('stats_communities_value',  '1')
  const statsCommunityLabel = useContent('stats_communities_label',  'STATES\nCOVERED')
  const statsYearsValue     = useContent('stats_years_value',        '2001–2024')
  const statsYearsLabel     = useContent('stats_years_label',        'YEARS\nDOCUMENTED')

  // CMS — features
  const featuresSectionLabel = useContent('features_section_label', 'PLATFORM FEATURES')
  const featuresHeading      = useContent('features_heading',       'Built for memory. Designed for dignity.')
  const featuresSubheading   = useContent('features_subheading',
    'Every feature is shaped by the ethical responsibility of working with names of the dead and stories of the living.')

  // CMS — victims showcase
  const showcaseHeading    = useContent('showcase_heading',    'From the memorial register')
  const showcaseSubheading = useContent('showcase_subheading', 'Recently documented individuals. Each record is published with the consent of families or community representatives.')

  // CMS — oral history
  const oralHeading    = useContent('oral_spotlight_heading',    'A voice from the community')
  const oralSubheading = useContent('oral_spotlight_subheading', 'Oral histories preserve not just names, but context — the relationships, the circumstances, and the grief of those left behind.')

  // CMS — CTA banner
  const ctaBannerHeading = useContent('cta_banner_heading', 'Does your community have names to preserve?')
  const ctaBannerBody    = useContent('cta_banner_body',
    'Anyone in the Middle Belt region can submit a record. Every name submitted is reviewed, verified, and published with community consent.')
  const ctaBannerCta = useContent('cta_banner_cta', 'Submit a record')

  // CMS — initiatives
  const initiativesHeading    = useContent('initiatives_preview_heading',    'Communities in action')
  const initiativesSubheading = useContent('initiatives_preview_subheading', 'Local peacebuilding and remembrance activities organised by communities across the Middle Belt region.')

  useEffect(() => {
    axios.get('/api/victims/stats/').then(r => setStats(r.data)).catch(() => {})
    axios.get('/api/victims/?page_size=6').then(r => setVictims(r.data.results ?? [])).catch(() => {})
    axios.get('/api/oral-histories/?page_size=1').then(r => {
      const results = r.data.results ?? r.data
      if (Array.isArray(results) && results.length > 0) setOralHistory(results[0])
    }).catch(() => {})
    axios.get('/api/initiatives/?page_size=3').then(r => setInitiatives(r.data.results ?? [])).catch(() => {})
  }, [])

  const renderHeadline = () => {
    if (!heroHighlight || !heroHeadline.includes(heroHighlight)) return <>{heroHeadline}</>
    const [before, after] = heroHeadline.split(heroHighlight)
    return <>{before}<span style={{ color: '#4b6bfb' }}>{heroHighlight}</span>{after}</>
  }

  const totalNames     = stats?.total     ?? '—'
  const totalHistories = stats?.oral_histories ?? '—'

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>

      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f5f8ff 0%, #eef2ff 60%, #e8edff 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-7"
              style={{ backgroundColor: 'rgba(75,107,251,0.1)', color: '#4b6bfb', border: '1px solid rgba(75,107,251,0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4b6bfb' }} />
              {heroBadge}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold leading-tight dark:text-white text-slate-900 mb-5">
              {renderHeadline()}
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-5 max-w-md">
              {heroSubtitle}
            </p>

            <p className="text-slate-400 dark:text-slate-500 text-sm italic mb-8">{heroQuote}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/map"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white rounded-full px-6 py-2.5 transition-all shadow-md hover:shadow-lg hover:opacity-90"
                style={{ backgroundColor: '#4b6bfb' }}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {heroCtaMap}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-6 py-2.5 transition-all border-2 hover:shadow-md"
                style={{ borderColor: '#4b6bfb', color: '#4b6bfb' }}
              >
                {heroCtaReg}
              </Link>
            </div>
          </div>

          {/* Right — illustration + mini-map stacked */}
          <div className="flex flex-col gap-4">
            <div className="h-52 md:h-64">
              <MemorialIllustration />
            </div>
            <div
              className="relative h-52 rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 8px 40px rgba(75,107,251,0.18)', border: '1px solid rgba(75,107,251,0.15)' }}
            >
              <MapContainer
                center={JOS_CENTER} zoom={13}
                zoomControl={false} scrollWheelZoom={false}
                dragging={false} doubleClickZoom={false}
                attributionControl={false} className="h-full w-full"
              >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                {PREVIEW_MARKERS.map((m, i) => (
                  <CircleMarker key={i} center={m.center} radius={m.r}
                    pathOptions={{ color: m.color, fillColor: m.color, fillOpacity: 0.85, weight: 1.5 }} />
                ))}
              </MapContainer>
              <div
                className="absolute bottom-3 right-3 z-[1000] text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(0,0,0,0.45)' }}
              >
                {mapAreaLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="relative mx-6 md:mx-10 mb-10 rounded-2xl overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(75,107,251,0.15)',
            boxShadow: '0 4px 24px rgba(75,107,251,0.10)',
            maxWidth: '72rem',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4">
            {[
              { value: totalNames,          label: statsNamesLabel },
              { value: totalHistories,      label: statsHistoriesLabel },
              { value: statsCommunityValue, label: statsCommunityLabel },
              { value: statsYearsValue,     label: statsYearsLabel },
            ].map((s, i) => (
              <div key={i} className="py-7 px-6 border-r last:border-r-0"
                style={{ borderColor: 'rgba(75,107,251,0.10)' }}>
                <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{s.value}</p>
                <p className="text-xs font-semibold mt-1.5 whitespace-pre-line leading-relaxed text-slate-400"
                  style={{ letterSpacing: '0.08em' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 2. FEATURES ══════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-10 bg-white dark:bg-transparent">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold tracking-widest mb-4"
            style={{ letterSpacing: '0.15em', color: '#4b6bfb' }}>
            {featuresSectionLabel}
          </p>
          <h2 className="text-3xl md:text-4xl font-bold dark:text-white text-slate-900 mb-3">{featuresHeading}</h2>
          <p className="dark:text-slate-400 text-slate-500 text-base max-w-xl mb-12 leading-relaxed">{featuresSubheading}</p>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                color: '#4b6bfb',
                bg: 'rgba(75,107,251,0.08)',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                ),
                title: useContent('feature_1_title', 'Interactive Memorial Map'),
                body:  useContent('feature_1_description', 'Colour-coded markers plot last known homes, incident sites, and burial grounds across Middle Belt states.'),
                link:  '/map',
                cta:   'Open the map',
              },
              {
                color: '#f59e0b',
                bg: 'rgba(245,158,11,0.08)',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: useContent('feature_2_title', 'Searchable Register'),
                body:  useContent('feature_2_description', 'Browse and search victim records by name, gender, year, and community ward. Every name preserved with dignity.'),
                link:  '/register',
                cta:   'Browse records',
              },
              {
                color: '#10b981',
                bg: 'rgba(16,185,129,0.08)',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ),
                title: useContent('feature_3_title', 'Oral History Archive'),
                body:  useContent('feature_3_description', 'Audio recordings and written testimonies from family members and witnesses, linked to individual profiles.'),
                link:  '/register',
                cta:   'Hear their stories',
              },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border bg-white dark:bg-transparent transition-all hover:-translate-y-0.5"
                style={{ borderColor: 'rgba(75,107,251,0.12)', boxShadow: '0 2px 20px rgba(75,107,251,0.08)' }}>
                {/* Coloured header band */}
                <div className="h-24 flex items-center justify-center"
                  style={{ backgroundColor: f.bg }}>
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${f.color}20`, color: f.color, border: `1px solid ${f.color}30` }}>
                    {f.icon}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-bold dark:text-white text-slate-800 text-base mb-2">{f.title}</h3>
                  <p className="dark:text-slate-500 text-slate-500 text-sm leading-relaxed mb-4">{f.body}</p>
                  <Link to={f.link} className="text-sm font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-70"
                    style={{ color: f.color }}>
                    {f.cta}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 3. VICTIMS SHOWCASE ══════════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-10" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
            <div>
              <p className="text-xs font-bold tracking-widest mb-3"
                style={{ letterSpacing: '0.15em', color: '#4b6bfb' }}>
                THE REGISTER
              </p>
              <h2 className="text-3xl font-bold dark:text-white text-slate-900 mb-2">{showcaseHeading}</h2>
              <p className="dark:text-slate-400 text-slate-500 text-sm max-w-lg leading-relaxed">{showcaseSubheading}</p>
            </div>
            <Link
              to="/register"
              className="shrink-0 text-sm font-semibold rounded-full px-5 py-2.5 transition-all border-2 hover:shadow-md whitespace-nowrap"
              style={{ borderColor: '#4b6bfb', color: '#4b6bfb' }}
            >
              View full register
            </Link>
          </div>

          {victims.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border"
              style={{ borderColor: 'rgba(75,107,251,0.13)', backgroundColor: '#fff' }}>
              <p className="text-slate-400 text-sm">No records published yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {victims.map(v => {
                const isAnon = v.consent_status === 'ANONYMOUS'
                const bg = isAnon ? '#94a3b8' : avatarColor(v.id)
                return (
                  <div
                    key={v.id}
                    onClick={() => navigate(`/victims/${v.id}`)}
                    className="rounded-2xl p-5 border bg-white dark:bg-transparent cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ borderColor: 'rgba(75,107,251,0.12)', boxShadow: '0 2px 16px rgba(75,107,251,0.08)' }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: bg }}
                      >
                        {initials(v.display_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold dark:text-white text-slate-900 text-sm truncate">{v.display_name}</p>
                        <p className="text-xs dark:text-slate-500 text-slate-400 truncate mt-0.5">{v.community_ward}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="dark:text-slate-400 text-slate-500">
                        {GENDER_LABELS[v.gender] ?? '—'}
                        {v.effective_year ? ` · ${v.effective_year}` : ''}
                        {v.age_at_death != null ? ` · ${v.age_at_death} yrs` : ''}
                      </span>
                      <div className="flex gap-1.5">
                        {v.has_oral_history && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: 'rgba(75,107,251,0.1)', color: '#4b6bfb' }}>
                            Oral history
                          </span>
                        )}
                        {v.is_mapped && (
                          <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: 'rgba(20,184,166,0.1)', color: '#0d9488' }}>
                            Mapped
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══ 4. ORAL HISTORY SPOTLIGHT ════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-10 bg-white dark:bg-transparent">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

          {/* Left — text */}
          <div>
            <p className="text-xs font-bold tracking-widest mb-4"
              style={{ letterSpacing: '0.15em', color: '#10b981' }}>
              ORAL HISTORIES
            </p>
            <h2 className="text-3xl font-bold dark:text-white text-slate-900 mb-4 leading-snug">{oralHeading}</h2>
            <p className="dark:text-slate-400 text-slate-500 text-base leading-relaxed mb-8">{oralSubheading}</p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white rounded-full px-6 py-2.5 transition-all hover:opacity-90 shadow-md"
              style={{ backgroundColor: '#10b981' }}
            >
              Browse oral histories
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Right — featured oral history card or placeholder */}
          {oralHistory ? (
            <div className="rounded-2xl p-8 border relative overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'rgba(16,185,129,0.2)',
                boxShadow: '0 4px 30px rgba(16,185,129,0.10)',
              }}>
              {/* Decorative quote mark */}
              <div className="text-8xl font-serif leading-none mb-2 select-none"
                style={{ color: 'rgba(16,185,129,0.15)', lineHeight: 1 }}>
                &ldquo;
              </div>
              <p className="dark:text-slate-300 text-slate-700 text-base leading-relaxed italic mb-6 line-clamp-5">
                {oralHistory.transcript
                  ? oralHistory.transcript.slice(0, 320) + (oralHistory.transcript.length > 320 ? '…' : '')
                  : 'Transcript not available.'}
              </p>
              <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-white text-slate-800">
                    {oralHistory.interviewee_role || 'Community member'}
                  </p>
                  {oralHistory.date_recorded && (
                    <p className="text-xs dark:text-slate-500 text-slate-400 mt-0.5">
                      Recorded {new Date(oralHistory.date_recorded).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              {oralHistory.audio_file && (
                <audio controls className="mt-5 w-full rounded-lg" style={{ height: '36px' }}>
                  <source src={oralHistory.audio_file} />
                </audio>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'rgba(16,185,129,0.2)',
                minHeight: '280px',
              }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="font-semibold dark:text-white text-slate-700 mb-2">No oral histories yet</p>
              <p className="text-sm dark:text-slate-500 text-slate-400 max-w-xs leading-relaxed">
                Oral histories will appear here as families and community members contribute their testimonies.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ══ 5. CTA BANNER ════════════════════════════════════════════════════ */}
      <section className="py-16 px-6 md:px-10" style={{ backgroundColor: '#4b6bfb' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-snug">{ctaBannerHeading}</h2>
          <p className="text-blue-100 text-base leading-relaxed mb-8 max-w-xl mx-auto">{ctaBannerBody}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-7 py-3 transition-all hover:opacity-90 shadow-lg"
              style={{ backgroundColor: '#ffffff', color: '#4b6bfb' }}
            >
              {ctaBannerCta}
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold rounded-full px-7 py-3 transition-all border-2 text-white hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.45)' }}
            >
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* ══ 6. COMMUNITY INITIATIVES ═════════════════════════════════════════ */}
      <section className="py-20 px-6 md:px-10" style={{ backgroundColor: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
            <div>
              <p className="text-xs font-bold tracking-widest mb-3"
                style={{ letterSpacing: '0.15em', color: '#4b6bfb' }}>
                COMMUNITY
              </p>
              <h2 className="text-3xl font-bold dark:text-white text-slate-900 mb-2">{initiativesHeading}</h2>
              <p className="dark:text-slate-400 text-slate-500 text-sm max-w-lg leading-relaxed">{initiativesSubheading}</p>
            </div>
            <Link
              to="/initiatives"
              className="shrink-0 text-sm font-semibold rounded-full px-5 py-2.5 transition-all border-2 hover:shadow-md whitespace-nowrap"
              style={{ borderColor: '#4b6bfb', color: '#4b6bfb' }}
            >
              All initiatives
            </Link>
          </div>

          {initiatives.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border bg-white"
              style={{ borderColor: 'rgba(75,107,251,0.13)' }}>
              <p className="text-slate-400 text-sm">No initiatives published yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {initiatives.map(ini => (
                <div key={ini.id}
                  className="rounded-2xl p-6 border bg-white dark:bg-transparent transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderColor: 'rgba(75,107,251,0.12)', boxShadow: '0 2px 16px rgba(75,107,251,0.08)' }}>

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: 'rgba(75,107,251,0.1)', color: '#4b6bfb' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>

                  <h3 className="font-bold dark:text-white text-slate-800 text-sm mb-1">{ini.name}</h3>
                  <p className="text-xs font-medium mb-3" style={{ color: '#4b6bfb' }}>{ini.organising_body}</p>
                  <p className="text-xs dark:text-slate-500 text-slate-500 leading-relaxed mb-4 line-clamp-3">
                    {ini.description}
                  </p>

                  <div className="flex items-center justify-between text-xs dark:text-slate-500 text-slate-400 mt-auto pt-3 border-t"
                    style={{ borderColor: 'rgba(75,107,251,0.08)' }}>
                    {ini.date && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(ini.date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {ini.location_name && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ini.location_name}
                      </span>
                    )}
                    {ini.url && (
                      <a href={ini.url} target="_blank" rel="noopener noreferrer"
                        className="font-semibold hover:opacity-70 transition-opacity ml-auto"
                        style={{ color: '#4b6bfb' }}>
                        Learn more →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
